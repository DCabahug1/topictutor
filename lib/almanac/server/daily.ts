import "server-only";
import { GenerationError, HAIKU, generateStructured, streamText } from "@/lib/claude";
import { SECTION_BREAK, lastSevenDays, longestStreak, parseLocalDate, recentDays, shiftDate, streakCount } from "../rules";
import {
  AlmanacError,
  type ChoiceQuestion,
  type DailyLesson,
  type DailySession,
  type PastDailyLesson,
  type RecallPrompt,
  type Streak,
  type CustomSubject,
  type Subject,
  type SubjectChoice,
} from "../types";
import { askDailyQuestionAgain, dailyCheckPassed } from "../lesson-check";
import { FIXED_SUBJECTS, rotationOf, tidyCustom, type RotationEntry } from "../other-subject";
import { Channel, paragraphsOf } from "./channel";
import { claim, once, release, waitFor } from "./claims";
import { check, db, isUuid, requireUser, type Learner } from "./context";
import { dailyMetaPrompt, dailyMetaSchema, dailyProsePrompt, finishChoice, keepKeyPoints } from "./prompts";
import { continueSeriesFor } from "./series";
import { CAPS, countUse } from "./usage";

type LessonRow = {
  id: string;
  lesson_date: string;
  subject: Subject;
  /** Normalized custom subject name the lesson is shared under. Empty for fixed subjects. */
  custom_key: string;
  /** The custom subject's name as first typed. Null for fixed subjects. */
  custom_name: string | null;
  title: string;
  minutes: number;
  key_points: string[];
  check_questions: ChoiceQuestion[];
  deeper_topic: string;
  ask_hint: string;
  paragraphs: string[] | null;
};

type ProgressRow = {
  lesson_id: string;
  recall_lesson_id: string | null;
  recall_answer: number | null;
  recall_correct: boolean | null;
  /** Picks as given, right or wrong. A wrong one waits for retryDailyCheck. */
  check_answers: Array<number | null>;
  /** This learner's questions once one was asked again with its options moved. Null: the lesson's own. */
  check_questions: ChoiceQuestion[] | null;
  finished_at: string | null;
};

type Finish = { local_date: string; subject: Subject; kind: "daily" | "series"; ref: string };

const LESSON_COLUMNS = "id, lesson_date, subject, custom_key, custom_name, title, minutes, key_points, check_questions, deeper_topic, ask_hint, paragraphs";

// ---- Subjects ----

/**
 * The learner's fixed subjects in the canonical order, and their own subjects in
 * theirs. An "Other" left in `subjects` by older builds is ignored.
 */
export async function subjectsOf(userId: string | null): Promise<SubjectChoice & { prompted: boolean }> {
  if (!userId) return { subjects: [], custom: [], prompted: false };
  const row = check(
    await db().from("learner_settings").select("subjects, custom_subjects, subjects_prompted").eq("user_id", userId).maybeSingle()
  );
  const picked = (row?.subjects ?? []) as string[];
  return {
    subjects: FIXED_SUBJECTS.filter((s) => picked.includes(s)),
    custom: tidyCustom(Array.isArray(row?.custom_subjects) ? row.custom_subjects : []),
    prompted: Boolean(row?.subjects_prompted),
  };
}

/** `custom` replaces the learner's own subjects; null keeps the saved ones. */
export async function saveSubjects(learner: Learner, subjects: Subject[], custom: CustomSubject[] | null) {
  const userId = requireUser(learner);
  check(
    await db()
      .from("learner_settings")
      .upsert({
        user_id: userId,
        subjects: FIXED_SUBJECTS.filter((s) => subjects.includes(s)),
        // Left out, the saved list stays as it is.
        ...(custom === null ? {} : { custom_subjects: tidyCustom(custom) }),
        subjects_prompted: true,
        updated_at: new Date().toISOString(),
      })
  );
}

const dayNumber = (date: string) => Math.floor(parseLocalDate(date).getTime() / 86_400_000 + 0.5);

function onDay<T>(list: readonly T[], date: string): T {
  return list[((dayNumber(date) % list.length) + list.length) % list.length];
}

/** The day's subject: the learner's picks, fixed and custom, rotate one a day. */
function entryFor(choice: SubjectChoice, date: string): RotationEntry {
  return onDay(rotationOf(choice), date);
}

