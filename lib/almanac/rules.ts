// Product rules from docs/design/spec.md, as pure functions.

import type { Answer, ChoiceQuestion, SeriesStatus, StreakDay } from "./types";

export const LESSONS_PER_SERIES = 5;

/**
 * Lesson text is markdown in sections. Sections are separated by a line holding
 * only `---`, since a section can have blank lines of its own (a list, a table).
 */
export const SECTION_BREAK = "\n\n---\n\n";

const BREAK_LINE = /^[ \t]*-{3,}[ \t]*$/m;

/**
 * Splits lesson text into its sections. While it is still being written, a
 * half-typed break at the very end is held back so it never shows as text.
 * Finished text with no breaks at all (older lessons, or a writer that forgot)
 * falls back to splitting on blank lines.
 */
export function splitSections(text: string, { streaming = false }: { streaming?: boolean } = {}): string[] {
  let body = text.replace(/\r\n/g, "\n");
  if (streaming) body = body.replace(/\n[ \t]*-{1,3}[ \t]*$/, "");
  const parts = BREAK_LINE.test(body) || streaming ? body.split(new RegExp(BREAK_LINE.source, "gm")) : body.split(/\n\s*\n/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * How many sections a lesson body draws. While the text is being written (or
 * hasn't arrived) it holds `reserve` places so the page doesn't jump; once it is
 * written, only the sections it has. A lesson can have fewer than `reserve`
 * sections, and a reserved place left over would sit under the text as a blank.
 */
export function sectionSlots(written: number, reserve: number, writing: boolean): number {
  return writing || written === 0 ? Math.max(reserve, written) : written;
}

/** Markdown with its marks taken out, for screen-reader announcements and plain previews. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ""))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+[.)])[ \t]+/gm, "")
    .replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/(\*\*|__|~~|\*|_|`)/g, "")
    .replace(/^[ \t]*-{3,}[ \t]*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
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
  return recentDays(finishedDates, 7, today);
}

/** The last `length` days, oldest first, ending today. */
export function recentDays(finishedDates: Iterable<string>, length: number, today: string = localDate()): StreakDay[] {
  const done = new Set(finishedDates);
  return Array.from({ length }, (_, i) => {
    const date = shiftDate(today, i - (length - 1));
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

/** Options that point at each other or at a lettered list only make sense in the order they were written. */
export function keepsOrder(options: string[]): boolean {
  return options.some(
    (o) =>
      /^\s*\(?[A-D][.,:)\s]/.test(o) ||
      /^\s*(version|option|snippet|example|line)\s+\d/i.test(o) ||
      /\b(all|none|both) of (the )?(above|these)\b/i.test(o)
  );
}

/** The same question with its options in a new random order. */
export function shuffleChoice<T extends { options: string[]; correctIndex: number }>(question: T): T {
  const order = question.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...question, options: order.map((i) => question.options[i]), correctIndex: order.indexOf(question.correctIndex) };
}
