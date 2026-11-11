"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button, Caret } from "@/components/almanac/Button";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { useSession } from "@/components/almanac/SessionProvider";
import { StepMeter } from "@/components/almanac/StepMeter";
import { almanac, useAlmanac, useTextStream, type DailySession as Session } from "@/lib/almanac";
import { DoneForToday } from "./DoneForToday";
import { Finish } from "./Finish";

type Step = "recall" | "lesson" | "check" | "finish";

const STEP_NAMES: Record<Step, string> = { recall: "Recall", lesson: "Lesson", check: "Check", finish: "Finish" };

export const QUESTION_HEADING =
  "m-0 mt-[18px] text-[30px] font-medium leading-[1.1] tracking-[-0.02em] [overflow-wrap:anywhere] md:text-[48px]";

/** Where a learner picks the session up: recall first, unless there is none or it is answered. */
function firstStep(session: Session): Step {
  if (session.recall && session.recallAnswer === null) return "recall";
  return session.checkAnswers.some((a) => a !== null) ? "check" : "lesson";
}

export function DailySession() {
  // useSearchParams needs a boundary so the rest of the page can prerender.
  return (
    <Suspense fallback={null}>
      <DailySessionInner />
    </Suspense>
  );
}

function DailySessionInner() {
  const user = useSession();
  const router = useRouter();
  const rereading = useSearchParams().get("read") === "1";
  const home = user ? "/today" : "/";

  const { data: session, error, loading, reload, setData } = useAlmanac(() => almanac.getDailySession(), []);
  const [step, setStep] = useState<Step | null>(null);
  const [checkIndex, setCheckIndex] = useState(0);
  // Whether the lesson was already finished when this visit started.
  const [arrivedDone, setArrivedDone] = useState<boolean | null>(null);
  // An answer that didn't save. The option stays open so it can be picked again.
  const [saveFailed, setSaveFailed] = useState(false);
  const lesson = useTextStream();
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Decide where to start once the session has loaded.
  if (session && step === null) {
    setArrivedDone(session.finishedAt !== null);
    setStep(firstStep(session));
    setCheckIndex(Math.max(0, session.checkAnswers.findIndex((a) => a === null)));
  }

  const go = useCallback((next: Step) => {
    moved.current = true;
    setSaveFailed(false);
    setStep(next);
    window.scrollTo({ top: 0 });
  }, []);

  // After a step change, start reading from the new step's heading.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step, checkIndex]);

  // A lesson opened for the first time is written while the learner watches.
  const needsWriting = Boolean(session && !session.lesson.paragraphs);
  const onLessonStep = step === "lesson" && arrivedDone === false;
  const { status: writeStatus, start: startWriting } = lesson;
  useEffect(() => {
    if (onLessonStep && needsWriting && writeStatus === "idle") startWriting(almanac.streamDailyLesson());
  }, [onLessonStep, needsWriting, writeStatus, startWriting]);

  // Signed-in learners who are done see the Today page instead.
  const sendToToday = Boolean(user && arrivedDone && !rereading);
  useEffect(() => {
    if (sendToToday) router.replace("/today");
  }, [sendToToday, router]);

  const paragraphs = session?.lesson.paragraphs ?? (lesson.text ? lesson.text.split("\n\n") : []);
  const writing = needsWriting && lesson.status !== "done" && lesson.status !== "failed";
  const writeFailed = needsWriting && lesson.status === "failed";
  const checkCount = session?.lesson.check.length ?? 0;
  const checkAnswered = session ? session.checkAnswers[checkIndex] !== null : false;
  const lastCheck = checkIndex === checkCount - 1;

  const continueFromRecall = () => go("lesson");
  const continueFromLesson = () => go("check");
  const continueFromCheck = () => {
    if (!lastCheck) {
      moved.current = true;
      setSaveFailed(false);
      setCheckIndex((i) => i + 1);
      window.scrollTo({ top: 0 });
    } else {
      go("finish");
    }
  };

  /** Saves an answer. If it doesn't save, the question stays open and says so. */
  const save = (write: () => Promise<Session>) => {
    setSaveFailed(false);
    write()
      .then(setData)
      .catch(() => setSaveFailed(true));
  };

  // Enter moves on, as the step's button says.
  const advance = useRef<(() => void) | null>(null);
  useEffect(() => {
    advance.current =
      step === "recall" && session?.recallAnswer !== null
        ? continueFromRecall
        : step === "lesson" && !writing && !writeFailed
          ? continueFromLesson
          : step === "check" && checkAnswered
            ? continueFromCheck
            : null;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("a, input, textarea, select")) return;
      // Enter on a control belongs to that control, except an answered option, which has nothing left to do.
      const button = target.closest("button");
      if (button && !(button.getAttribute("role") === "radio" && button.getAttribute("aria-disabled") === "true")) return;
      advance.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- Loading and failures ----

  if (error) {
    return (
      <SessionPage leaveHref={home}>
        <Notice
          tone="error"
          headingLevel={1}
          kicker="Didn’t load"
          title="Today’s lesson didn’t load."
          body="Check your connection and try again."
          kept="Your streak is safe. Today counts until midnight."
          primary={{ label: "Try again", onClick: reload }}
          secondary={{ label: user ? "Back to Today" : "Back to the start", href: home }}
        />
      </SessionPage>
    );
  }

  if (loading || !session || step === null || sendToToday) {
    return (
      <SessionPage leaveHref={home}>
        <div aria-busy="true">
          <p className="sr-only" role="status">
            Loading today’s lesson
          </p>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <span className="h-3 w-40 bg-(--paper-sunk)" />
            <span className="mt-4 h-12 w-[70%] bg-(--paper-sunk)" />
          </div>
        </div>
      </SessionPage>
    );
  }

  const { lesson: daily, recall } = session;
  const tutor = (
    <AskBox
      lessonId={daily.id}
      hint={daily.askHint}
      onAsk={(question) => almanac.askTutor({ kind: "daily" }, question)}
      onExplainDifferently={() => almanac.askTutor({ kind: "daily" }, null)}
      className="mt-12 md:mt-16"
    />
  );

  // ---- Already finished: done for today, or reading it again ----

  if (arrivedDone) {
    if (!rereading) return <DoneForToday session={session} />;
    return (
      <SessionPage leaveHref={user ? "/today" : "/today/lesson"} leaveLabel="Close lesson">
        <LessonHeader daily={daily} />
        <LessonBody dropCap paragraphs={daily.paragraphs ?? []} className="mt-7 md:mt-9" />
        {tutor}
      </SessionPage>
    );
  }

  // ---- The session ----

  const steps: Step[] = recall ? ["recall", "lesson", "check", "finish"] : ["lesson", "check", "finish"];
  const current = steps.indexOf(step);
  const rail = (
    <StepMeter
      steps={steps.length}
      current={current}
      label={`${STEP_NAMES[step]} · step ${current + 1} of ${steps.length}`}
    />
  );
  const leave = { leaveHref: home, leaveLabel: step === "finish" ? "Close" : "Leave lesson" };
  const notSaved = saveFailed && (
    <p role="alert" className="m-0 mt-5 text-[17px] text-(--incorrect)">
      That answer didn’t save. Pick it again.
    </p>
  );

  if (step === "recall" && recall) {
    const answered = session.recallAnswer !== null;
    return (
      <SessionPage
        {...leave}
        rail={rail}
        stepKey="recall"
        footer={
          answered ? (
            <Button icon onClick={continueFromRecall}>
              Continue to the lesson
            </Button>
          ) : (
            <Button disabled>Pick an answer</Button>
          )
        }
      >
        <section>
          <p className="t-eyebrow m-0">
            Recall · from {recall.fromDay} · {recall.subject}
          </p>
          <h1 ref={heading} tabIndex={-1} className={QUESTION_HEADING}>
            {recall.question.prompt}
          </h1>
          <Question
            className="mt-7 md:mt-10"
            label={recall.question.prompt}
            options={recall.question.options}
            value={session.recallAnswer}
            onChange={(answer) => {
              if (typeof answer === "number") save(() => almanac.answerRecall(answer));
            }}
            mode="instant"
            correctIndex={recall.question.correctIndex}
            explanation={recall.question.explanation}
          />
          {notSaved}
        </section>
      </SessionPage>
    );
  }

  if (step === "lesson" && writeFailed) {
    return (
      <SessionPage {...leave} rail={rail} stepKey="lesson-failed">
        <LessonHeader daily={daily} headingRef={heading} />
        <Notice
          className="mt-8"
          tone="error"
          kicker="Didn’t finish writing"
          title="Today’s lesson didn’t finish writing."
          body="This happens now and then. Trying again usually works within a few seconds."
          kept="Your streak is safe. Today counts until midnight."
          primary={{ label: "Try again", onClick: () => lesson.start(almanac.streamDailyLesson()) }}
          secondary={{ label: user ? "Back to Today" : "Back to the start", href: home }}
        />
      </SessionPage>
    );
  }

  if (step === "lesson") {
    return (
      <SessionPage
        {...leave}
        rail={rail}
        stepKey="lesson"
        footerNote={
          writing
            ? undefined
            : checkCount === 1
              ? "Next: one quick question on what you just read."
              : "Next: two quick questions on what you just read."
        }
        footer={
          writing ? (
            <Button disabled busy>
              Writing the lesson
            </Button>
          ) : (
            <Button icon onClick={continueFromLesson}>
              Continue to the check
            </Button>
          )
        }
      >
        <article>
          <LessonHeader daily={daily} headingRef={heading} />
          {writing && (
            <p className="m-0 mt-4 flex items-center gap-2 text-[16px] italic text-(--ink-muted)">
              <Caret className="h-[15px]" />
              You’re the first to open today’s lesson, so it’s being written now.
            </p>
          )}
          <LessonBody dropCap streaming={writing} paragraphs={paragraphs} className="mt-7 md:mt-9" />
          <p role="status" className="sr-only">
            {needsWriting && lesson.status === "done" ? "The lesson is ready." : ""}
          </p>
        </article>
        {/* The tutor stays hidden until the text is done. */}
        {!writing && tutor}
      </SessionPage>
    );
  }

  if (step === "check") {
    const question = daily.check[checkIndex];
    return (
      <SessionPage
        {...leave}
        rail={rail}
        stepKey={`check-${checkIndex}`}
        footerNote={checkAnswered && lastCheck ? "Right or wrong, answering finishes the lesson." : undefined}
        footer={
          checkAnswered ? (
            <Button icon onClick={continueFromCheck}>
              {lastCheck ? "Finish" : "Next question"}
            </Button>
          ) : (
            <Button disabled>Pick an answer</Button>
          )
        }
      >
        <section>
          <p className="t-eyebrow m-0">
            Question {checkIndex + 1} of {checkCount}
          </p>
          <h1 ref={heading} tabIndex={-1} className={QUESTION_HEADING}>
            {question.prompt}
          </h1>
          <Question
            className="mt-7 md:mt-10"
            label={question.prompt}
            options={question.options}
            value={session.checkAnswers[checkIndex]}
            onChange={(answer) => {
              if (typeof answer === "number") save(() => almanac.answerDailyCheck(checkIndex, answer));
            }}
            mode="instant"
            correctIndex={question.correctIndex}
            explanation={question.explanation}
          />
          {notSaved}
        </section>
      </SessionPage>
    );
  }

  // Finish
  return (
    <SessionPage {...leave} rail={rail} stepKey="finish" width="wide">
      <Finish session={session} headingRef={heading} />
    </SessionPage>
  );
}

function LessonHeader({
  daily,
  headingRef,
}: {
  daily: Session["lesson"];
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <header>
      <p className="t-eyebrow m-0">
        {daily.subject} · about {daily.minutes} minutes
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="t-lead-h1-sm m-0 mt-[18px] [overflow-wrap:anywhere]">
        {daily.title}
      </h1>
    </header>
  );
}