/** Where a day goes when its custom subject can't be planned: one of the learner's fixed subjects, or any. */
function fixedFallback(choice: SubjectChoice, date: string): Subject {
  return onDay(choice.subjects.length ? choice.subjects : FIXED_SUBJECTS, date);
}

// ---- Shared lessons ----

/** Which shared lesson a subject means: a fixed subject, or a custom one under Other. */
type LessonKey = { subject: Subject; key: string; name: string | null };

const plainKey = (subject: Subject): LessonKey => ({ subject, key: "", name: null });

const keyOf = (entry: RotationEntry): LessonKey =>
  entry.key ? { subject: entry.subject, key: entry.key, name: entry.name } : plainKey(entry.subject);

/** Thrown when a learner's custom subjects have planned as many new lessons as they may today. */
class OverBudget extends Error {}

async function readLesson(date: string, lesson: LessonKey): Promise<LessonRow | null> {
  return check(
    await db()
      .from("daily_lessons")
      .select(LESSON_COLUMNS)
      .eq("lesson_date", date)
      .eq("subject", lesson.subject)
      .eq("custom_key", lesson.key)
      .maybeSingle()
  ) as LessonRow | null;
}

async function lessonById(id: string): Promise<LessonRow | null> {
  return check(await db().from("daily_lessons").select(LESSON_COLUMNS).eq("id", id).maybeSingle()) as LessonRow | null;
}

/**
 * The lesson for `subject` on `date`, planned on first request and then shared
 * by everyone. Only one request plans it; the rest wait for it. A custom
 * subject is shared by everyone who gave it the same name. `budget` runs only when a
 * new lesson would be planned, and stops it with OverBudget when it says no.
 */
export async function ensureDailyLesson(
  date: string,
  subject: Subject,
  lesson: LessonKey = plainKey(subject),
  budget?: () => Promise<boolean>
): Promise<LessonRow> {
  return once(
    `daily-meta:${date}:${subject}${lesson.key ? `:${lesson.key}` : ""}`,
    () => readLesson(date, lesson),
    async () => {
      if (budget && !(await budget())) throw new OverBudget();
      // The writer sees a custom subject's name, so it plans a lesson in that subject.
      const topic = lesson.name ?? subject;
      const recent = check(
        await db()
          .from("daily_lessons")
          .select("title")
          .eq("subject", subject)
          .eq("custom_key", lesson.key)
          .lt("lesson_date", date)
          .order("lesson_date", { ascending: false })
          .limit(30)
      ) as Array<{ title: string }>;
      const titles = recent.map((r) => r.title);
      let meta;
      try {
        meta = await generateStructured({ ...dailyMetaPrompt(topic, titles), schema: dailyMetaSchema, route: "daily-meta", effort: "low" });
      } catch (cause) {
        // A refusal blocks one topic, not the subject: ask once more for something else.
        if (!(cause instanceof GenerationError)) throw cause;
        meta = await generateStructured({
          ...dailyMetaPrompt(topic, titles),
          user: `${dailyMetaPrompt(topic, titles).user}\nChoose a different, everyday idea.`,
          schema: dailyMetaSchema,
          route: "daily-meta-retry",
          effort: "low",
        });
      }
      check(
        await db()
          .from("daily_lessons")
          .upsert(
            {
              lesson_date: date,
              subject,
              custom_key: lesson.key,
              custom_name: lesson.key ? lesson.name : null,
              title: meta.title,
              minutes: 3,
              key_points: keepKeyPoints(meta.keyPoints),
              check_questions: meta.check.map(finishChoice),
              deeper_topic: meta.deeperTopic,
              ask_hint: meta.askHint,
            },
            { onConflict: "lesson_date,subject,custom_key", ignoreDuplicates: true }
          )
      );
      const row = await readLesson(date, lesson);
      if (!row) throw new AlmanacError("writeFailed");
      return row;
    }
  );
}

function toDailyLesson(row: LessonRow): DailyLesson {
  return {
    id: row.id,
    date: row.lesson_date,
    subject: row.subject,
    subjectName: row.custom_name ?? row.subject,
    title: row.title,
    minutes: row.minutes,
    paragraphs: row.paragraphs,
    check: row.check_questions,
    deeperTopic: row.deeper_topic,
    askHint: row.ask_hint,
  };
}

