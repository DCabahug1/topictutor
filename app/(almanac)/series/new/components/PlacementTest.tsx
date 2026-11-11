"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Caret } from "@/components/almanac/Button";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { StepMeter } from "@/components/almanac/StepMeter";
import { almanac, useAlmanac, type Answer } from "@/lib/almanac";
import { InlineAlert, LoadingLines, QUESTION_HEADING } from "./parts";

const START = "/series/new";
const RESULTS = "/series/new/results";

export function PlacementTest() {
  const router = useRouter();
  const { data: placement, error, loading, reload, setData } = useAlmanac(() => almanac.getPlacement(), []);
  // The answers on screen. Each change is saved behind them, so choosing never waits.
  const [answers, setAnswers] = useState<Array<Answer | null> | null>(null);
  const [index, setIndex] = useState(0);
  const [writeFailed, setWriteFailed] = useState(false);
  const [writeAttempt, setWriteAttempt] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  // Saves go out one after another, and submitting waits for the last one.
  const saves = useRef<Promise<void>>(Promise.resolve());

  const questions = placement?.questions ?? null;

  // A refresh restores the test: the saved answers, and the first question still open.
  if (placement && questions && answers === null) {
    const open = placement.answers.findIndex((answer) => answer === null);
    setAnswers(placement.answers);
    setIndex(open === -1 ? questions.length - 1 : open);
  }

  // No test in progress goes back to the start. A submitted one goes on to its results.
  const missing = !loading && !error && placement === null;
  const alreadySubmitted = Boolean(placement?.submitted);
  useEffect(() => {
    if (missing) router.replace(START);
    else if (alreadySubmitted) router.replace(RESULTS);
  }, [missing, alreadySubmitted, router]);

  // The five questions are written on the first visit.
  const needsWriting = Boolean(placement && !placement.submitted && !questions);
  useEffect(() => {
    if (!needsWriting) return;
    let current = true;
    almanac.writePlacementTest().then(
      (written) => {
        if (!current) return;
        focusHeading.current = true;
        setData(written);
      },
      () => {
        if (current) setWriteFailed(true);
      }
    );
    return () => {
      current = false;
    };
  }, [needsWriting, writeAttempt, setData]);

  // After the test arrives or the question changes, start reading from the question.
  const taking = Boolean(questions && answers);
  useEffect(() => {
    if (!taking || !focusHeading.current) return;
    focusHeading.current = false;
    heading.current?.focus();
  }, [taking, index]);

  const leave = { leaveHref: START, leaveLabel: "Leave test" };

  if (error) {
    return (
      <SessionPage {...leave}>
        <Notice
          tone="error"
          headingLevel={1}
          kicker="Couldn’t load"
          title="Your placement test didn’t load."
          body="It’s probably the connection. Nothing was lost."
          primary={{ label: "Try again", onClick: reload }}
          secondary={{ label: "or change the topic", href: START }}
        />
      </SessionPage>
    );
  }

  if (!placement || placement.submitted) {
    return (
      <SessionPage {...leave}>
        <LoadingLines label="Loading your placement test" />
      </SessionPage>
    );
  }

  if (!questions && writeFailed) {
    return (
      <SessionPage {...leave}>
        <Notice
          tone="error"
          headingLevel={1}
          kicker="Couldn’t write questions"
          title="Your placement test didn’t come through."
          body="No questions were written, so there is nothing to lose. Try again, or change what you want to learn."
          kept={`Topic saved: ${placement.topic}.`}
          primary={{
            label: "Try again",
            onClick: () => {
              setWriteFailed(false);
              setWriteAttempt((n) => n + 1);
            },
          }}
          secondary={{ label: "or change the topic", href: START }}
        />
      </SessionPage>
    );
  }

  if (!questions) {
    return (
      <SessionPage
        leaveHref={START}
        leaveLabel="Cancel"
        rail={<StepMeter steps={5} current={-1} label="Placement test · writing the questions" />}
        footer={
          <Button disabled busy>
            Writing questions
          </Button>
        }
      >
        <section key="writing" aria-busy="true">
          <p className="t-eyebrow m-0 flex items-center gap-2">
            <Caret className="h-[14px]" />
            Placement test
          </p>
          <h1 className={QUESTION_HEADING}>Writing five questions on {placement.topic}.</h1>
          <p className="m-0 mt-5 text-[17px] italic text-(--ink-muted)">
            Usually a few seconds. You can leave and come back. Nothing is lost.
          </p>
          <div aria-hidden="true" className="mt-10 flex flex-col gap-[10px]">
            <span className="h-[58px] bg-(--paper-sunk)" />
            <span className="h-[58px] bg-(--paper-sunk)" />
            <span className="h-[58px] bg-(--paper-sunk)" />
            <span className="h-[58px] bg-(--paper-sunk)" />
          </div>
        </section>
      </SessionPage>
    );
  }

  // ---- Taking the test ----

  const chosen = answers ?? placement.answers;
  const count = questions.length;
  const question = questions[index];
  const answeredCount = chosen.filter((answer) => answer !== null).length;
  const left = count - answeredCount;
  const last = index === count - 1;

  const go = (next: number) => {
    if (next === index) return;
    focusHeading.current = true;
    setIndex(next);
    window.scrollTo({ top: 0 });
  };

  const choose = (answer: Answer) => {
    const at = index;
    setAnswers(chosen.map((previous, i) => (i === at ? answer : previous)));
    setSaveFailed(false);
    saves.current = saves.current
      .then(() => almanac.savePlacementAnswer(at, answer))
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
        await Promise.all(chosen.map((answer, i) => (answer === null ? null : almanac.savePlacementAnswer(i, answer))));
        setSaveFailed(false);
      }
      await almanac.submitPlacement();
      router.push(RESULTS);
    } catch {
      setSubmitFailed(true);
      setSubmitting(false);
    }
  };

  const primary = !last ? (
    <Button icon onClick={() => go(index + 1)}>
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
      {...leave}
      rail={
        <StepMeter
          steps={count}
          current={index}
          label={`Placement test · ${answeredCount} of ${count} answered · saved as you go`}
        />
      }
      stepKey={`question-${index}`}
      footer={primary}
      footerQuiet={
        index > 0 ? (
          <Button variant="quiet" onClick={() => go(index - 1)}>
            or go back to question {index}
          </Button>
        ) : undefined
      }
    >
      <section>
        <p className="t-eyebrow m-0">
          Question {index + 1} of {count}
          {question.level ? ` · ${question.level}` : ""}
        </p>
        <h1 ref={heading} tabIndex={-1} className="after-eyebrow m-0 text-[24px] font-medium leading-[1.25] [overflow-wrap:anywhere] md:text-[32px]">
          {question.prompt}
        </h1>
        <Question
          key={index}
          className="mt-7 md:mt-10"
          label={question.prompt}
          options={question.options}
          value={chosen[index]}
          onChange={choose}
          mode="deferred"
          allowUnsure
        />
        <p className="m-0 mt-5 text-[16px] italic text-(--ink-muted)">
          “Not sure” is a fine answer. It tells us what to teach.
        </p>
        {saveFailed && !submitFailed && (
          <InlineAlert className="mt-3">That answer didn’t save. Check your connection and choose it again.</InlineAlert>
        )}
        {submitFailed && <InlineAlert className="mt-3">Your answers didn’t go through. Nothing is lost, so try again.</InlineAlert>}
      </section>
    </SessionPage>
  );
}
