"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { StepMeter } from "@/components/almanac/StepMeter";
import { Markdown } from "@/components/almanac/Markdown";
import { almanac, type Answer, type Mastery } from "@/lib/almanac";

type MasteryTakingProps = {
  mastery: Mastery;
  /** True when the learner arrived from the writing screen: the first prompt then takes focus. */
  focusHeading?: boolean;
  /** Called with the saved answers, and with the result once the check is submitted. */
  onUpdate: (mastery: Mastery) => void;
};

/** Five questions, one at a time. Answers can change until the check is submitted. */
export function MasteryTaking({ mastery, focusHeading = false, onUpdate }: MasteryTakingProps) {
  const id = mastery.seriesId;
  const questions = mastery.questions ?? [];
  const { answers } = mastery;
  // A refresh comes back to the first question still unanswered.
  const [index, setIndex] = useState(() => Math.max(0, answers.findIndex((answer) => answer === null)));
  const [saveFailed, setSaveFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  // Saves go out one after another, and submitting waits for the last one.
  const saves = useRef<Promise<void>>(Promise.resolve());

  // After moving to another question, start reading from its prompt.
  useEffect(() => {
    if (moved.current || focusHeading) heading.current?.focus();
  }, [index, focusHeading]);

  const question = questions[index];
  if (!question) return null;

  const lastIndex = questions.length - 1;
  const left = answers.filter((answer) => answer === null).length;
  const answeredCount = questions.length - left;

  const jump = (next: number) => {
    moved.current = true;
    setIndex(next);
    window.scrollTo({ top: 0 });
  };

  // Shown at once and saved on every change, so a refresh restores the check.
  const choose = (answer: Answer) => {
    const at = index;
    onUpdate({ ...mastery, answers: answers.map((previous, i) => (i === at ? answer : previous)) });
    setSaveFailed(false);
    saves.current = saves.current
      .then(() => almanac.saveMasteryAnswer(id, at, answer))
      .then(
        () => undefined,
        () => setSaveFailed(true)
      );
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      await saves.current;
      // If a save was lost on the way, send every answer again before submitting.
      if (saveFailed) {
        await Promise.all(answers.map((answer, i) => (answer === null ? null : almanac.saveMasteryAnswer(id, i, answer))));
        setSaveFailed(false);
      }
      const result = await almanac.submitMastery(id);
      window.scrollTo({ top: 0 });
      onUpdate(result);
    } catch {
      setSubmitFailed(true);
      setSubmitting(false);
    }
  };

  const primary =
    index < lastIndex ? (
      <Button icon onClick={() => jump(index + 1)}>
        Next question
      </Button>
    ) : left > 0 ? (
      <Button disabled>Answer {left} more to submit</Button>
    ) : (
      <Button icon busy={submitting} onClick={submit}>
        {submitting ? "Sending your answers" : "Submit answers"}
      </Button>
    );

  return (
    <SessionPage
      leaveHref={`/series/${id}`}
      leaveLabel="Leave check"
      rail={
        <StepMeter
          steps={questions.length}
          current={index}
          label={`Mastery Check · ${answeredCount} of ${questions.length} answered · saved as you go`}
        />
      }
      stepKey={`question-${index}`}
      footer={primary}
      footerQuiet={
        index > 0 ? (
          <Button variant="quiet" onClick={() => jump(index - 1)}>
            or go back to question {index}
          </Button>
        ) : undefined
      }
    >
      <section>
        <p className="t-eyebrow m-0">
          Question {index + 1} of {questions.length} · from lesson {question.lessonNumber ?? index + 1}
        </p>
        <h1 ref={heading} tabIndex={-1} className="after-eyebrow m-0 text-[24px] font-medium leading-[1.25] [overflow-wrap:anywhere] md:text-[32px]">
          <Markdown mode="inline">{question.prompt}</Markdown>
        </h1>
        <Question
          key={index}
          className="mt-7 md:mt-10"
          label={question.prompt}
          options={question.options}
          value={answers[index]}
          onChange={choose}
          mode="deferred"
          allowUnsure
        />
        <p className="m-0 mt-5 text-[16px] italic text-(--ink-muted)">You can change answers until you submit.</p>
        {saveFailed && !submitFailed && (
          <p role="alert" className="m-0 mt-3 text-[16px] text-(--incorrect)">
            That answer didn’t save. It will be sent again when you submit.
          </p>
        )}
        {submitFailed && (
          <p role="alert" className="m-0 mt-3 text-[16px] text-(--incorrect)">
            Your answers didn’t go through. They are still here. Try again.
          </p>
        )}
      </section>
    </SessionPage>
  );
}
