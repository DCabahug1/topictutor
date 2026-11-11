// Shapes the Almanac screens read and write. The sample source in
// fixture-source.ts fills them today; the real data layer will fill the same shapes.

export const SUBJECTS = [
  "Math",
  "Science",
  "Technology",
  "History",
  "Literature",
  "Business",
  "Finance",
  "Arts",
  "Language",
  "Health and Wellness",
  "Other",
] as const;

export type Subject = (typeof SUBJECTS)[number];

/** A subject the learner named. `on` puts it in the rotation, like a picked fixed subject. */
export type CustomSubject = {
  name: string;
  on: boolean;
};

/** The learner's picks: fixed subjects (never Other), and up to five of their own, in their order. */
export type SubjectChoice = {
  subjects: Subject[];
  custom: CustomSubject[];
};

/** An option index, or "unsure" for the Not sure option in tests. Not sure is scored as wrong. */
export type Answer = number | "unsure";

export type ChoiceQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Placement tests: easy, medium or hard. */
  level?: "easy" | "medium" | "hard";
  /** Placement tests: what the question is about, in a few words, for the focus line. */
  topic?: string;
  /** Mastery Checks: the lesson (1 to 5) the question comes from. */
  lessonNumber?: number;
};

// ---- Streak ----

export type StreakDay = {
  /** One letter, for the strip. */
  letter: string;
  /** Three letters, for charts. */
  short: string;
  /** Full weekday name, for labels read aloud. */
  name: string;
  date: string;
  done: boolean;
  isToday: boolean;
};

export type Streak = {
  count: number;
  todayDone: boolean;
  longest: number;
  /** The last seven days, oldest first, ending today. */
  week: StreakDay[];
  /** The last 28 days (four weeks), oldest first, ending today. For the streak card. */
  month: StreakDay[];
};

// ---- Daily lesson ----

export type DailyLesson = {
  id: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  subject: Subject;
  /** What to call the subject: the custom subject's name for Other, otherwise the subject. */
  subjectName: string;
  title: string;
  minutes: number;
  /** Set once the lesson has been written. Three paragraphs. */
  paragraphs: string[] | null;
  /** One or two questions. */
  check: ChoiceQuestion[];
  /** What Go Deeper offers after this lesson, for example "calendars and time". */
  deeperTopic: string;
  /** A sample question for the ask box placeholder. */
  askHint: string;
};

export type RecallPrompt = {
  /** For example "Monday". */
  fromDay: string;
  subject: Subject;
  subjectName: string;
  question: ChoiceQuestion;
};

export type DailySession = {
  lesson: DailyLesson;
  /** Null for a learner with no history: the session then starts at the lesson. */
  recall: RecallPrompt | null;
  recallAnswer: number | null;
  /** One entry per check question. */
  checkAnswers: Array<number | null>;
  /** ISO time the last check question was answered, or null. */
  finishedAt: string | null;
  streak: Streak;
  /** What to call tomorrow's subject, a custom subject by its name. */
  tomorrowSubject: string;
  /** A series to continue, offered on the finish screen. */
  continueSeries: SeriesSummary | null;
};

export type PastDailyLesson = {
  id: string;
  date: string;
  subject: Subject;
  subjectName: string;
  title: string;
  done: boolean;
};

// ---- Series ----

export type SeriesStatus = "notStarted" | "inProgress" | "completed";

export type SeriesLessonRow = {
  number: number;
  title: string;
  description: string;
  /** Why this lesson is in the learner's series, from the placement answers. */
  why: string;
  /** True when the lesson is here because its placement question was missed. */
  focus: boolean;
  /** The check has been answered right. */
  done: boolean;
  /** The text exists already, so opening is instant. */
  written: boolean;
};

export type SeriesSummary = {
  id: string;
  title: string;
  category: Subject;
  description: string;
  status: SeriesStatus;
  /** 0 to 5. */
  lessonsDone: number;
  masteryPassed: boolean;
  /** Best Mastery Check score out of 5, or null if never taken. */
  masteryBest: number | null;
  /** (lessons done + 1 if passed) / 6, rounded. Five lessons without a pass is 83. */
  percent: number;
  /** ISO time of the last change. */
  updatedAt: string;
  isSample: boolean;
  /** The next unfinished lesson, or null when all five are done. */
  nextLesson: { number: number; title: string } | null;
};

export type Series = SeriesSummary & {
  lessons: SeriesLessonRow[];
  /** From the placement test. Null for the sample series. */
  focusLine: string | null;
  placementScore: number | null;
};

/** Where a lesson check stands (lib/almanac/lesson-check.ts). */
export type CheckState = "unanswered" | "missed" | "passed";

