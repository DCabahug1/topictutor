// The sample data layer. It implements AlmanacSource with the content in
// ./fixtures, keeps progress in localStorage, and simulates writing with timers.
// Browser only: call it from effects and event handlers, never during render.

import {
  DAILY,
  PAST_DAILY,
  PLACEMENT_TEST,
  RECALL,
  SEED_LIBRARY,
  SEED_LONGEST_STREAK,
  SEED_RECALL,
  SEED_SUBJECT_COUNTS,
  SEED_SUBJECTS,
  SERIES_ANSWERS,
  WEB_LESSONS,
  WEB_MASTERY,
  WEB_SUGGESTIONS,
  WEB_TOPIC,
  placeholderLesson,
  type LessonContent,
} from "./fixtures/content";
import { SAMPLE_LESSONS, SAMPLE_SERIES } from "./fixtures/sample-series";
import {
  LESSONS_PER_SERIES,
  askAgain,
  focusLine,
  lastSevenDays,
  recentDays,
  localDate,
  longestStreak,
  masteryPassed,
  parseLocalDate,
  percentComplete,
  SECTION_BREAK,
  scoreAnswers,
  seriesStatus,
  shiftDate,
  streakCount,
  whyLine,
} from "./rules";
import type { AlmanacSource, TutorContext } from "./source";
import {
  AlmanacError,
  FORCE_FLAGS,
  SUBJECTS,
  type Answer,
  type ChoiceQuestion,
  type DailyLesson,
  type DailySession,
  type ForceFlag,
  type GuestState,
  type Mastery,
  type OutlineRow,
  type PastDailyLesson,
  type Placement,
  type PlacementResult,
  type Series,
  type SeriesLesson,
  type SeriesLessonRow,
  type SeriesRequest,
  type SeriesSummary,
  type Stats,
  type TopicCheck,
  type Streak,
  type Subject,
} from "./types";

// ---- Stored shapes ----

type StoredSeries = {
  id: string;
  title: string;
  category: Subject;
  description: string;
  content: "web" | "sample" | "placeholder";
  lessonTitles: string[] | null;
  focusLine: string | null;
  placementScore: number | null;
  whys: string[];
  focus: boolean[];
  written: boolean[];
  /** Right answers only: a lesson is done when its entry isn't null. */
  checkAnswers: Array<number | null>;
  /** A wrong pick waiting for a retry. Missing in stores saved before retries. */
  checkMissed?: Array<number | null>;
  /** A check asked again replaces the lesson's own. */
  retryChecks?: Array<ChoiceQuestion | null>;
  mastery: {
    written: boolean;
    answers: Array<Answer | null>;
    submitted: boolean;
    lastScore: number | null;
    best: number | null;
    attempts: number;
    everPassed: boolean;
  };
  updatedAt: string;
};

type StoredPlacement = {
  id: string;
  topic: string;
  focus: string;
  written: boolean;
  answers: Array<Answer | null>;
  submitted: boolean;
  outlineCount: number;
  seriesId: string | null;
};

type StoredDaily = {
  recallAnswer: number | null;
  checkAnswers: Array<number | null>;
  finishedAt: string | null;
};

type Finished = { date: string; subject: Subject; kind: "daily" | "series" };

type Store = {
  v: 1;
  seed: "new" | "established";
  subjects: Subject[];
  subjectsPrompted: boolean;
  daily: Record<string, StoredDaily>;
  finished: Finished[];
  recall: { correct: number; total: number };
  baseline: { bySubject: Array<[Subject, number]>; longest: number };
  series: StoredSeries[];
  placement: StoredPlacement | null;
  guestSeriesUsed: boolean;
};

// ---- Storage ----

const KEY = "almanac:v1";
let scope = "guest";

/** Called by SessionProvider: guests and each signed-in learner keep separate progress. */
export function setFixtureScope(userId: string | null) {
  scope = userId ? `user:${userId}` : "guest";
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked: the session still works until the page is closed.
  }
}

function emptyMastery(): StoredSeries["mastery"] {
  return {
    written: false,
    answers: Array(LESSONS_PER_SERIES).fill(null),
    submitted: false,
    lastScore: null,
    best: null,
    attempts: 0,
    everPassed: false,
  };
}

