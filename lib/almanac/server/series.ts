import "server-only";
import { GenerationError, streamText } from "@/lib/claude";
import { SAMPLE_LESSONS, SAMPLE_SERIES } from "../fixtures/sample-series";
import { LESSONS_PER_SERIES, percentComplete, seriesStatus } from "../rules";
import {
  AlmanacError,
  type ChoiceQuestion,
  type Series,
  type SeriesLesson,
  type SeriesLessonRow,
  type SeriesSummary,
  type Subject,
} from "../types";
import { Channel, paragraphsOf } from "./channel";
import { claim, release, waitFor } from "./claims";
import { check, db, isUuid, requireUser, type Learner } from "./context";
import { prepareMastery } from "./mastery";
import { seriesProsePrompt } from "./prompts";

export type SeriesRow = {
  id: string;
  user_id: string;
  is_sample: boolean;
  title: string;
  category: Subject;
  description: string;
  focus_line: string | null;
  placement_score: number | null;
  mastery_passed: boolean;
  mastery_best: number | null;
  updated_at: string;
};

export type LessonRow = {
  number: number;
  title: string;
  description: string;
  why: string;
  focus: boolean;
  key_points: string[];
  check_question: ChoiceQuestion;
  ask_hint: string;
  paragraphs: string[] | null;
  check_answer: number | null;
};

const SERIES_COLUMNS =
  "id, user_id, is_sample, title, category, description, focus_line, placement_score, mastery_passed, mastery_best, updated_at";
const LESSON_COLUMNS = "number, title, description, why, focus, key_points, check_question, ask_hint, paragraphs, check_answer";

/** The public sample, before a learner has answered anything in it. */
function sampleSeriesRow(userId: string): SeriesRow {
  return {
    id: SAMPLE_SERIES.id,
    user_id: userId,
    is_sample: true,
    title: SAMPLE_SERIES.title,
    category: SAMPLE_SERIES.category,
    description: SAMPLE_SERIES.description,
    focus_line: null,
    placement_score: null,
    mastery_passed: false,
    mastery_best: null,
    updated_at: new Date().toISOString(),
  };
}

function sampleLessonRows(): LessonRow[] {
  return SAMPLE_LESSONS.map((lesson, i) => ({
    number: i + 1,
    title: lesson.title,
    description: lesson.description,
    why: SAMPLE_SERIES.whys[i] ?? "",
    focus: SAMPLE_SERIES.focus[i] ?? false,
    key_points: [],
    check_question: lesson.check,
    ask_hint: lesson.askHint,
    paragraphs: lesson.paragraphs,
    check_answer: null,
  }));
}

/** The id the screens use: the sample is always "sample". */
const publicId = (row: SeriesRow) => (row.is_sample ? SAMPLE_SERIES.id : row.id);

export function summarize(row: SeriesRow, lessons: LessonRow[]): SeriesSummary {
  const sorted = [...lessons].sort((a, b) => a.number - b.number);
  const lessonsDone = sorted.filter((l) => l.check_answer !== null).length;
  const next = sorted.find((l) => l.check_answer === null);
  return {
    id: publicId(row),
    title: row.title,
    category: row.category,
    description: row.description,
    status: seriesStatus(lessonsDone, row.mastery_passed),
    lessonsDone,
    masteryPassed: row.mastery_passed,
    masteryBest: row.mastery_best,
    percent: percentComplete(lessonsDone, row.mastery_passed),
    updatedAt: row.updated_at,
    isSample: row.is_sample,
    nextLesson: next ? { number: next.number, title: next.title } : null,
  };
}

async function lessonsOf(seriesId: string): Promise<LessonRow[]> {
  const rows = check(
    await db().from("series_lessons").select(LESSON_COLUMNS).eq("series_id", seriesId).order("number")
  ) as LessonRow[];
  return rows;
}

/**
 * Finds a series for this learner. "sample" is their own copy of the sample,
 * or a fresh one when they haven't answered anything in it yet (`stored` false).
 */
