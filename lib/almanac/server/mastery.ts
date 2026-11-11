import "server-only";
import { generateStructured } from "@/lib/claude";
import { LESSONS_PER_SERIES, masteryPassed, scoreAnswers } from "../rules";
import { AlmanacError, type Answer, type ChoiceQuestion, type Mastery } from "../types";
import { claim, release, waitFor } from "./claims";
import { check, db, requireUser, type Learner } from "./context";
import { finishChoice, masteryPrompt, masterySchema } from "./prompts";
import { resolveSeries, type LessonRow, type SeriesRow } from "./series";

type MasteryRow = {
  series_id: string;
  questions: ChoiceQuestion[] | null;
  answers: Array<Answer | null>;
  submitted: boolean;
  last_score: number | null;
  best: number | null;
  attempts: number;
  ever_passed: boolean;
  review: Array<{ number: number; title: string }>;
  suggestions: Array<{ title: string; why: string }>;
  next_questions: ChoiceQuestion[] | null;
};

const COLUMNS = "series_id, questions, answers, submitted, last_score, best, attempts, ever_passed, review, suggestions, next_questions";
const EMPTY_ANSWERS = Array<null>(LESSONS_PER_SERIES).fill(null);

async function readMastery(seriesId: string): Promise<MasteryRow | null> {
  return check(await db().from("mastery").select(COLUMNS).eq("series_id", seriesId).maybeSingle()) as MasteryRow | null;
}

function toMastery(series: SeriesRow, lessons: LessonRow[], m: MasteryRow | null): Mastery {
  const unfinished = lessons.filter((l) => l.check_answer === null).map((l) => l.number);
  let status: Mastery["status"];
  if (series.is_sample || unfinished.length > 0) status = "locked";
  else if (!m?.questions) status = "ready";
  else if (!m.submitted) status = "taking";
  else status = masteryPassed(m.last_score ?? 0) ? "passed" : "failed";

  return {
    seriesId: series.is_sample ? "sample" : series.id,
    seriesTitle: series.title,
    status,
    unfinished,
    questions: status === "locked" || status === "ready" ? null : (m?.questions ?? null),
    answers: m?.answers ?? EMPTY_ANSWERS,
    lastScore: m?.last_score ?? null,
    best: m?.best ?? null,
    attempts: m?.attempts ?? 0,
    everPassed: m?.ever_passed ?? false,
    review: status === "failed" ? (m?.review ?? []) : [],
    suggestions: status === "passed" ? (m?.suggestions ?? []) : [],
  };
}

/** The lessons the learner got wrong along the way, or missed in the last attempt. */
function weakLessons(lessons: LessonRow[], m: MasteryRow | null): number[] {
  const wrongChecks = lessons.filter((l) => l.check_answer !== null && l.check_answer !== l.check_question.correctIndex);
  const missed =
    m?.questions && m.submitted
      ? m.questions.filter((q, i) => m.answers[i] !== q.correctIndex).map((q) => q.lessonNumber ?? 0)
      : [];
  return [...new Set([...wrongChecks.map((l) => l.number), ...missed])].filter((n) => n > 0).sort();
}

async function generate(series: SeriesRow, lessons: LessonRow[], leanOn: number[]) {
  const result = await generateStructured({
    ...masteryPrompt(
      series.title,
      lessons.map((l) => ({ number: l.number, title: l.title, keyPoints: l.key_points.length ? l.key_points : [l.description] })),
      leanOn
    ),
    schema: masterySchema,
    effort: "medium",
  });
  const questions: ChoiceQuestion[] = result.questions.map((q, i) => ({ ...finishChoice(q), lessonNumber: q.lessonNumber ?? i + 1 }));
  return { questions, suggestions: result.suggestions };
}

/** Writes the questions for the first attempt. Safe to call more than once. */
async function writeFirst(series: SeriesRow, lessons: LessonRow[]): Promise<MasteryRow> {
  const existing = await readMastery(series.id);
  if (existing?.questions) return existing;
  const key = `mastery:${series.id}`;
  const held = await claim(key);
  if (!held) return waitFor(async () => {
    const row = await readMastery(series.id);
    return row?.questions ? row : null;
  });
  try {
    const { questions, suggestions } = await generate(series, lessons, weakLessons(lessons, null));
    check(
      await db()
        .from("mastery")
        .upsert({
          series_id: series.id,
          questions,
          suggestions,
          answers: EMPTY_ANSWERS,
          submitted: false,
          updated_at: new Date().toISOString(),
        })
    );
    const row = await readMastery(series.id);
    if (!row) throw new AlmanacError("writeFailed");
    return row;
  } finally {
    await release(held);
  }
}