function emptyStore(): Store {
  return {
    v: 1,
    seed: "new",
    subjects: [],
    subjectsPrompted: false,
    daily: {},
    finished: [],
    recall: { correct: 0, total: 0 },
    baseline: { bySubject: [], longest: 0 },
    series: [],
    placement: null,
    guestSeriesUsed: false,
  };
}

/** A learner twelve days into a streak with six series, as drawn in the reference screens. */
function establishedStore(): Store {
  const today = localDate();
  const store = emptyStore();
  store.seed = "established";
  store.subjects = [...SEED_SUBJECTS];
  store.subjectsPrompted = true;
  store.recall = { ...SEED_RECALL };
  store.baseline = { bySubject: SEED_SUBJECT_COUNTS.map(([s, n]) => [s, n]), longest: SEED_LONGEST_STREAK };

  const cycle: Subject[] = ["Science", "History", "Technology", "Finance", "Literature", "Language", "Arts"];
  for (let daysAgo = 1; daysAgo <= 12; daysAgo += 1) {
    const date = shiftDate(today, -daysAgo);
    const past = PAST_DAILY.find((p) => p.daysAgo === daysAgo);
    if (past ? past.done : true) {
      store.finished.push({ date, subject: past?.subject ?? cycle[daysAgo % cycle.length], kind: "daily" });
    }
  }
  // Series lessons on top, so the last seven days read 1, 1, 2, 1, 1, 3 and nothing yet today.
  store.finished.push(
    { date: shiftDate(today, -4), subject: "Technology", kind: "series" },
    { date: shiftDate(today, -4), subject: "History", kind: "series" },
    { date: shiftDate(today, -1), subject: "History", kind: "series" },
    { date: shiftDate(today, -1), subject: "Technology", kind: "series" }
  );

  // The web series is "here because you missed questions 3 and 5".
  const webAnswers: Array<Answer | null> = [0, 1, 0, 0, "unsure"];

  store.series = SEED_LIBRARY.map((seed) => {
    const isWeb = seed.id === "web";
    const passed = seed.masteryBest !== null && masteryPassed(seed.masteryBest);
    const lessons = isWeb ? WEB_LESSONS : seed.lessonTitles!.map((t) => placeholderLesson(t, seed.title));
    const questions = isWeb
      ? WEB_MASTERY
      : lessons.map((l, i) => ({ ...l.check, lessonNumber: i + 1 }));
    const mastery = emptyMastery();
    if (seed.masteryBest !== null) {
      mastery.written = true;
      mastery.submitted = true;
      mastery.attempts = 1;
      mastery.lastScore = seed.masteryBest;
      mastery.best = seed.masteryBest;
      mastery.everPassed = passed;
      // Right answers first, then misses, to match the stored score.
      mastery.answers = questions.map((q, i) =>
        i < seed.masteryBest! ? q.correctIndex : (q.correctIndex + 1) % q.options.length
      );
    }
    return {
      id: seed.id,
      title: seed.title,
      category: seed.category,
      description: seed.description,
      content: isWeb ? "web" : "placeholder",
      lessonTitles: isWeb ? null : seed.lessonTitles!,
      focusLine: isWeb ? focusLine(PLACEMENT_TEST, webAnswers) : null,
      placementScore: isWeb ? scoreAnswers(PLACEMENT_TEST, webAnswers) : null,
      whys: lessons.map((_, i) =>
        isWeb ? whyLine(PLACEMENT_TEST, webAnswers, i) : "Part of the outline written for this series."
      ),
      focus: lessons.map((_, i) => isWeb && webAnswers[i] !== PLACEMENT_TEST[i].correctIndex),
      // Finished lessons are written, and the next one is prepared ahead.
      written: lessons.map((_, i) => i <= seed.lessonsDone),
      checkAnswers: lessons.map((l, i) => (i < seed.lessonsDone ? l.check.correctIndex : null)),
      mastery,
      updatedAt: new Date(parseLocalDate(shiftDate(today, -seed.updatedDaysAgo)).getTime() + 20 * 3600 * 1000).toISOString(),
    } satisfies StoredSeries;
  });

  return store;
}

