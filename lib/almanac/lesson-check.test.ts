import { describe, expect, it } from "vitest";
import {
  answerCheck,
  askCheckAgain,
  canAskAgain,
  checkForScreen,
  checkState,
  isDone,
  moveRightAnswer,
  wasMissed,
  type LessonCheck,
} from "./lesson-check";
import type { ChoiceQuestion } from "./types";

const question: ChoiceQuestion = { prompt: "Which is right?", options: ["a", "b", "c", "d"], correctIndex: 2, explanation: "c is right." };
const rephrased: ChoiceQuestion = { prompt: "Which is right now?", options: ["w", "x", "y", "z"], correctIndex: 0, explanation: "w is right." };
const fresh: LessonCheck = { question, passed: null, missed: null, everMissed: false };

describe("answering", () => {
  it("passes on a right pick and finishes the lesson", () => {
    const { check, outcome } = answerCheck(fresh, 2);
    expect(outcome).toBe("passed");
    expect(checkState(check)).toBe("passed");
    expect(isDone(check)).toBe(true);
    expect(wasMissed(check)).toBe(false);
  });

  it("holds a wrong pick as missed, and the lesson stays unfinished", () => {
    const { check, outcome } = answerCheck(fresh, 0);
    expect(outcome).toBe("missed");
    expect(checkState(check)).toBe("missed");
    expect(isDone(check)).toBe(false);
    expect(wasMissed(check)).toBe(true);
  });

  it("takes one pick per question", () => {
    const missed = answerCheck(fresh, 0).check;
    expect(answerCheck(missed, 2)).toEqual({ check: missed, outcome: "ignored" });
    const passed = answerCheck(fresh, 2).check;
    expect(answerCheck(passed, 0)).toEqual({ check: passed, outcome: "ignored" });
  });
});

describe("asking again", () => {
  it("is only for a missed check", () => {
    expect(canAskAgain(fresh)).toBe(false);
    expect(canAskAgain(answerCheck(fresh, 0).check)).toBe(true);
    expect(canAskAgain(answerCheck(fresh, 2).check)).toBe(false);
    expect(askCheckAgain(fresh, rephrased)).toBe(fresh);
  });

  it("clears the miss, keeps that it was missed, and asks the new question", () => {
    const again = askCheckAgain(answerCheck(fresh, 0).check, rephrased);
    expect(checkState(again)).toBe("unanswered");
    expect(again.question).toBe(rephrased);
    expect(wasMissed(again)).toBe(true);
  });

  it("a right pick after a miss finishes the lesson and it still counts as missed", () => {
    const again = askCheckAgain(answerCheck(fresh, 0).check, rephrased);
    const { check, outcome } = answerCheck(again, 0);
    expect(outcome).toBe("passed");
    expect(isDone(check)).toBe(true);
    expect(wasMissed(check)).toBe(true);
  });
});

describe("rows from before retries", () => {
  it("a stored wrong pick stays finished and counts as missed", () => {
    const old: LessonCheck = { question, passed: 1, missed: null, everMissed: false };
    expect(checkState(old)).toBe("passed");
    expect(isDone(old)).toBe(true);
    expect(wasMissed(old)).toBe(true);
  });
});

describe("what the screen gets", () => {
  it("shows the pick, right or wrong", () => {
    expect(checkForScreen(fresh)).toEqual({ check: question, checkState: "unanswered", checkPick: null });
    expect(checkForScreen(answerCheck(fresh, 0).check)).toMatchObject({ checkState: "missed", checkPick: 0 });
    expect(checkForScreen(answerCheck(fresh, 2).check)).toMatchObject({ checkState: "passed", checkPick: 2 });
  });
});

describe("moving the right answer", () => {
  it("always moves it off the slot just shown, keeping every option", () => {
    for (let n = 0; n < 500; n += 1) {
      const moved = moveRightAnswer(question);
      expect(moved.correctIndex).not.toBe(question.correctIndex);
      expect(moved.options[moved.correctIndex]).toBe("c");
      expect([...moved.options].sort()).toEqual(question.options);
    }
  });

  it("leaves options whose order matters alone", () => {
    const ordered = { ...question, options: ["version 1", "version 2", "version 3", "All of the above"] };
    expect(moveRightAnswer(ordered)).toBe(ordered);
  });
});