// ---- The learner's day ----

/** The check as this learner sees it: the lesson's questions, or theirs once one was asked again. */
function questionsFor(lesson: LessonRow, progress: ProgressRow | null): ChoiceQuestion[] {
  const own = progress?.check_questions;
  return own && own.length === lesson.check_questions.length ? own : lesson.check_questions;
}

async function progressOf(userId: string, date: string): Promise<ProgressRow | null> {
  return check(
    await db()
      .from("daily_progress")
      .select("lesson_id, recall_lesson_id, recall_answer, recall_correct, check_answers, check_questions, finished_at")
      .eq("user_id", userId)
      .eq("lesson_date", date)
      .maybeSingle()
  ) as ProgressRow | null;
}

export async function finishesOf(userId: string | null): Promise<Finish[]> {
  if (!userId) return [];
  return check(
    await db().from("lesson_finishes").select("local_date, subject, kind, ref").eq("user_id", userId).order("local_date")
  ) as Finish[];
}

export function streakFrom(finishes: Finish[], today: string): Streak {
  const dates = finishes.map((f) => f.local_date);
  return {
    count: streakCount(dates, today),
    todayDone: dates.includes(today),
    longest: longestStreak(dates),
    week: lastSevenDays(dates, today),
    month: recentDays(dates, 28, today),
  };
}

/**
 * Today's lesson for this learner: the one they started, or today's subject.
 * A custom subject plans a new lesson only within the learner's daily
 * allowance, and the day falls back to a fixed subject past it or if it can't
 * be planned.
 */
async function lessonForToday(learner: Learner, choice: SubjectChoice, progress: ProgressRow | null): Promise<LessonRow> {
  if (progress) {
    const pinned = await lessonById(progress.lesson_id);
    if (pinned) return pinned;
  }
  const entry = entryFor(choice, learner.today);
  if (!entry.key) return ensureDailyLesson(learner.today, entry.subject);
  const userId = learner.userId;
  if (userId) {
    try {
      return await ensureDailyLesson(learner.today, entry.subject, keyOf(entry), () =>
        countUse(`other-plan:${userId}`, CAPS.otherPlansPerDay)
      );
    } catch (cause) {
      if (!(cause instanceof OverBudget)) console.error(`[almanac] daily ${learner.today} ${entry.key}:`, cause);
    }
  }
  return ensureDailyLesson(learner.today, fixedFallback(choice, learner.today));
}

