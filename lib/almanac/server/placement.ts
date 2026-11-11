import "server-only";
import { generateStructured, streamStructured } from "@/lib/claude";
import { LESSONS_PER_SERIES, focusLine, scoreAnswers, whyLine } from "../rules";
import {
  AlmanacError,
  type Answer,
  type ChoiceQuestion,
  type OutlineRow,
  type Placement,
  type PlacementResult,
  type SeriesRequest,
} from "../types";
import { claim, once, release } from "./claims";
import { check, db, requireUser, type Learner } from "./context";
import { ArrayScanner } from "./json-scan";
import { finishChoice, outlinePrompt, outlineSchema, placementPrompt, placementSchema, type OutlineLesson } from "./prompts";
import { writeAhead, type SeriesRow } from "./series";
import { CAPS, LIMITS, countUse, used } from "./usage";

type PlacementRow = {
  id: string;
  user_id: string;
  topic: string;
  focus: string;
  questions: ChoiceQuestion[] | null;
  answers: Array<Answer | null>;
  submitted_at: string | null;
  score: number | null;
  focus_line: string | null;
  outline: OutlineRow[];
  series_id: string | null;
};

const COLUMNS = "id, user_id, topic, focus, questions, answers, submitted_at, score, focus_line, outline, series_id";
const EMPTY = Array<null>(LESSONS_PER_SERIES).fill(null);

async function latest(userId: string): Promise<PlacementRow | null> {
  return check(
    await db().from("placements").select(COLUMNS).eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  ) as PlacementRow | null;
}

async function byId(id: string): Promise<PlacementRow | null> {
  return check(await db().from("placements").select(COLUMNS).eq("id", id).maybeSingle()) as PlacementRow | null;
}

function toPlacement(row: PlacementRow): Placement {
  return {
    id: row.id,
    topic: row.topic,
    focus: row.focus,
    questions: row.questions,
    answers: row.answers,
    submitted: row.submitted_at !== null,
  };
}

function toResult(row: PlacementRow): PlacementResult {
  const questions = row.questions ?? [];
  return {
    placement: toPlacement(row),
    score: row.score ?? scoreAnswers(questions, row.answers),
    total: questions.length,
    focusLine: row.focus_line ?? focusLine(questions, row.answers),
    outline: row.outline ?? [],
    seriesId: row.series_id,
  };
}

/** A guest's one series, already made or under way. */
export async function guestSeriesUsed(userId: string): Promise<boolean> {
  const { count } = await db()
    .from("series")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_sample", false);
  return (count ?? 0) > 0;
}

export async function guestDailyLimitReached(): Promise<boolean> {
  return (await used("guest-series")) >= CAPS.guestSeriesPerDay;
}

export async function startPlacement(learner: Learner, request: SeriesRequest): Promise<Placement> {
  const userId = requireUser(learner);
  const topic = request.topic.trim().slice(0, LIMITS.topic);
  const focus = (request.focus ?? "").trim().slice(0, LIMITS.focus);
  if (!topic) throw new AlmanacError("writeFailed");

  if (learner.isGuest) {
    if (await guestSeriesUsed(userId)) throw new AlmanacError("guestSeriesUsed");
    // Charged when the test starts, since starting over is otherwise free.
    if (!(await countUse("guest-series", CAPS.guestSeriesPerDay))) throw new AlmanacError("guestDailyLimit");
  } else if (!(await countUse(`member-series:${userId}`, CAPS.memberSeriesPerDay))) {
    throw new AlmanacError("writeFailed", "Daily series limit");
  }

  // One test in progress at a time: starting another replaces it.
  check(await db().from("placements").delete().eq("user_id", userId).is("series_id", null));
  const row = check(
    await db().from("placements").insert({ user_id: userId, topic, focus, answers: EMPTY }).select(COLUMNS).single()
  ) as PlacementRow;
  return toPlacement(row);
}

export async function getPlacement(learner: Learner): Promise<Placement | null> {
  if (!learner.userId) return null;
  const row = await latest(learner.userId);
  return row ? toPlacement(row) : null;
}

export async function writePlacementTest(learner: Learner): Promise<Placement> {
  const userId = requireUser(learner);
  const start = await latest(userId);
  if (!start) throw new AlmanacError("notFound");
  const row = await once(
    `placement:${start.id}`,
    async () => {
      const current = await byId(start.id);
      return current?.questions ? current : null;
    },
    async () => {
      const { questions } = await generateStructured({
        ...placementPrompt(start.topic, start.focus),
        schema: placementSchema,
        route: "placement",
        effort: "medium",
      });
      check(
        await db()
          .from("placements")
          .update({ questions: questions.map(finishChoice) })
          .eq("id", start.id)
          .is("questions", null)
      );
      const written = await byId(start.id);
      if (!written?.questions) throw new AlmanacError("writeFailed");
      return written;
    }
  );
  return toPlacement(row);
}