export async function resolveSeries(
  learner: Learner,
  id: string
): Promise<{ row: SeriesRow; lessons: LessonRow[]; stored: boolean }> {
  if (id === SAMPLE_SERIES.id) {
    if (learner.userId) {
      const own = check(
        await db().from("series").select(SERIES_COLUMNS).eq("user_id", learner.userId).eq("is_sample", true).maybeSingle()
      ) as SeriesRow | null;
      if (own) return { row: own, lessons: await lessonsOf(own.id), stored: true };
    }
    return { row: sampleSeriesRow(learner.userId ?? ""), lessons: sampleLessonRows(), stored: false };
  }
  if (!learner.userId || !isUuid(id)) throw new AlmanacError("notFound");
  const row = check(
    await db().from("series").select(SERIES_COLUMNS).eq("id", id).eq("user_id", learner.userId).maybeSingle()
  ) as SeriesRow | null;
  if (!row) throw new AlmanacError("notFound");
  return { row, lessons: await lessonsOf(row.id), stored: true };
}

/** Makes the learner's own copy of the sample, so its checks can be answered. */
async function storeSample(userId: string): Promise<SeriesRow> {
  const base = sampleSeriesRow(userId);
  // One sample copy per learner (a partial unique index): a second insert fails and the first is used.
  const inserted = await db()
    .from("series")
    .insert({ user_id: userId, is_sample: true, title: base.title, category: base.category, description: base.description })
    .select(SERIES_COLUMNS)
    .maybeSingle();
  if (inserted.error && inserted.error.code !== "23505") check(inserted);
  let row = (inserted.data as SeriesRow | null) ?? null;
  if (!row) {
    row = check(
      await db().from("series").select(SERIES_COLUMNS).eq("user_id", userId).eq("is_sample", true).maybeSingle()
    ) as SeriesRow | null;
  }
  if (!row) throw new AlmanacError("loadFailed");
  check(
    await db()
      .from("series_lessons")
      .upsert(
        sampleLessonRows().map((l) => ({ ...l, series_id: row!.id })),
        { onConflict: "series_id,number", ignoreDuplicates: true }
      )
  );
  return row;
}

export async function continueSeriesFor(userId: string | null): Promise<SeriesSummary | null> {
  if (!userId) return null;
  const list = await listSeries({ userId, isGuest: false, today: "", defer: () => {} });
  return list.find((s) => s.status === "inProgress" && s.nextLesson) ?? null;
}

export async function listSeries(learner: Learner): Promise<SeriesSummary[]> {
  if (!learner.userId) return [];
  const rows = check(
    await db()
      .from("series")
      .select(`${SERIES_COLUMNS}, series_lessons(number, title, check_answer)`)
      .eq("user_id", learner.userId)
      .eq("is_sample", false)
      .order("updated_at", { ascending: false })
  ) as Array<SeriesRow & { series_lessons: LessonRow[] }>;
  return rows.map((row) => summarize(row, row.series_lessons));
}

export async function getSeries(learner: Learner, id: string): Promise<Series> {
  const { row, lessons } = await resolveSeries(learner, id);
  return {
    ...summarize(row, lessons),
    focusLine: row.focus_line,
    placementScore: row.placement_score,
    lessons: lessons.map(
      (l): SeriesLessonRow => ({
        number: l.number,
        title: l.title,
        description: l.description,
        why: l.why,
        focus: l.focus,
        done: l.check_answer !== null,
        written: l.paragraphs !== null,
      })
    ),
  };
}

export async function deleteSeries(learner: Learner, id: string) {
  const userId = requireUser(learner);
  if (!isUuid(id)) return;
  check(await db().from("series").delete().eq("id", id).eq("user_id", userId).eq("is_sample", false));
}

function toLesson(row: SeriesRow, lessons: LessonRow[], number: number): SeriesLesson {
  const lesson = lessons.find((l) => l.number === number);
  if (!lesson) throw new AlmanacError("notFound");
  const next = lessons.find((l) => l.number === number + 1);
  return {
    seriesId: publicId(row),
    seriesTitle: row.title,
    number,
    title: lesson.title,
    description: lesson.description,
    why: lesson.why,
    paragraphs: lesson.paragraphs,
    check: lesson.check_question,
    checkAnswer: lesson.check_answer,
    askHint: lesson.ask_hint,
    nextReady: Boolean(next?.paragraphs),
    unfinished: lessons.filter((l) => l.check_answer === null).map((l) => l.number),
  };
}

export async function getSeriesLesson(learner: Learner, id: string, number: number): Promise<SeriesLesson> {
  const { row, lessons, stored } = await resolveSeries(learner, id);
  const lesson = toLesson(row, lessons, number);
  // Opening a written lesson writes the next one ahead, so "Next" opens at once.
  if (stored && !row.is_sample && lesson.paragraphs && number < LESSONS_PER_SERIES && !lesson.nextReady) {
    learner.defer(writeAhead(row, number + 1));
  }
  return lesson;
}

// ---- Writing lessons ----

