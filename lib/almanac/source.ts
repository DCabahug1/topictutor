import type {
  Answer,
  CustomSubject,
  DailyLesson,
  DailySession,
  GuestState,
  Mastery,
  OutlineRow,
  PastDailyLesson,
  Placement,
  PlacementResult,
  Series,
  SeriesLesson,
  SeriesRequest,
  SeriesSummary,
  Stats,
  Subject,
  SubjectChoice,
  TopicCheck,
  TutorChunk,
} from "./types";

/** Which lesson the ask box is attached to. */
export type TutorContext = { kind: "daily" } | { kind: "series"; seriesId: string; number: number };

/**
 * Everything the Almanac screens need from the data layer.
 *
 * Text that is written on first open comes back as an async iterable of small
 * chunks. Paragraphs are separated by a blank line. Calls reject with an
 * AlmanacError when writing or loading fails.
 */
export interface AlmanacSource {
  // Daily lesson
  getDailySession(): Promise<DailySession>;
  /** Writes today's lesson. Only needed while `lesson.paragraphs` is null. */
  streamDailyLesson(): AsyncIterable<string>;
  answerRecall(answer: number): Promise<DailySession>;
  /**
   * One pick per question. The lesson finishes once enough of the check is right
   * (DAILY_PASS_SHARE in lesson-check.ts); a wrong pick waits for retryDailyCheck.
   */
  answerDailyCheck(index: number, answer: number): Promise<DailySession>;
  /** Asks a missed daily question again, the same words with the right answer moved. */
  retryDailyCheck(index: number): Promise<DailySession>;
  getPastDailyLessons(): Promise<PastDailyLesson[]>;
  getPastDailyLesson(id: string): Promise<DailyLesson>;

  /**
   * `question` null means "Explain this differently". Nothing is stored. The
   * answer names the paragraph it comes from before its text, when it has one.
   */
  askTutor(context: TutorContext, question: string | null): AsyncIterable<TutorChunk>;

  // Subjects
  getSubjects(): Promise<SubjectChoice>;
  /** `custom` replaces the learner's own subjects. Null keeps the ones already saved. */
  saveSubjects(subjects: Subject[], custom?: CustomSubject[] | null): Promise<void>;
  /**
   * Reads a name typed for a custom subject, as checkTopic does for a series topic: a likely
   * typo, something it can't make sense of, or something it won't teach. Open
   * to guests. Answers "clear" whenever it can't tell.
   */
  checkSubject(name: string): Promise<TopicCheck>;

  // Guests
  getGuestState(): Promise<GuestState>;

  // Series
  listSeries(): Promise<SeriesSummary[]>;
  getSeries(id: string): Promise<Series>;
  deleteSeries(id: string): Promise<void>;
  getSeriesLesson(id: string, number: number): Promise<SeriesLesson>;
  /** Writes a series lesson. Only needed while `paragraphs` is null. */
  streamSeriesLesson(id: string, number: number): AsyncIterable<string>;
  /** Only a right answer finishes the lesson. A wrong one is shown, then waits for retrySeriesCheck. */
  answerSeriesCheck(id: string, number: number, answer: number): Promise<SeriesLesson>;
  /** After a wrong answer: the check again, rephrased with its options reshuffled. */
  retrySeriesCheck(id: string, number: number): Promise<SeriesLesson>;

  // Placement test (one in progress at a time)
  /**
   * Reads a typed topic before anything is written: a likely typo, something it
   * can't make sense of, or something it won't teach. Charges nothing, and
   * answers "clear" whenever it can't tell, so it never stands in the way.
   */
  checkTopic(request: SeriesRequest): Promise<TopicCheck>;
  /** Needs an account: rejects with accountRequired for guests, as every series call does. */
  startPlacement(request: SeriesRequest): Promise<Placement>;
  getPlacement(): Promise<Placement | null>;
  /** Writes the five questions. Resolves at once if they exist. */
  writePlacementTest(): Promise<Placement>;
  /** Saved on every change, so a refresh restores the test. */
  savePlacementAnswer(index: number, answer: Answer): Promise<Placement>;
  submitPlacement(): Promise<PlacementResult>;
  getPlacementResult(): Promise<PlacementResult | null>;
  /** Writes the outline one row at a time, then creates the series. */
  streamOutline(): AsyncIterable<OutlineRow>;

  // Mastery Check
  getMastery(seriesId: string): Promise<Mastery>;
  writeMastery(seriesId: string): Promise<Mastery>;
  saveMasteryAnswer(seriesId: string, index: number, answer: Answer): Promise<Mastery>;
  submitMastery(seriesId: string): Promise<Mastery>;
  /** Clears the answers for another attempt. The best score is kept. */
  retakeMastery(seriesId: string): Promise<Mastery>;

  // Stats
  getStats(): Promise<Stats>;
}