function load(): Store {
  const key = `${KEY}:${scope}`;
  const existing = readJson<Store>(key);
  if (existing && existing.v === 1) return existing;

  let fresh: Store;
  if (scope === "guest" || readJson<string>(`${KEY}:seed`) === "new") {
    fresh = emptyStore();
  } else {
    fresh = establishedStore();
  }
  if (scope !== "guest") adoptGuestProgress(fresh);
  writeJson(key, fresh);
  return fresh;
}

function save(store: Store) {
  writeJson(`${KEY}:${scope}`, store);
}

/** A guest who creates an account keeps their progress. */
function adoptGuestProgress(store: Store) {
  const guest = readJson<Store>(`${KEY}:guest`);
  if (!guest || guest.v !== 1) return;
  const today = localDate();
  if (guest.daily[today]) store.daily[today] = guest.daily[today];
  for (const entry of guest.finished) {
    if (entry.date === today) store.finished.push(entry);
  }
  if (guest.subjects.length) store.subjects = guest.subjects;
  store.subjectsPrompted = store.subjectsPrompted || guest.subjectsPrompted;
  for (const series of guest.series) {
    if (series.content !== "sample" && !store.series.some((s) => s.id === series.id)) store.series.unshift(series);
  }
}

/** Today's lesson is shared: once anyone has opened it, it is written for everyone. */
function dailyIsWritten(date: string) {
  return (readJson<string[]>(`${KEY}:shared:dailyWritten`) ?? []).includes(date);
}

function markDailyWritten(date: string) {
  const dates = readJson<string[]>(`${KEY}:shared:dailyWritten`) ?? [];
  if (!dates.includes(date)) writeJson(`${KEY}:shared:dailyWritten`, [...dates, date].slice(-14));
}

// ---- Dev controls (used by the local-only /dev pages) ----

export function getForced(): ForceFlag[] {
  const flags = readJson<string[]>(`${KEY}:force`) ?? [];
  return FORCE_FLAGS.filter((flag) => flags.includes(flag));
}

export function setForced(flags: ForceFlag[]) {
  writeJson(`${KEY}:force`, flags);
  window.dispatchEvent(new Event("almanac:force"));
}

/** For useSyncExternalStore: fires when the forced flags change. */
export function subscribeForced(onChange: () => void) {
  window.addEventListener("almanac:force", onChange);
  return () => window.removeEventListener("almanac:force", onChange);
}

/** Clears this browser's sample progress. `seed` picks what a signed-in learner starts with. */
export function resetFixture(seed: "new" | "established" = "established") {
  try {
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(`${KEY}:`));
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
  writeJson(`${KEY}:seed`, seed);
  window.dispatchEvent(new Event("almanac:force"));
}

function forced(flag: ForceFlag) {
  return getForced().includes(flag);
}

// ---- Helpers ----

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Yields text a word at a time, with the same section breaks the real writer uses. */
async function* writeOut(paragraphs: string[], failAfterWords: number | null, ms = 36): AsyncGenerator<string> {
  let count = 0;
  for (let p = 0; p < paragraphs.length; p += 1) {
    if (p > 0) yield SECTION_BREAK;
    const words = paragraphs[p].split(" ");
    for (let w = 0; w < words.length; w += 1) {
      await wait(ms);
      if (failAfterWords !== null && count >= failAfterWords) throw new AlmanacError("writeFailed");
      yield (w > 0 ? " " : "") + words[w];
      count += 1;
    }
  }
}

function assertLoads() {
  if (forced("loadFail")) throw new AlmanacError("loadFailed");
}

function streakOf(store: Store): Streak {
  const dates = store.finished.map((f) => f.date);
  const today = localDate();
  return {
    count: streakCount(dates, today),
    todayDone: dates.includes(today),
    longest: Math.max(store.baseline.longest, longestStreak(dates)),
    week: lastSevenDays(dates, today),
    month: recentDays(dates, 28, today),
  };
}

function lessonsOf(series: StoredSeries): LessonContent[] {
  if (series.content === "web") return WEB_LESSONS;
  if (series.content === "sample") return SAMPLE_LESSONS;
  return (series.lessonTitles ?? []).map((title) => placeholderLesson(title, series.title));
}