export type SeriesLesson = {
  seriesId: string;
  seriesTitle: string;
  number: number;
  title: string;
  description: string;
  why: string;
  /** Null until written. Stream it with streamSeriesLesson. */
  paragraphs: string[] | null;
  check: ChoiceQuestion;
  /** Passed finishes the lesson. Missed waits for retrySeriesCheck to ask it again. */
  checkState: CheckState;
  /** The pick to show on the current question, right or wrong. Null while unanswered. */
  checkPick: number | null;
  askHint: string;
  /** The next lesson is already written, so "Next" opens instantly. */
  nextReady: boolean;
  /** Lesson numbers whose checks haven't been answered right yet. */
  unfinished: number[];
};

// ---- Placement test ----

export type SeriesRequest = {
  topic: string;
  /** Optional: what the learner wants to focus on. */
  focus?: string;
};

/** What the topic check made of a typed topic, before any test is written. */
export type TopicCheck = {
  /** clear: start now. suggest: probably meant something else. unclear: can't tell. refused: won't teach it. */
  verdict: "clear" | "suggest" | "unclear" | "refused";
  /** The topic to use: typos fixed, tidied into a natural title. Empty for unclear and refused. */
  topic: string;
  /** One short sentence for the learner. Empty for clear. */
  note: string;
  /** Up to three topics to pick instead: other readings, or safe angles on a refused topic. */
  suggestions: string[];
};

export type Placement = {
  id: string;
  topic: string;
  focus: string;
  /** Null while the test is being written. */
  questions: ChoiceQuestion[] | null;
  answers: Array<Answer | null>;
  submitted: boolean;
};

export type OutlineRow = {
  number: number;
  title: string;
  focus: boolean;
};

export type PlacementResult = {
  placement: Placement;
  score: number;
  total: number;
  focusLine: string;
  /** Rows written so far. Five when the outline is done. */
  outline: OutlineRow[];
  /** Set once the outline is written and the series exists. */
  seriesId: string | null;
};

// ---- Mastery Check ----

export type MasteryStatus =
  /** Lesson checks still unanswered. */
  | "locked"
  /** Open, questions not written yet. */
  | "ready"
  /** Questions written, answers being chosen. */
  | "taking"
  | "passed"
  | "failed";

export type Mastery = {
  seriesId: string;
  seriesTitle: string;
  status: MasteryStatus;
  /** Lesson numbers still to do. Empty unless locked. */
  unfinished: number[];
  questions: ChoiceQuestion[] | null;
  answers: Array<Answer | null>;
  /** Score of the last submitted attempt. */
  lastScore: number | null;
  best: number | null;
  attempts: number;
  everPassed: boolean;
  /** After a failed attempt: the lessons the missed questions point to. */
  review: Array<{ number: number; title: string }>;
  /** After a pass: two or three series to try next. */
  suggestions: Array<{ title: string; why: string }>;
};

// ---- Tutor ----

/**
 * One piece of a tutor answer as it is written. The paragraph the answer draws
 * on (1-based) comes first, when there is one; "Explain this differently" has none.
 * Text chunks carry their own spaces and are joined as they arrive.
 */
export type TutorChunk = { kind: "source"; paragraph: number } | { kind: "text"; text: string };

// ---- Stats ----

export type Stats = {
  streak: Streak;
  totalLessons: number;
  /** Lessons finished per day for the last seven days, oldest first, ending today. */
  lastSevenDays: Array<StreakDay & { count: number }>;
  recall: { correct: number; total: number };
  seriesCompleted: number;
  masteryScores: Array<{ seriesId: string; title: string; best: number }>;
  bySubject: Array<{ subject: Subject; lessons: number }>;
};

// ---- Guests ----

export type GuestState = {
  /** A guest has finished at least one lesson in this browser. */
  hasProgress: boolean;
  streak: number;
  /** The subject picker has been shown once. */
  subjectsPrompted: boolean;
};

/** Sample-layer failures and limits that can be forced from the local-only /dev pages. */
export const FORCE_FLAGS = [
  "dailyFail",
  "askFail",
  "seriesLessonFail",
  "placementFail",
  "outlineFail",
  "masteryFail",
  "loadFail",
  "topicSuggest",
  "topicUnclear",
  "topicRefused",
] as const;

export type ForceFlag = (typeof FORCE_FLAGS)[number];

/** Thrown by the source when writing or loading fails. Screens show a Notice. */
export class AlmanacError extends Error {
  constructor(
    public kind: "writeFailed" | "loadFailed" | "notFound" | "accountRequired",
    message?: string
  ) {
    super(message ?? kind);
    this.name = "AlmanacError";
  }
}
