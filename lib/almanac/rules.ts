// Product rules from docs/design/spec.md, as pure functions.

import type { Answer, ChoiceQuestion, SeriesStatus, StreakDay } from "./types";

export const LESSONS_PER_SERIES = 5;
export const MASTERY_PASS = 4;

/** Local calendar date as YYYY-MM-DD. Streaks follow the learner's own timezone. */
export function localDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The date `days` before (negative) or after (positive) a YYYY-MM-DD date. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** (lessons with their check answered, plus 1 if the Mastery Check is passed) / 6. */
export function percentComplete(lessonsDone: number, masteryPassed: boolean): number {
  return Math.round(((lessonsDone + (masteryPassed ? 1 : 0)) / (LESSONS_PER_SERIES + 1)) * 100);
}

export function seriesStatus(lessonsDone: number, masteryPassed: boolean): SeriesStatus {
  if (masteryPassed) return "completed";
  return lessonsDone > 0 ? "inProgress" : "notStarted";
}

/** The Mastery Check opens when all five lesson checks are answered. */
export function masteryOpen(lessonsDone: number): boolean {
  return lessonsDone >= LESSONS_PER_SERIES;
}

export function masteryPassed(score: number): boolean {
  return score >= MASTERY_PASS;
}

/** Not sure and no answer both score as wrong. */
export function scoreAnswers(questions: ChoiceQuestion[], answers: Array<Answer | null>): number {
  return questions.filter((q, i) => answers[i] === q.correctIndex).length;
}

/**
 * Consecutive days with any lesson finished, counted back from today.
 * Not having finished one yet today never breaks the streak.
 */
export function streakCount(finishedDates: Iterable<string>, today: string = localDate()): number {
  const done = new Set(finishedDates);
  let day = done.has(today) ? today : shiftDate(today, -1);
  let count = 0;
  while (done.has(day)) {
    count += 1;
    day = shiftDate(day, -1);
  }
  return count;
}

export function longestStreak(finishedDates: Iterable<string>): number {
  const sorted = [...new Set(finishedDates)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && shiftDate(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** The last seven days, oldest first, ending today. */
export function lastSevenDays(finishedDates: Iterable<string>, today: string = localDate()): StreakDay[] {
  const done = new Set(finishedDates);
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6);
    const name = parseLocalDate(date).toLocaleDateString("en-US", { weekday: "long" });
    return {
      letter: name[0],
      short: name.slice(0, 3),
      name,
      date,
      done: done.has(date),
      isToday: date === today,
    };
  });
}

/** "1", "1 and 2", "1, 2 and 3". */
export function joinList(items: Array<string | number>): string {
  if (items.length <= 1) return String(items[0] ?? "");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The sentence under a placement score, built from the missed questions. */
export function focusLine(questions: ChoiceQuestion[], answers: Array<Answer | null>): string {
  const missed = questions.map((q, i) => (answers[i] === q.correctIndex ? -1 : i)).filter((i) => i >= 0);
  if (missed.length === 0) {
    return "You got all five. Your series skips the basics and goes further on each topic.";
  }
  if (missed.length === questions.length) {
    return "A fresh start. Your series begins from the ground up and takes each topic slowly.";
  }
  const numbers = joinList(missed.map((i) => i + 1));
  const topics = joinList(missed.map((i) => questions[i].topic ?? `question ${i + 1}`));
  return `You missed ${missed.length === 1 ? "question" : "questions"} ${numbers}, so your series spends the most time on ${topics}.`;
}

/** The "why this is in your series" line for lesson `index` (0-based). */
export function whyLine(questions: ChoiceQuestion[], answers: Array<Answer | null>, index: number): string {
  const question = questions[index];
  if (!question) return "";
  return answers[index] === question.correctIndex
    ? `A quick refresher. You got question ${index + 1} right.`
    : `Here because you missed question ${index + 1}, on ${question.topic ?? "this topic"}.`;
}