function masteryQuestions(series: StoredSeries): ChoiceQuestion[] {
  if (series.content === "web") return WEB_MASTERY;
  return lessonsOf(series).map((lesson, i) => ({ ...lesson.check, lessonNumber: i + 1 }));
}

function summarize(series: StoredSeries): SeriesSummary {
  const lessons = lessonsOf(series);
  const lessonsDone = series.checkAnswers.filter((a) => a !== null).length;
  const next = series.checkAnswers.findIndex((a) => a === null);
  return {
    id: series.id,
    title: series.title,
    category: series.category,
    description: series.description,
    status: seriesStatus(lessonsDone, series.mastery.everPassed),
    lessonsDone,
    masteryPassed: series.mastery.everPassed,
    masteryBest: series.mastery.best,
    percent: percentComplete(lessonsDone, series.mastery.everPassed),
    updatedAt: series.updatedAt,
    isSample: series.content === "sample",
    nextLesson: next === -1 ? null : { number: next + 1, title: lessons[next].title },
  };
}

function unfinishedOf(series: StoredSeries): number[] {
  return series.checkAnswers.map((a, i) => (a === null ? i + 1 : 0)).filter((n) => n > 0);
}

function findSeries(store: Store, id: string): StoredSeries {
  if (id === SAMPLE_SERIES.id) {
    let sample = store.series.find((s) => s.id === id);
    if (!sample) {
      sample = {
        id: SAMPLE_SERIES.id,
        title: SAMPLE_SERIES.title,
        category: SAMPLE_SERIES.category,
        description: SAMPLE_SERIES.description,
        content: "sample",
        lessonTitles: null,
        focusLine: null,
        placementScore: null,
        whys: [...SAMPLE_SERIES.whys],
        focus: [...SAMPLE_SERIES.focus],
        // The sample is written already, so it opens instantly for everyone.
        written: Array(LESSONS_PER_SERIES).fill(true),
        checkAnswers: Array(LESSONS_PER_SERIES).fill(null),
        mastery: emptyMastery(),
        updatedAt: new Date().toISOString(),
      };
      store.series.push(sample);
      save(store);
    }
    return sample;
  }
  const series = store.series.find((s) => s.id === id);
  if (!series) throw new AlmanacError("notFound");
  return series;
}

function toPlacement(stored: StoredPlacement): Placement {
  return {
    id: stored.id,
    topic: stored.topic,
    focus: stored.focus,
    questions: stored.written ? PLACEMENT_TEST : null,
    answers: stored.answers,
    submitted: stored.submitted,
  };
}

function toResult(stored: StoredPlacement): PlacementResult {
  return {
    placement: toPlacement(stored),
    score: scoreAnswers(PLACEMENT_TEST, stored.answers),
    total: PLACEMENT_TEST.length,
    focusLine: focusLine(PLACEMENT_TEST, stored.answers),
    outline: WEB_LESSONS.slice(0, stored.outlineCount).map((lesson, i) => ({
      number: i + 1,
      title: lesson.title,
      focus: stored.answers[i] !== PLACEMENT_TEST[i].correctIndex,
    })),
    seriesId: stored.seriesId,
  };
}

function toMastery(series: StoredSeries): Mastery {
  const questions = masteryQuestions(series);
  const unfinished = unfinishedOf(series);
  const m = series.mastery;
  let status: Mastery["status"];
  if (series.content === "sample" || unfinished.length > 0) status = "locked";
  else if (!m.written) status = "ready";
  else if (!m.submitted) status = "taking";
  else status = masteryPassed(m.lastScore ?? 0) ? "passed" : "failed";

  const lessons = lessonsOf(series);
  const missedLessons = m.submitted
    ? [...new Set(questions.filter((q, i) => m.answers[i] !== q.correctIndex).map((q) => q.lessonNumber ?? 1))]
    : [];

  return {
    seriesId: series.id,
    seriesTitle: series.title,
    status,
    unfinished,
    questions: m.written ? questions : null,
    answers: m.answers,
    lastScore: m.lastScore,
    best: m.best,
    attempts: m.attempts,
    everPassed: m.everPassed,
    review: status === "failed" ? missedLessons.map((n) => ({ number: n, title: lessons[n - 1].title })) : [],
    suggestions: status === "passed" ? WEB_SUGGESTIONS : [],
  };
}

