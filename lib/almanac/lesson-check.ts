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
