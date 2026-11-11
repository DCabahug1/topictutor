"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Caret } from "@/components/almanac/Button";
import { BackIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { QuestionNav } from "@/components/almanac/QuestionNav";
import { almanac, useAlmanac, type Answer } from "@/lib/almanac";
import { InlineAlert, LoadingLines, TestRule } from "./parts";

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
        <TestRule />
        <div className="pt-7 md:pt-12">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Your placement test didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "Change the topic", href: START }}
          />
        </div>
      </SessionPage>
    );
  }

  if (!placement || placement.submitted) {
    return (
      <SessionPage {...leave}>
        <TestRule />
        <LoadingLines label="Loading your placement test" />
      </SessionPage>
    );
  }

  if (!questions && writeFailed) {
    return (
      <SessionPage {...leave}>
        <TestRule />
        <div className="pt-7 md:pt-12">
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
            secondary={{ label: "Change the topic", href: START }}
          />
        </div>
      </SessionPage>
    );
  }

  if (!questions) {
    return (
      <SessionPage
        leaveHref={START}
        leaveLabel="Cancel"
        footer={
          <Button size="large" disabled busy>
            Writing questions
          </Button>
        }
      >
        <TestRule />
        <section key="writing" aria-busy="true" className="almanac-rise pt-7 md:pt-12">
          <p className="t-label m-0 flex items-center gap-2 font-normal! text-(--accent)">
            <Caret className="h-[14px]" />
            Placement test
          </p>
          <h1 className="m-0 mt-3 text-[32px] font-medium leading-[1.08] tracking-[-0.015em] md:text-[44px]">
            Writing five questions on {placement.topic}.
          </h1>
          <p className="m-0 mt-[10px] text-[16px] italic text-(--ink-muted) md:text-[17px]">
            Usually a few seconds. You can leave and come back. Nothing is lost.
          </p>
          <div aria-hidden="true" className="mt-7 flex flex-col gap-[10px]">
            <span className="h-[22px] w-[88%] bg-(--paper-sunk)" />
            <span className="h-[52px] bg-(--paper-sunk)" />
            <span className="h-[52px] bg-(--paper-sunk)" />
            <span className="h-[52px] bg-(--paper-sunk)" />
            <span className="h-[52px] bg-(--paper-sunk)" />
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
  const level = question.level ? ` · ${question.level}` : "";

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

  const submitLabel = submitting ? "Sending your answers" : "Submit answers";

  return (
    <SessionPage
      {...leave}
      width="wide"
      footerDesktop={false}
      footer={
        <div>
          <div className="flex gap-2">
            {index > 0 && (
              <Button
                variant="secondary"
                size="large"
                className="flex-none px-4! text-[14px]! font-normal!"
                onClick={() => go(index - 1)}
              >
                Back
              </Button>
            )}
            {!last ? (
              <Button size="large" icon className="min-w-0 flex-auto" onClick={() => go(index + 1)}>
                Next question
              </Button>
            ) : left > 0 ? (
              <Button size="large" disabled className="min-w-0 flex-auto">
                Answer {left} more to submit
              </Button>
            ) : (
              <Button size="large" icon busy={submitting} className="min-w-0 flex-auto" onClick={submit}>
                {submitLabel}
              </Button>
            )}
          </div>
          <p className="m-0 mt-2 text-center font-mono text-[12px] text-(--ink-muted)">
            Saved as you go. Refreshing keeps your answers.
          </p>
        </div>
      }
    >
      <TestRule />
      <div key="taking" className="almanac-rise flex flex-wrap items-start gap-x-[72px] gap-y-10 pt-5 md:pt-10">
        {/* Desktop: every question in a list beside the one on screen. */}
        <div className="hidden min-w-0 max-w-[380px] flex-[1_1_300px] md:block">
          <p className="t-label m-0 mb-3 font-normal! text-(--accent)">Placement test · {placement.topic}</p>
          <QuestionNav
            variant="list"
            count={count}
            current={index}
            answered={chosen.map((answer) => answer !== null)}
            onJump={go}
            meta={questions.every((q) => q.level) ? questions.map((q) => capitalize(q.level ?? "")) : undefined}
          />
          <p className="m-0 mt-[14px] text-[15px] italic text-(--ink-muted)">
            Saved as you go. Refreshing keeps the test and your answers.
          </p>
        </div>

        <section className="min-w-0 max-w-[760px] flex-[999_1_560px]">
          <div className="t-label flex items-baseline justify-between gap-3 font-normal!">
            <span className="text-(--accent) md:hidden">Placement test</span>
            <span className="hidden text-(--ink-muted) md:inline">
              Question {index + 1} of {count}
              {level}
            </span>
            <span className="text-(--ink-muted)">
              {answeredCount} of {count} answered
            </span>
          </div>
          <QuestionNav
            className="mt-3 md:hidden"
            count={count}
            current={index}
            answered={chosen.map((answer) => answer !== null)}
            onJump={go}
          />
          <p className="m-0 mt-[22px] font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted) md:hidden">
            Question {index + 1}
            {level}
          </p>
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
            value={chosen[index]}
            onChange={choose}
            mode="deferred"
            allowUnsure
          />
          <p className="m-0 mt-4 text-[15px] italic text-(--ink-muted) md:mt-[14px] md:text-[16px]">
            You can change answers until you submit. “Not sure” counts as wrong, which is fine: it tells us what to
            teach.
          </p>
          {saveFailed && !submitFailed && (
            <InlineAlert className="mt-3">That answer didn’t save. Check your connection and choose it again.</InlineAlert>
          )}
          {submitFailed && (
            <InlineAlert className="mt-3">Your answers didn’t go through. Nothing is lost, so try again.</InlineAlert>
          )}

          <div className="mt-8 hidden flex-wrap items-center justify-between gap-[14px] border-0 border-t-[3px] border-solid border-(--ink) pt-[18px] md:flex">
            {index > 0 && (
              <Button variant="secondary" onClick={() => go(index - 1)}>
                <BackIcon size={15} />
                Question {index}
              </Button>
            )}
            <div className="ml-auto flex flex-wrap gap-[10px]">
              {left > 0 ? (
                <Button disabled>
                  Submit · answer {left} more
                </Button>
              ) : (
                <Button icon busy={submitting} onClick={submit}>
                  {submitLabel}
                </Button>
              )}
              {!last && (
                <Button variant={left > 0 ? "primary" : "secondary"} icon onClick={() => go(index + 1)}>
                  Question {index + 2}
                </Button>
              )}
            </div>
          </div>
          <p className="m-0 mt-[10px] hidden font-mono text-[12px] text-(--ink-muted) md:block">
            Keys: A to D, or N for Not sure · arrows move between answers
          </p>
        </section>
      </div>
    </SessionPage>
  );
}

function capitalize(word: string) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}
