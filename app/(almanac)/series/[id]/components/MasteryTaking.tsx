"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { BackIcon } from "@/components/almanac/icons";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { QuestionNav } from "@/components/almanac/QuestionNav";
import { almanac, type Answer, type Mastery } from "@/lib/almanac";
import { shortTitle } from "./copy";

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

  // After moving to another question, start reading from its prompt.
  useEffect(() => {
    if (moved.current || focusHeading) heading.current?.focus();
  }, [index, focusHeading]);

  const question = questions[index];
  if (!question) return null;

  const lastIndex = questions.length - 1;
  const answered = answers.map((answer) => answer !== null);
  const left = answered.filter((isAnswered) => !isAnswered).length;
  const answeredLine = `${questions.length - left} of ${questions.length} answered`;
  const from = `from lesson ${question.lessonNumber ?? index + 1}`;

  const jump = (next: number) => {
    moved.current = true;
    setIndex(next);
    window.scrollTo({ top: 0 });
  };

  // Shown at once and saved on every change, so a refresh restores the check.
  const choose = (answer: Answer) => {
    onUpdate({ ...mastery, answers: answers.map((previous, i) => (i === index ? answer : previous)) });
    almanac
      .saveMasteryAnswer(id, index, answer)
      .then(() => setSaveFailed(false))
      .catch(() => setSaveFailed(true));
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      const result = await almanac.submitMastery(id);
      window.scrollTo({ top: 0 });
      onUpdate(result);
    } catch {
      setSubmitFailed(true);
      setSubmitting(false);
    }
  };

  const savedNote = "Saved as you go. Refreshing keeps your answers.";

  return (
    <SessionPage
      leaveHref={`/series/${id}`}
      leaveLabel="Series"
      width="wide"
      footerDesktop={false}
      footer={
        <div>
          <div className="flex gap-2 [&>*:last-child]:min-w-0 [&>*:last-child]:flex-auto">
            {index > 0 && (
              <Button variant="secondary" size="large" className="flex-none px-4! text-[14px]!" onClick={() => jump(index - 1)}>
                Back
              </Button>
            )}
            {index < lastIndex ? (
              <Button size="large" icon onClick={() => jump(index + 1)}>
                Next question
              </Button>
            ) : left > 0 ? (
              <Button size="large" disabled>
                Answer {left} more to submit
              </Button>
            ) : (
              <Button size="large" icon busy={submitting} onClick={submit}>
                Submit answers
              </Button>
            )}
          </div>
          <p className="m-0 mt-2 text-center font-mono text-[12px] text-(--ink-muted)">{savedNote}</p>
        </div>
      }
    >
      <div className="flex flex-wrap items-start gap-x-[72px] gap-y-0 pt-5 md:gap-y-10 md:pt-10">
        <div className="min-w-0 flex-[1_1_300px] md:max-w-[380px]">
          <div className="t-label flex items-baseline justify-between gap-3 font-normal!">
            <span className="text-(--accent)">
              Mastery Check
              <span className="hidden md:inline"> · {shortTitle(mastery.seriesTitle)}</span>
            </span>
            <span className="flex-none text-(--ink-muted) md:hidden">{answeredLine}</span>
          </div>
          <QuestionNav
            variant="row"
            className="mt-3 md:hidden"
            count={questions.length}
            current={index}
            answered={answered}
            onJump={jump}
          />
          <QuestionNav
            variant="list"
            className="mt-3 hidden md:block"
            count={questions.length}
            current={index}
            answered={answered}
            onJump={jump}
            meta={questions.map((q, i) => `From lesson ${q.lessonNumber ?? i + 1}`)}
          />
          <p className="t-note m-0 mt-[14px] hidden text-(--ink-muted) md:block">{savedNote}</p>
        </div>

        <section className="min-w-0 max-w-[760px] flex-[999_1_560px]">
          <div className="mt-[22px] flex justify-between gap-3 font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted) md:mt-0 md:tracking-[0.08em]">
            <span>
              Question {index + 1}
              <span className="hidden md:inline"> of {questions.length}</span> · {from}
            </span>
            <span className="hidden flex-none md:inline">{answeredLine}</span>
          </div>
          <h1
            ref={heading}
            tabIndex={-1}
            className="m-0 mt-2 text-[24px] font-medium leading-[1.22] outline-none md:mt-[14px] md:text-[32px] md:tracking-[-0.01em]"
          >
            {question.prompt}
          </h1>
          <Question
            key={index}
            className="mt-[18px] md:mt-7"
            label={question.prompt}
            options={question.options}
            value={answers[index]}
            onChange={choose}
            mode="deferred"
            allowUnsure
          />
          <p className="t-note m-0 mt-4 text-(--ink-muted) md:mt-[14px] md:text-[16px]">
            You can change answers until you submit. “Not sure” counts as wrong, which is fine: it tells us what to
            teach.
          </p>
          {saveFailed && (
            <p role="alert" className="m-0 mt-3 text-[15px] text-(--incorrect)">
              That answer didn’t save. Pick it again before you submit.
            </p>
          )}
          {submitFailed && (
            <p role="alert" className="m-0 mt-3 text-[15px] text-(--incorrect)">
              Your answers didn’t go through. They are still saved. Try again.
            </p>
          )}

          {/* On phones the same actions are pinned to the bottom of the screen. */}
          <div className="mt-8 hidden flex-wrap items-center justify-between gap-[14px] border-0 border-t-[3px] border-solid border-(--ink) pt-[18px] md:flex">
            {index > 0 ? (
              <Button variant="secondary" onClick={() => jump(index - 1)}>
                <BackIcon size={15} />
                Question {index}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap gap-[10px]">
              {left > 0 ? (
                <Button disabled>Submit · answer {left} more</Button>
              ) : (
                <Button icon busy={submitting} onClick={submit}>
                  Submit answers
                </Button>
              )}
              {index < lastIndex && (
                <Button variant={left > 0 ? "primary" : "secondary"} icon onClick={() => jump(index + 1)}>
                  Question {index + 2}
                </Button>
              )}
            </div>
          </div>
          <p className="m-0 mt-[10px] hidden font-mono text-[12px] text-(--ink-muted) md:block">
            Keys: A to D, or N for Not sure
          </p>
        </section>
      </div>
    </SessionPage>
  );
}