/** "Monday" within the last week, otherwise "November 3". */
function dayLabel(date: string, today: string): string {
  const d = parseLocalDate(date);
  return date >= shiftDate(today, -6)
    ? d.toLocaleDateString("en-US", { weekday: "long" })
    : d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/**
 * Recall reuses the check question of an earlier daily lesson, picked on a
 * 1, 3, 7, 14 day schedule, falling back to the latest. Derived, so it stays
 * the same all day without writing anything.
 */
async function recallFor(finishes: Finish[], today: string, progress: ProgressRow | null): Promise<{ prompt: RecallPrompt; lessonId: string } | null> {
  let lessonId = progress?.recall_lesson_id ?? null;
  if (!lessonId) {
    const earlier = finishes.filter((f) => f.kind === "daily" && f.local_date < today && isUuid(f.ref));
    if (earlier.length === 0) return null;
    const due = [1, 3, 7, 14].map((n) => shiftDate(today, -n));
    const pick = due.map((d) => earlier.find((f) => f.local_date === d)).find(Boolean) ?? earlier[earlier.length - 1];
    lessonId = pick.ref;
  }
  const lesson = await lessonById(lessonId);
  const question = lesson?.check_questions[0];
  if (!lesson || !question) return null;
  return {
    lessonId,
    prompt: {
      fromDay: dayLabel(lesson.lesson_date, today),
      subject: lesson.subject,
      subjectName: lesson.custom_name ?? lesson.subject,
      question,
    },
  };
}

export async function getDailySession(learner: Learner): Promise<DailySession> {
  const userId = learner.userId;
  const [choice, progress, finishes] = await Promise.all([
    subjectsOf(userId),
    userId ? progressOf(userId, learner.today) : Promise.resolve(null),
    finishesOf(userId),
  ]);
  const [lesson, recall, continueSeries] = await Promise.all([
    lessonForToday(learner, choice, progress),
    recallFor(finishes, learner.today, progress),
    // Series need an account, so a guest is never offered one to continue.
    continueSeriesFor(learner.isGuest ? null : userId),
  ]);

  return {
    lesson: { ...toDailyLesson(lesson), check: questionsFor(lesson, progress) },
    recall: recall?.prompt ?? null,
    recallAnswer: progress?.recall_answer ?? null,
    checkAnswers: lesson.check_questions.map((_, i) => progress?.check_answers?.[i] ?? null),
    finishedAt: progress?.finished_at ?? null,
    streak: streakFrom(finishes, learner.today),
    tomorrowSubject: entryFor(choice, shiftDate(learner.today, 1)).name,
    continueSeries,
  };
}

/** The progress row for today, created on the first answer, which pins today's lesson. */
async function ensureProgress(learner: Learner): Promise<{ userId: string; progress: ProgressRow; lesson: LessonRow }> {
  const userId = requireUser(learner);
  const existing = await progressOf(userId, learner.today);
  const choice = await subjectsOf(userId);
  const lesson = await lessonForToday(learner, choice, existing);
  if (existing) return { userId, progress: existing, lesson };
  check(
    await db()
      .from("daily_progress")
      .upsert(
        { user_id: userId, lesson_date: learner.today, lesson_id: lesson.id, check_answers: lesson.check_questions.map(() => null) },
        { onConflict: "user_id,lesson_date", ignoreDuplicates: true }
      )
  );
  const progress = await progressOf(userId, learner.today);
  if (!progress) throw new AlmanacError("loadFailed");
  return { userId, progress, lesson };
}

export async function answerRecall(learner: Learner, answer: number): Promise<DailySession> {
  const { userId, progress } = await ensureProgress(learner);
  if (progress.recall_answer === null) {
    const finishes = await finishesOf(userId);
    const recall = await recallFor(finishes, learner.today, progress);
    if (recall) {
      check(
        await db()
          .from("daily_progress")
          .update({
            recall_lesson_id: recall.lessonId,
            recall_answer: answer,
            recall_correct: answer === recall.prompt.question.correctIndex,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("lesson_date", learner.today)
          .is("recall_answer", null)
      );
    }
  }
  return getDailySession(learner);
}

/**
 * One pick per question until it is asked again. The lesson finishes, and the day
 * counts, only once enough of the check is right (see DAILY_PASS_SHARE).
 */
export async function answerDailyCheck(learner: Learner, index: number, answer: number): Promise<DailySession> {
  const { userId, progress, lesson } = await ensureProgress(learner);
  if (index < 0 || index >= lesson.check_questions.length) throw new AlmanacError("notFound");
  const questions = questionsFor(lesson, progress);
  const answers = questions.map((_, i) => progress.check_answers?.[i] ?? null);
  // The first answer wins.
  if (answers[index] === null) {
    answers[index] = answer;
    const finishing = progress.finished_at === null && dailyCheckPassed(questions, answers);
    const now = new Date().toISOString();
    check(
      await db()
        .from("daily_progress")
        .update({ check_answers: answers, finished_at: finishing ? now : progress.finished_at, updated_at: now })
        .eq("user_id", userId)
        .eq("lesson_date", learner.today)
    );
    if (finishing) {
      check(
        await db()
          .from("lesson_finishes")
          .upsert(
            { user_id: userId, local_date: learner.today, kind: "daily", subject: lesson.subject, ref: lesson.id },
            { onConflict: "user_id,kind,ref", ignoreDuplicates: true }
          )
      );
    }
  }
  return getDailySession(learner);
}

/** After a miss: asks that question again, the same words with the right answer moved. */
export async function retryDailyCheck(learner: Learner, index: number): Promise<DailySession> {
  const { userId, progress, lesson } = await ensureProgress(learner);
  if (index < 0 || index >= lesson.check_questions.length) throw new AlmanacError("notFound");
  if (progress.finished_at !== null) return getDailySession(learner);
  const current = questionsFor(lesson, progress);
  const picks = current.map((_, i) => progress.check_answers?.[i] ?? null);
  const again = askDailyQuestionAgain(current, picks, index);
  if (again.questions !== current) {
    check(
      await db()
        .from("daily_progress")
        .update({ check_questions: again.questions, check_answers: again.picks, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("lesson_date", learner.today)
        .is("finished_at", null)
    );
  }
  return getDailySession(learner);
}

// ---- Writing the lesson ----

async function writeProse(lesson: LessonRow, onText: (text: string) => void): Promise<string[]> {
  let text = "";
  for await (const chunk of streamText({ ...dailyProsePrompt(lesson.custom_name ?? lesson.subject, lesson.title, lesson.key_points), route: "daily-prose", model: HAIKU, effort: "medium" })) {
    text += chunk;
    onText(chunk);
  }
  const paragraphs = paragraphsOf(text);
  // A daily lesson reaches everyone that day, so a malformed one is never kept.
  if (paragraphs.length < 2 || paragraphs.length > 4) {
    throw new GenerationError(`Expected two to four sections, got ${paragraphs.length}`);
  }
  check(
    await db()
      .from("daily_lessons")
      .update({ paragraphs, written_at: new Date().toISOString() })
      .eq("id", lesson.id)
      .is("paragraphs", null)
  );
  return paragraphs;
}

/**
 * Writes today's lesson while the first reader watches. Anyone who opens it
 * meanwhile waits and gets the finished text. The writer runs after the
 * response, so leaving the page doesn't stop it.
 */
export async function* streamDailyLesson(learner: Learner): AsyncGenerator<string> {
  const userId = learner.userId;
  const [choice, progress] = await Promise.all([
    subjectsOf(userId),
    userId ? progressOf(userId, learner.today) : Promise.resolve(null),
  ]);
  const lesson = await lessonForToday(learner, choice, progress);
  if (lesson.paragraphs) {
    yield lesson.paragraphs.join(SECTION_BREAK);
    return;
  }

  const key = `daily-prose:${lesson.id}`;
  const held = await claim(key);
  if (!held) {
    const paragraphs = await waitFor(async () => (await lessonById(lesson.id))?.paragraphs ?? null);
    yield paragraphs.join(SECTION_BREAK);
    return;
  }

  const channel = new Channel<string>();
  learner.defer(
    writeProse(lesson, (text) => channel.push(text))
      .then(() => channel.close())
      .catch((cause) => {
        console.error("[almanac] daily prose:", cause);
        channel.fail(new AlmanacError("writeFailed"));
      })
      .finally(() => release(held))
  );
  yield* channel;
}

// ---- Past lessons ----

export async function getPastDailyLessons(learner: Learner): Promise<PastDailyLesson[]> {
  if (!learner.userId) return [];
  const rows = check(
    await db()
      .from("daily_progress")
      .select("lesson_date, finished_at, daily_lessons!daily_progress_lesson_id_fkey(id, subject, custom_name, title, paragraphs)")
      .eq("user_id", learner.userId)
      .order("lesson_date", { ascending: false })
      .limit(120)
  ) as unknown as Array<{
    lesson_date: string;
    finished_at: string | null;
    daily_lessons: { id: string; subject: Subject; custom_name: string | null; title: string; paragraphs: string[] | null } | null;
  }>;
  return rows
    .filter((r) => r.daily_lessons?.paragraphs)
    .map((r) => ({
      id: r.daily_lessons!.id,
      date: r.lesson_date,
      subject: r.daily_lessons!.subject,
      subjectName: r.daily_lessons!.custom_name ?? r.daily_lessons!.subject,
      title: r.daily_lessons!.title,
      done: r.finished_at !== null,
    }));
}

export async function getPastDailyLesson(learner: Learner, id: string): Promise<DailyLesson> {
  if (!isUuid(id)) throw new AlmanacError("notFound");
  const lesson = await lessonById(id);
  if (!lesson) throw new AlmanacError("notFound");
  return toDailyLesson(lesson);
}

/** Today's lesson text and title, for the tutor. */
export async function todaysLessonText(learner: Learner): Promise<{ title: string; paragraphs: string[] }> {
  const userId = learner.userId;
  const [choice, progress] = await Promise.all([
    subjectsOf(userId),
    userId ? progressOf(userId, learner.today) : Promise.resolve(null),
  ]);
  const lesson = await lessonForToday(learner, choice, progress);
  if (!lesson.paragraphs) throw new AlmanacError("notFound");
  return { title: lesson.title, paragraphs: lesson.paragraphs };
}