/** Run in the background when the fifth lesson check is answered. */
export async function prepareMastery(seriesId: string): Promise<void> {
  try {
    const series = check(await db().from("series").select("*").eq("id", seriesId).maybeSingle()) as SeriesRow | null;
    if (!series) return;
    const lessons = check(
      await db().from("series_lessons").select("*").eq("series_id", seriesId).order("number")
    ) as LessonRow[];
    if (lessons.some((l) => l.check_answer === null)) return;
    await writeFirst(series, lessons);
  } catch (cause) {
    console.error("[almanac] prepare mastery:", cause);
  }
}

/** After a failed attempt, writes the retake from what was missed, so it opens at once. */
async function prepareRetake(seriesId: string): Promise<void> {
  try {
    const series = check(await db().from("series").select("*").eq("id", seriesId).maybeSingle()) as SeriesRow | null;
    const m = await readMastery(seriesId);
    if (!series || !m || m.next_questions) return;
    const held = await claim(`mastery-retake:${seriesId}`);
    if (!held) return;
    try {
      const lessons = check(
        await db().from("series_lessons").select("*").eq("series_id", seriesId).order("number")
      ) as LessonRow[];
      const { questions } = await generate(series, lessons, weakLessons(lessons, m));
      check(await db().from("mastery").update({ next_questions: questions }).eq("series_id", seriesId));
    } finally {
      await release(held);
    }
  } catch (cause) {
    console.error("[almanac] prepare retake:", cause);
  }
}

export async function getMastery(learner: Learner, seriesId: string): Promise<Mastery> {
  const { row, lessons, stored } = await resolveSeries(learner, seriesId);
  return toMastery(row, lessons, stored && !row.is_sample ? await readMastery(row.id) : null);
}

export async function writeMastery(learner: Learner, seriesId: string): Promise<Mastery> {
  requireUser(learner);
  const { row, lessons } = await resolveSeries(learner, seriesId);
  const current = toMastery(row, lessons, row.is_sample ? null : await readMastery(row.id));
  if (current.status !== "ready") return current;
  return toMastery(row, lessons, await writeFirst(row, lessons));
}

export async function saveMasteryAnswer(learner: Learner, seriesId: string, index: number, answer: Answer): Promise<Mastery> {
  requireUser(learner);
  const { row, lessons } = await resolveSeries(learner, seriesId);
  const m = await readMastery(row.id);
  if (!m?.questions || m.submitted || index < 0 || index >= LESSONS_PER_SERIES) return toMastery(row, lessons, m);
  const answers = [...m.answers];
  answers[index] = answer;
  check(await db().from("mastery").update({ answers, updated_at: new Date().toISOString() }).eq("series_id", row.id).eq("submitted", false));
  return toMastery(row, lessons, { ...m, answers });
}

export async function submitMastery(learner: Learner, seriesId: string): Promise<Mastery> {
  requireUser(learner);
  const { row, lessons } = await resolveSeries(learner, seriesId);
  const m = await readMastery(row.id);
  if (!m?.questions || m.submitted) return toMastery(row, lessons, m);

  const score = scoreAnswers(m.questions, m.answers);
  const passed = masteryPassed(score);
  const best = Math.max(m.best ?? 0, score);
  const missedLessons = [
    ...new Set(m.questions.filter((q, i) => m.answers[i] !== q.correctIndex).map((q) => q.lessonNumber ?? 1)),
  ].sort();
  const review = missedLessons
    .map((n) => lessons.find((l) => l.number === n))
    .filter((l): l is LessonRow => Boolean(l))
    .map((l) => ({ number: l.number, title: l.title }));
  const now = new Date().toISOString();

  check(
    await db()
      .from("mastery")
      .update({
        submitted: true,
        last_score: score,
        best,
        attempts: m.attempts + 1,
        ever_passed: m.ever_passed || passed,
        review,
        updated_at: now,
      })
      .eq("series_id", row.id)
      .eq("submitted", false)
  );
  check(
    await db()
      .from("series")
      .update({ mastery_passed: row.mastery_passed || passed, mastery_best: best, updated_at: now })
      .eq("id", row.id)
  );
  if (!passed) learner.defer(prepareRetake(row.id));

  return getMastery(learner, seriesId);
}

/** Clears the answers for another attempt. The best score is kept, and a retake written ahead opens at once. */
export async function retakeMastery(learner: Learner, seriesId: string): Promise<Mastery> {
  requireUser(learner);
  const { row, lessons } = await resolveSeries(learner, seriesId);
  const m = await readMastery(row.id);
  if (!m) return toMastery(row, lessons, null);
  check(
    await db()
      .from("mastery")
      .update({
        questions: m.next_questions,
        next_questions: null,
        answers: EMPTY_ANSWERS,
        submitted: false,
        review: [],
        updated_at: new Date().toISOString(),
      })
      .eq("series_id", row.id)
  );
  return getMastery(learner, seriesId);
}