async function writeLesson(row: SeriesRow, lesson: LessonRow, onText: (text: string) => void): Promise<string[]> {
  let text = "";
  const prompt = seriesProsePrompt(row.title, lesson.number, lesson.title, lesson.key_points, lesson.focus);
  for await (const chunk of streamText({ ...prompt, effort: "medium", maxTokens: 5_000 })) {
    text += chunk;
    onText(chunk);
  }
  const paragraphs = paragraphsOf(text);
  if (paragraphs.length < 2) throw new GenerationError("The lesson came back too short");
  check(
    await db()
      .from("series_lessons")
      .update({ paragraphs })
      .eq("series_id", row.id)
      .eq("number", lesson.number)
      .is("paragraphs", null)
  );
  return paragraphs;
}

/** Writes a lesson nobody is reading yet. Quietly does nothing if someone else is writing it. */
export async function writeAhead(row: SeriesRow, number: number): Promise<void> {
  try {
    const lessons = await lessonsOf(row.id);
    const lesson = lessons.find((l) => l.number === number);
    if (!lesson || lesson.paragraphs) return;
    const held = await claim(`series-prose:${row.id}:${number}`);
    if (!held) return;
    try {
      await writeLesson(row, lesson, () => {});
    } finally {
      await release(held);
    }
  } catch (cause) {
    console.error("[almanac] write ahead:", cause);
  }
}

export async function* streamSeriesLesson(learner: Learner, id: string, number: number): AsyncGenerator<string> {
  const { row, lessons, stored } = await resolveSeries(learner, id);
  const lesson = lessons.find((l) => l.number === number);
  if (!lesson) throw new AlmanacError("notFound");
  if (lesson.paragraphs) {
    yield lesson.paragraphs.join("\n\n");
    return;
  }
  if (!stored) throw new AlmanacError("notFound");

  const key = `series-prose:${row.id}:${number}`;
  const held = await claim(key);
  if (!held) {
    const paragraphs = await waitFor(async () => (await lessonsOf(row.id)).find((l) => l.number === number)?.paragraphs ?? null);
    yield paragraphs.join("\n\n");
    return;
  }

  const channel = new Channel<string>();
  learner.defer(
    writeLesson(row, lesson, (text) => channel.push(text))
      .then(() => {
        channel.close();
        return number < LESSONS_PER_SERIES ? writeAhead(row, number + 1) : undefined;
      })
      .catch((cause) => {
        console.error("[almanac] series prose:", cause);
        channel.fail(new AlmanacError("writeFailed"));
      })
      .finally(() => release(held))
  );
  yield* channel;
}

export async function answerSeriesCheck(learner: Learner, id: string, number: number, answer: number): Promise<SeriesLesson> {
  const userId = requireUser(learner);
  let { row, stored } = await resolveSeries(learner, id);
  if (!stored) {
    row = await storeSample(userId);
    stored = true;
  }
  const lessons = await lessonsOf(row.id);
  const lesson = lessons.find((l) => l.number === number);
  if (!lesson) throw new AlmanacError("notFound");

  // The first answer wins. Answering, right or wrong, finishes the lesson.
  if (lesson.check_answer === null) {
    const now = new Date().toISOString();
    check(
      await db()
        .from("series_lessons")
        .update({ check_answer: answer, answered_at: now })
        .eq("series_id", row.id)
        .eq("number", number)
        .is("check_answer", null)
    );
    check(await db().from("series").update({ updated_at: now }).eq("id", row.id));
    check(
      await db()
        .from("lesson_finishes")
        .upsert(
          { user_id: userId, local_date: learner.today, kind: "series", subject: row.category, ref: `${row.id}:${number}` },
          { onConflict: "user_id,kind,ref", ignoreDuplicates: true }
        )
    );
    lesson.check_answer = answer;
    // The fifth answer opens the Mastery Check: write it now, so it is ready when they get there.
    if (!row.is_sample && lessons.every((l) => l.check_answer !== null)) learner.defer(prepareMastery(row.id));
  }
  return toLesson(row, lessons, number);
}

/** A lesson's text and title, for the tutor. */
export async function seriesLessonText(learner: Learner, id: string, number: number): Promise<{ title: string; paragraphs: string[] }> {
  const { lessons } = await resolveSeries(learner, id);
  const lesson = lessons.find((l) => l.number === number);
  if (!lesson?.paragraphs) throw new AlmanacError("notFound");
  return { title: lesson.title, paragraphs: lesson.paragraphs };
}