export async function savePlacementAnswer(learner: Learner, index: number, answer: Answer): Promise<Placement> {
  const userId = requireUser(learner);
  const row = await latest(userId);
  if (!row) throw new AlmanacError("notFound");
  if (row.submitted_at || index < 0 || index >= LESSONS_PER_SERIES) return toPlacement(row);
  const answers = [...row.answers];
  answers[index] = answer;
  check(await db().from("placements").update({ answers }).eq("id", row.id).is("submitted_at", null));
  return toPlacement({ ...row, answers });
}

export async function submitPlacement(learner: Learner): Promise<PlacementResult> {
  const userId = requireUser(learner);
  const row = await latest(userId);
  if (!row?.questions) throw new AlmanacError("notFound");
  if (row.submitted_at) return toResult(row);
  const score = scoreAnswers(row.questions, row.answers);
  const line = focusLine(row.questions, row.answers);
  const submittedAt = new Date().toISOString();
  check(
    await db()
      .from("placements")
      .update({ submitted_at: submittedAt, score, focus_line: line })
      .eq("id", row.id)
      .is("submitted_at", null)
  );
  return toResult({ ...row, submitted_at: submittedAt, score, focus_line: line });
}

export async function getPlacementResult(learner: Learner): Promise<PlacementResult | null> {
  if (!learner.userId) return null;
  const row = await latest(learner.userId);
  return row?.submitted_at ? toResult(row) : null;
}

/** Creates the series and its five lessons from a finished outline. */
async function createSeries(row: PlacementRow, outline: { title: string; category: string; description: string; lessons: OutlineLesson[] }) {
  const questions = row.questions ?? [];
  const series = check(
    await db()
      .from("series")
      .insert({
        user_id: row.user_id,
        title: outline.title,
        category: outline.category,
        description: outline.description,
        focus_line: row.focus_line,
        placement_score: row.score,
      })
      .select("*")
      .single()
  ) as SeriesRow;
  check(
    await db()
      .from("series_lessons")
      .insert(
        outline.lessons.slice(0, LESSONS_PER_SERIES).map((lesson, i) => ({
          series_id: series.id,
          number: i + 1,
          title: lesson.title,
          description: lesson.description,
          why: whyLine(questions, row.answers, i),
          focus: row.answers[i] !== questions[i]?.correctIndex,
          key_points: lesson.keyPoints,
          check_question: finishChoice(lesson.check),
          ask_hint: lesson.askHint,
        }))
      )
  );
  check(await db().from("placements").update({ series_id: series.id }).eq("id", row.id));
  return series;
}

/**
 * Writes the outline one row at a time, then creates the series. A refresh
 * part way starts the outline again from the top, so old and new rows never mix.
 */
export async function* streamOutline(learner: Learner): AsyncGenerator<OutlineRow> {
  const userId = requireUser(learner);
  const row = await latest(userId);
  if (!row?.submitted_at || !row.questions) throw new AlmanacError("notFound");
  if (row.series_id) return;

  const held = await claim(`outline:${row.id}`);
  if (!held) {
    // Someone else (another tab) is writing it: wait for the series, then show the rows.
    for (let i = 0; i < 150; i += 1) {
      const current = await byId(row.id);
      if (current?.series_id) {
        for (const r of current.outline) yield r;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new AlmanacError("writeFailed");
  }

  try {
    check(await db().from("placements").update({ outline: [] }).eq("id", row.id));
    const missed = row.questions.map((q, i) => row.answers[i] !== q.correctIndex);
    const scanner = new ArrayScanner("lessons");
    const written: OutlineRow[] = [];
    const stream = streamStructured({
      ...outlinePrompt(row.topic, row.focus, row.questions, missed),
      schema: outlineSchema,
      route: "outline",
      effort: "medium",
    });

    let step = await stream.next();
    while (!step.done) {
      for (const element of scanner.push(step.value)) {
        const title = (element as { title?: unknown }).title;
        if (typeof title !== "string" || written.length >= LESSONS_PER_SERIES) continue;
        const next: OutlineRow = { number: written.length + 1, title, focus: missed[written.length] ?? false };
        written.push(next);
        check(await db().from("placements").update({ outline: written }).eq("id", row.id));
        yield next;
      }
      step = await stream.next();
    }

    const outline = step.value;
    // Rows the scanner couldn't read on the way still arrive, from the checked result.
    for (let i = written.length; i < outline.lessons.length && i < LESSONS_PER_SERIES; i += 1) {
      const next: OutlineRow = { number: i + 1, title: outline.lessons[i].title, focus: missed[i] ?? false };
      written.push(next);
      yield next;
    }
    const final = outline.lessons.slice(0, LESSONS_PER_SERIES).map((l, i) => ({ number: i + 1, title: l.title, focus: missed[i] ?? false }));
    check(await db().from("placements").update({ outline: final }).eq("id", row.id));
    const series = await createSeries({ ...row, outline: final }, outline);
    // Lesson 1 is written ahead, so the first open is instant.
    learner.defer(writeAhead(series, 1));
  } catch (cause) {
    console.error("[almanac] outline:", cause);
    check(await db().from("placements").update({ outline: [] }).eq("id", row.id).is("series_id", null));
    throw cause instanceof AlmanacError ? cause : new AlmanacError("writeFailed");
  } finally {
    await release(held);
  }
}
