// The lesson check: the one question at the end of a series lesson (see GLOSSARY.md).
// Only a right pick finishes the lesson. A wrong pick is shown with the right answer,
// then the check can be asked again. Both data sources store what this module decides.

import { keepsOrder, shuffleChoice } from "./rules";
import type { CheckState, ChoiceQuestion } from "./types";

/** One lesson's check, whatever stores it. */
export type LessonCheck = {
  /** The question as it is asked now, after any asking again. */
  question: ChoiceQuestion;
  /** The pick that finished the lesson. Rows from before retries may hold a wrong pick, and stay finished. */
  passed: number | null;
  /** A wrong pick on the current question, until it is asked again. */
  missed: number | null;
  /** Any pick on this lesson was ever wrong. Never cleared. */
  everMissed: boolean;
};

export function checkState(check: Pick<LessonCheck, "passed" | "missed">): CheckState {
  if (check.passed !== null) return "passed";
  return check.missed !== null ? "missed" : "unanswered";
}

/** The lesson is finished. Takes just `passed`, so list rows that only load that can ask too. */
export function isDone(check: Pick<LessonCheck, "passed">): boolean {
  return check.passed !== null;
}

/** The learner got this lesson's check wrong at some point: what the Mastery Check leans on. */
export function wasMissed(check: LessonCheck): boolean {
  return check.everMissed || (check.passed !== null && check.passed !== check.question.correctIndex);
}

export type AnswerOutcome = "passed" | "missed" | "ignored";

/** One pick per question. Anything but an unanswered check ignores the pick. */
export function answerCheck(check: LessonCheck, pick: number): { check: LessonCheck; outcome: AnswerOutcome } {
  if (checkState(check) !== "unanswered") return { check, outcome: "ignored" };
  if (pick === check.question.correctIndex) return { check: { ...check, passed: pick }, outcome: "passed" };
  return { check: { ...check, missed: pick, everMissed: true }, outcome: "missed" };
}

/** Only a missed check can be asked again. */
export function canAskAgain(check: LessonCheck): boolean {
  return checkState(check) === "missed";
}

/** The check with its new question, the miss cleared. Unchanged unless it can be asked again. */
export function askCheckAgain(check: LessonCheck, question: ChoiceQuestion): LessonCheck {
  return canAskAgain(check) ? { ...check, question, missed: null } : check;
}

/**
 * The missed question in the same words, for when it can't be rephrased: reshuffled so
 * the right answer moves off the slot just shown. Options whose order matters stay put.
 */
export function moveRightAnswer<T extends { options: string[]; correctIndex: number }>(question: T): T {
  const count = question.options.length;
  if (count < 2 || keepsOrder(question.options)) return question;
  const next = shuffleChoice(question);
  if (next.correctIndex !== question.correctIndex) return next;
  // Swap the right answer with any other slot.
  const to = (next.correctIndex + 1 + Math.floor(Math.random() * (count - 1))) % count;
  const options = [...next.options];
  [options[next.correctIndex], options[to]] = [options[to], options[next.correctIndex]];
  return { ...next, options, correctIndex: to };
}

/** What the lesson screen gets: the question, its state, and the pick to show (right or wrong). */
export function checkForScreen(check: LessonCheck): { check: ChoiceQuestion; checkState: CheckState; checkPick: number | null } {
  return { check: check.question, checkState: checkState(check), checkPick: check.passed ?? check.missed };
}

// ---- The daily check ----
// One or two questions after the daily lesson. The lesson is done, and the day counts
// toward the streak, only at DAILY_PASS_SHARE right, which with one or two questions
// means every one. A wrong pick is shown with the right answer, then the same question
// is asked again with the right answer moved. Picks are kept as given, so a pick that
// isn't the right one is a miss waiting to be asked again.

/** The share of daily check questions that must be right. */
export const DAILY_PASS_SHARE = 0.8;

export type DailyQuestionState = "unanswered" | "right" | "missed";

export function dailyQuestionState(question: Pick<ChoiceQuestion, "correctIndex">, pick: number | null): DailyQuestionState {
  if (pick === null) return "unanswered";
  return pick === question.correctIndex ? "right" : "missed";
}

/** Enough questions are right to finish the lesson. */
export function dailyCheckPassed(questions: Array<Pick<ChoiceQuestion, "correctIndex">>, picks: Array<number | null>): boolean {
  if (questions.length === 0) return false;
  const right = questions.filter((q, i) => dailyQuestionState(q, picks[i] ?? null) === "right").length;
  return right / questions.length >= DAILY_PASS_SHARE;
}

/** Where to pick the check up: the first question not yet right. */
export function firstOpenDailyQuestion(questions: Array<Pick<ChoiceQuestion, "correctIndex">>, picks: Array<number | null>): number {
  const open = questions.findIndex((q, i) => dailyQuestionState(q, picks[i] ?? null) !== "right");
  return open === -1 ? Math.max(0, questions.length - 1) : open;
}

/**
 * After a miss: the question asked again with the right answer moved, and its pick
 * cleared. Unchanged unless that question was missed.
 */
export function askDailyQuestionAgain<Q extends ChoiceQuestion>(
  questions: Q[],
  picks: Array<number | null>,
  index: number
): { questions: Q[]; picks: Array<number | null> } {
  const question = questions[index];
  if (!question || dailyQuestionState(question, picks[index] ?? null) !== "missed") return { questions, picks };
  return {
    questions: questions.map((q, i) => (i === index ? moveRightAnswer(q) : q)),
    picks: picks.map((p, i) => (i === index ? null : p)),
  };
}