function toSeriesLesson(series: StoredSeries, number: number): SeriesLesson {
  const lessons = lessonsOf(series);
  const lesson = lessons[number - 1];
  if (!lesson) throw new AlmanacError("notFound");
  return {
    seriesId: series.id,
    seriesTitle: series.title,
    number,
    title: lesson.title,
    description: lesson.description,
    why: series.whys[number - 1] ?? "",
    paragraphs: series.written[number - 1] ? lesson.paragraphs : null,
    check: series.retryChecks?.[number - 1] ?? lesson.check,
    checkAnswer: series.checkAnswers[number - 1] ?? series.checkMissed?.[number - 1] ?? null,
    checkPassed: series.checkAnswers[number - 1] !== null,
    askHint: lesson.askHint,
    nextReady: number < LESSONS_PER_SERIES && series.written[number],
    unfinished: unfinishedOf(series),
  };
}

function todayProgress(store: Store): StoredDaily {
  const today = localDate();
  if (!store.daily[today]) {
    store.daily[today] = { recallAnswer: null, checkAnswers: DAILY.check.map(() => null), finishedAt: null };
  }
  return store.daily[today];
}

function toDailySession(store: Store): DailySession {
  const today = localDate();
  const progress = todayProgress(store);
  const hasHistory = store.finished.some((f) => f.date < today);
  const others = store.subjects.filter((s) => s !== DAILY.subject);
  const continued = store.series.find((s) => s.content !== "sample" && summarize(s).status === "inProgress");

  return {
    lesson: {
      id: `daily-${today}`,
      date: today,
      subject: DAILY.subject,
      title: DAILY.title,
      minutes: DAILY.minutes,
      paragraphs: dailyIsWritten(today) ? DAILY.paragraphs : null,
      check: DAILY.check,
      deeperTopic: DAILY.deeperTopic,
      askHint: DAILY.askHint,
    },
    recall: hasHistory
      ? {
          fromDay: parseLocalDate(shiftDate(today, -1)).toLocaleDateString("en-US", { weekday: "long" }),
          subject: RECALL.subject,
          question: RECALL.question,
        }
      : null,
    recallAnswer: progress.recallAnswer,
    checkAnswers: progress.checkAnswers,
    finishedAt: progress.finishedAt,
    streak: streakOf(store),
    tomorrowSubject: others[0] ?? (store.subjects.length ? DAILY.subject : "History"),
    continueSeries: continued ? summarize(continued) : null,
  };
}

// ---- The source ----

