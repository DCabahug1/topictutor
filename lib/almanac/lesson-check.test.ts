import { describe, expect, it } from "vitest";
import {
  answerCheck,
  askCheckAgain,
  askDailyQuestionAgain,
  dailyCheckPassed,
  dailyQuestionState,
  firstOpenDailyQuestion,
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

describe("the daily check", () => {
  const two = [question, rephrased];

  it("needs every question right when there are one or two", () => {
    expect(dailyCheckPassed([question], [2])).toBe(true);
    expect(dailyCheckPassed([question], [0])).toBe(false);
    expect(dailyCheckPassed(two, [2, 0])).toBe(true);
    expect(dailyCheckPassed(two, [2, 1])).toBe(false);
    expect(dailyCheckPassed(two, [2, null])).toBe(false);
  });

  it("passes at four of five", () => {
    const five = [question, question, question, question, question];
    expect(dailyCheckPassed(five, [2, 2, 2, 2, 0])).toBe(true);
    expect(dailyCheckPassed(five, [2, 2, 2, 0, 0])).toBe(false);
  });

  it("tells a right pick from a miss", () => {
    expect(dailyQuestionState(question, null)).toBe("unanswered");
    expect(dailyQuestionState(question, 2)).toBe("right");
    expect(dailyQuestionState(question, 1)).toBe("missed");
  });

  it("picks up at the first question that isn't right yet", () => {
    expect(firstOpenDailyQuestion(two, [null, null])).toBe(0);
    expect(firstOpenDailyQuestion(two, [2, null])).toBe(1);
    expect(firstOpenDailyQuestion(two, [1, null])).toBe(0);
    expect(firstOpenDailyQuestion(two, [2, 0])).toBe(1);
  });

  it("asks a missed question again with the right answer moved and the pick cleared", () => {
    const again = askDailyQuestionAgain(two, [2, 3], 1);
    expect(again.picks).toEqual([2, null]);
    expect(again.questions[0]).toBe(question);
    expect(again.questions[1].prompt).toBe(rephrased.prompt);
    expect(again.questions[1].options[again.questions[1].correctIndex]).toBe("w");
    expect(again.questions[1].correctIndex).not.toBe(0);
  });

  it("leaves right and unanswered questions alone", () => {
    expect(askDailyQuestionAgain(two, [2, null], 0)).toEqual({ questions: two, picks: [2, null] });
    expect(askDailyQuestionAgain(two, [2, null], 1)).toEqual({ questions: two, picks: [2, null] });
  });
});