export const fixtureSource: AlmanacSource = {
  async getDailySession() {
    assertLoads();
    const store = load();
    const session = toDailySession(store);
    save(store);
    return session;
  },

  async *streamDailyLesson() {
    const failAt = forced("dailyFail") ? 40 : null;
    yield* writeOut(DAILY.paragraphs, failAt);
    markDailyWritten(localDate());
  },

  async answerRecall(answer) {
    const store = load();
    const progress = todayProgress(store);
    if (progress.recallAnswer === null) {
      progress.recallAnswer = answer;
      store.recall.total += 1;
      if (answer === RECALL.question.correctIndex) store.recall.correct += 1;
      save(store);
    }
    return toDailySession(store);
  },

  async answerDailyCheck(index, answer) {
    const store = load();
    const progress = todayProgress(store);
    if (progress.checkAnswers[index] === null) {
      progress.checkAnswers[index] = answer;
      if (progress.finishedAt === null && progress.checkAnswers.every((a) => a !== null)) {
        progress.finishedAt = new Date().toISOString();
        store.finished.push({ date: localDate(), subject: DAILY.subject, kind: "daily" });
      }
      save(store);
    }
    return toDailySession(store);
  },

  async getPastDailyLessons() {
    assertLoads();
    const store = load();
    const today = localDate();
    const rows: PastDailyLesson[] = [];
    const progress = store.daily[today];
    if (dailyIsWritten(today) || progress?.finishedAt || store.seed === "established") {
      rows.push({
        id: `daily-${today}`,
        date: today,
        subject: DAILY.subject,
        title: DAILY.title,
        done: Boolean(progress?.finishedAt),
      });
    }
    if (store.seed === "established") {
      for (const past of PAST_DAILY) {
        rows.push({
          id: `daily-${shiftDate(today, -past.daysAgo)}`,
          date: shiftDate(today, -past.daysAgo),
          subject: past.subject,
          title: past.title,
          done: past.done,
        });
      }
    }
    return rows;
  },

  async getPastDailyLesson(id) {
    assertLoads();
    const today = localDate();
    const date = id.replace(/^daily-/, "");
    if (date === today) {
      return {
        id,
        date,
        subject: DAILY.subject,
        title: DAILY.title,
        minutes: DAILY.minutes,
        paragraphs: DAILY.paragraphs,
        check: DAILY.check,
        deeperTopic: DAILY.deeperTopic,
        askHint: DAILY.askHint,
      } satisfies DailyLesson;
    }
    const past = PAST_DAILY.find((p) => shiftDate(today, -p.daysAgo) === date);
    if (!past || load().seed !== "established") throw new AlmanacError("notFound");
    const body = placeholderLesson(past.title, "past daily lessons");
    return {
      id,
      date,
      subject: past.subject,
      title: past.title,
      minutes: 3,
      paragraphs: body.paragraphs,
      check: [body.check],
      deeperTopic: past.title.toLowerCase(),
      askHint: body.askHint,
    } satisfies DailyLesson;
  },

  async *askTutor(context: TutorContext, question) {
    const answers = context.kind === "daily" ? DAILY.answers : SERIES_ANSWERS;
    const text = question === null ? answers.differently : answers.question;
    // The sample answers come from the leap-year rule in paragraph 3 and the cascade in paragraph 2.
    if (question !== null) yield { kind: "source", paragraph: context.kind === "daily" ? 3 : 2 };
    for await (const chunk of writeOut([text], forced("askFail") ? 12 : null, 32)) yield { kind: "text", text: chunk };
  },

  async getSubjects() {
    return load().subjects;
  },

  async saveSubjects(subjects) {
    const store = load();
    store.subjects = SUBJECTS.filter((s) => subjects.includes(s));
    store.subjectsPrompted = true;
    save(store);
  },

  async getGuestState() {
    const store = load();
    return {
      hasProgress: store.finished.length > 0,
      streak: streakOf(store).count,
      seriesUsed: store.guestSeriesUsed || forced("guestUsed"),
      dailyLimitReached: forced("guestDaily"),
      subjectsPrompted: store.subjectsPrompted,
    } satisfies GuestState;
  },

  async listSeries() {
    assertLoads();
    return load()
      .series.filter((s) => s.content !== "sample")
      .map(summarize)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getSeries(id) {
    assertLoads();
    const store = load();
    const series = findSeries(store, id);
    const lessons = lessonsOf(series);
    return {
      ...summarize(series),
      focusLine: series.focusLine,
      placementScore: series.placementScore,
      lessons: lessons.map(
        (lesson, i): SeriesLessonRow => ({
          number: i + 1,
          title: lesson.title,
          description: lesson.description,
          why: series.whys[i] ?? "",
          focus: series.focus[i] ?? false,
          done: series.checkAnswers[i] !== null,
          written: series.written[i],
        })
      ),
    } satisfies Series;
  },

  async deleteSeries(id) {
    const store = load();
    store.series = store.series.filter((s) => s.id !== id);
    save(store);
  },

  async getSeriesLesson(id, number) {
    assertLoads();
    const store = load();
    const series = findSeries(store, id);
    // Opening a written lesson prepares the next one ahead of time.
    if (series.written[number - 1] && number < LESSONS_PER_SERIES && !series.written[number]) {
      series.written[number] = true;
      save(store);
    }
    return toSeriesLesson(series, number);
  },

  async *streamSeriesLesson(id, number) {
    const lesson = lessonsOf(findSeries(load(), id))[number - 1];
    if (!lesson) throw new AlmanacError("notFound");
    yield* writeOut(lesson.paragraphs, forced("seriesLessonFail") ? 40 : null);
    const store = load();
    const series = findSeries(store, id);
    series.written[number - 1] = true;
    if (number < LESSONS_PER_SERIES) series.written[number] = true;
    save(store);
  },

  async answerSeriesCheck(id, number, answer) {
    const store = load();
    const series = findSeries(store, id);
    const i = number - 1;
    const missed = (series.checkMissed ??= Array(LESSONS_PER_SERIES).fill(null));
    if (series.checkAnswers[i] === null && missed[i] === null) {
      const question = series.retryChecks?.[i] ?? lessonsOf(series)[i].check;
      if (answer === question.correctIndex) {
        series.checkAnswers[i] = answer;
        series.updatedAt = new Date().toISOString();
        store.finished.push({ date: localDate(), subject: series.category, kind: "series" });
      } else {
        missed[i] = answer;
      }
      save(store);
    }
    return toSeriesLesson(series, number);
  },

  async retrySeriesCheck(id, number) {
    await wait(700);
    const store = load();
    const series = findSeries(store, id);
    const i = number - 1;
    if (series.checkAnswers[i] === null && series.checkMissed?.[i] != null) {
      // The sample data can't be reworded, so the fixture only moves the right answer.
      const question = series.retryChecks?.[i] ?? lessonsOf(series)[i].check;
      (series.retryChecks ??= Array(LESSONS_PER_SERIES).fill(null))[i] = askAgain(question);
      series.checkMissed[i] = null;
      save(store);
    }
    return toSeriesLesson(series, number);
  },

  async checkTopic(request: SeriesRequest): Promise<TopicCheck> {
    await wait(500);
    const topic = request.topic.trim();
    if (forced("topicSuggest")) {
      return {
        verdict: "suggest",
        topic: "Photosynthesis",
        note: "That looks like a typo.",
        suggestions: ["How plants make food from light"],
      };
    }
    if (forced("topicUnclear") || topic.replace(/[^a-z]/gi, "").length < 3 || !/[aeiouy]/i.test(topic)) {
      return {
        verdict: "unclear",
        topic: "",
        note: "We couldn’t find a subject in that.",
        suggestions: forced("topicUnclear") ? ["Basics of web development", "How vaccines work"] : [],
      };
    }
    if (forced("topicRefused")) {
      return {
        verdict: "refused",
        topic: "",
        note: "We can’t help with getting into someone else’s account.",
        suggestions: ["How email security works", "Protecting your own accounts"],
      };
    }
    return { verdict: "clear", topic, note: "", suggestions: [] };
  },

  async startPlacement(request: SeriesRequest) {
    const store = load();
    if (scope === "guest") {
      if (forced("guestDaily")) throw new AlmanacError("guestDailyLimit");
      if (store.guestSeriesUsed || forced("guestUsed")) throw new AlmanacError("guestSeriesUsed");
    }
    store.placement = {
      id: `p-${Date.now().toString(36)}`,
      topic: request.topic.trim() || WEB_TOPIC,
      focus: request.focus?.trim() ?? "",
      written: false,
      answers: PLACEMENT_TEST.map(() => null),
      submitted: false,
      outlineCount: 0,
      seriesId: null,
    };
    save(store);
    return toPlacement(store.placement);
  },

  async getPlacement() {
    assertLoads();
    const { placement } = load();
    return placement ? toPlacement(placement) : null;
  },

  async writePlacementTest() {
    const before = load().placement;
    if (!before) throw new AlmanacError("notFound");
    if (before.written) return toPlacement(before);
    await wait(2200);
    if (forced("placementFail")) throw new AlmanacError("writeFailed");
    const store = load();
    if (!store.placement) throw new AlmanacError("notFound");
    store.placement.written = true;
    save(store);
    return toPlacement(store.placement);
  },

  async savePlacementAnswer(index, answer) {
    const store = load();
    if (!store.placement) throw new AlmanacError("notFound");
    if (!store.placement.submitted) {
      store.placement.answers[index] = answer;
      save(store);
    }
    return toPlacement(store.placement);
  },

  async submitPlacement() {
    const store = load();
    if (!store.placement) throw new AlmanacError("notFound");
    store.placement.submitted = true;
    save(store);
    return toResult(store.placement);
  },

  async getPlacementResult() {
    assertLoads();
    const { placement } = load();
    return placement?.submitted ? toResult(placement) : null;
  },

  async *streamOutline() {
    const start = load().placement;
    if (!start?.submitted) throw new AlmanacError("notFound");

    for (let i = start.outlineCount; i < LESSONS_PER_SERIES; i += 1) {
      await wait(750);
      if (forced("outlineFail") && i >= 2) throw new AlmanacError("writeFailed");
      const store = load();
      if (!store.placement) throw new AlmanacError("notFound");
      store.placement.outlineCount = i + 1;
      save(store);
      yield {
        number: i + 1,
        title: WEB_LESSONS[i].title,
        focus: store.placement.answers[i] !== PLACEMENT_TEST[i].correctIndex,
      } satisfies OutlineRow;
    }

    const store = load();
    const placement = store.placement;
    if (!placement || placement.seriesId) return;
    const series: StoredSeries = {
      id: `s-${Date.now().toString(36)}`,
      title: placement.topic,
      category: "Technology",
      description: placement.focus || "From the request your browser sends to the styled page on screen.",
      content: "web",
      lessonTitles: null,
      focusLine: focusLine(PLACEMENT_TEST, placement.answers),
      placementScore: scoreAnswers(PLACEMENT_TEST, placement.answers),
      whys: WEB_LESSONS.map((_, i) => whyLine(PLACEMENT_TEST, placement.answers, i)),
      focus: WEB_LESSONS.map((_, i) => placement.answers[i] !== PLACEMENT_TEST[i].correctIndex),
      written: Array(LESSONS_PER_SERIES).fill(false),
      checkAnswers: Array(LESSONS_PER_SERIES).fill(null),
      mastery: emptyMastery(),
      updatedAt: new Date().toISOString(),
    };
    store.series.unshift(series);
    placement.seriesId = series.id;
    if (scope === "guest") store.guestSeriesUsed = true;
    save(store);
  },

  async getMastery(seriesId) {
    assertLoads();
    return toMastery(findSeries(load(), seriesId));
  },

  async writeMastery(seriesId) {
    const before = findSeries(load(), seriesId);
    if (before.mastery.written) return toMastery(before);
    await wait(2000);
    if (forced("masteryFail")) throw new AlmanacError("writeFailed");
    const store = load();
    const series = findSeries(store, seriesId);
    series.mastery.written = true;
    save(store);
    return toMastery(series);
  },

  async saveMasteryAnswer(seriesId, index, answer) {
    const store = load();
    const series = findSeries(store, seriesId);
    if (!series.mastery.submitted) {
      series.mastery.answers[index] = answer;
      save(store);
    }
    return toMastery(series);
  },

  async submitMastery(seriesId) {
    const store = load();
    const series = findSeries(store, seriesId);
    const m = series.mastery;
    if (!m.submitted) {
      const score = scoreAnswers(masteryQuestions(series), m.answers);
      m.submitted = true;
      m.lastScore = score;
      m.best = Math.max(m.best ?? 0, score);
      m.attempts += 1;
      m.everPassed = m.everPassed || masteryPassed(score);
      series.updatedAt = new Date().toISOString();
      save(store);
    }
    return toMastery(series);
  },

  async retakeMastery(seriesId) {
    const store = load();
    const series = findSeries(store, seriesId);
    series.mastery.written = false;
    series.mastery.submitted = false;
    series.mastery.answers = Array(LESSONS_PER_SERIES).fill(null);
    save(store);
    return toMastery(series);
  },

  async getStats() {
    assertLoads();
    const store = load();
    const streak = streakOf(store);
    const counts = new Map<Subject, number>(store.baseline.bySubject);
    for (const entry of store.finished) counts.set(entry.subject, (counts.get(entry.subject) ?? 0) + 1);
    const own = store.series.filter((s) => s.content !== "sample");

    return {
      streak,
      totalLessons: [...counts.values()].reduce((a, b) => a + b, 0),
      lastSevenDays: streak.week.map((day) => ({
        ...day,
        count: store.finished.filter((f) => f.date === day.date).length,
      })),
      recall: store.recall,
      seriesCompleted: own.filter((s) => s.mastery.everPassed).length,
      masteryScores: own
        .filter((s) => s.mastery.best !== null)
        .map((s) => ({ seriesId: s.id, title: s.title, best: s.mastery.best! })),
      bySubject: [...counts.entries()]
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([subject, lessons]) => ({ subject, lessons })),
    } satisfies Stats;
  },
};
