"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button, Caret } from "@/components/almanac/Button";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { SessionProgress } from "@/components/almanac/SessionProgress";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac, useTextStream, type DailySession as Session } from "@/lib/almanac";
import { lessonDate } from "./copy";
import { DoneForToday } from "./DoneForToday";
import { Finish, FinishActions } from "./Finish";

type Step = "recall" | "lesson" | "check" | "finish";

const KICKER = "t-label m-0 font-normal! text-(--accent)";
const QUESTION_HEADING =
  "m-0 mt-3 text-[26px] font-medium leading-[1.2] tracking-[-0.01em] outline-none md:mt-[14px] md:text-[34px] md:leading-[1.15] md:tracking-[-0.015em]";

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
      setCheckIndex((i) => i + 1);
      window.scrollTo({ top: 0 });
    } else {
      go("finish");
    }
  };

  // Enter moves on, as the desktop footer says.
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
        <div className="pt-7 md:pt-12">
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
        </div>
      </SessionPage>
    );
  }

  if (loading || !session || step === null || sendToToday) {
    return (
      <SessionPage leaveHref={home}>
        <div aria-busy="true" className="pt-7 md:pt-12">
          <p className="sr-only" role="status">
            Loading today’s lesson
          </p>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <span className="h-3 w-40 bg-(--paper-sunk)" />
            <span className="mt-2 h-10 w-[70%] bg-(--paper-sunk)" />
          </div>
        </div>
      </SessionPage>
    );
  }

  const { lesson: daily, recall } = session;

  // ---- Already finished: done for today, or reading it again ----

  if (arrivedDone) {
    if (!rereading) return <DoneForToday session={session} />;
    return (
      <SessionPage leaveHref={user ? "/today" : "/today/lesson"} leaveLabel="Close lesson">
        <LessonHeader daily={daily} />
        <LessonBody dropCap paragraphs={daily.paragraphs ?? []} className="mt-[22px] md:mt-8" />
        <AskBox
          lessonId={daily.id}
          hint={daily.askHint}
          onAsk={(question) => almanac.askTutor({ kind: "daily" }, question)}
          onExplainDifferently={() => almanac.askTutor({ kind: "daily" }, null)}
          className="mt-8 border-0 border-t border-solid border-(--rule) pt-[18px] md:mt-12 md:pt-5"
        />
      </SessionPage>
    );
  }

  // ---- The session ----

  const rail = <SessionProgress current={step} hasRecall={recall !== null} />;
  const leave = { leaveHref: home, leaveLabel: "Leave lesson" };
  const keysNote = <span className="font-mono text-[12px] not-italic">Keys: A to D to answer · Enter to continue</span>;

  if (step === "recall" && recall) {
    const answered = session.recallAnswer !== null;
    return (
      <SessionPage
        {...leave}
        rail={rail}
        stepKey="recall"
        footerNote={keysNote}
        footer={
          answered ? (
            <Button size="large" icon onClick={continueFromRecall}>
              Continue to the lesson
            </Button>
          ) : (
            <Button size="large" disabled>
              Choose an answer
            </Button>
          )
        }
      >
        <section className="pt-7 md:pt-12">
          <p className={KICKER}>
            Recall · from {recall.fromDay} · {recall.subject}
          </p>
          <h1 ref={heading} tabIndex={-1} className={QUESTION_HEADING}>
            {recall.question.prompt}
          </h1>
          <Question
            className="mt-5 md:mt-7"
            label={recall.question.prompt}
            options={recall.question.options}
            value={session.recallAnswer}
            onChange={(answer) => {
              if (typeof answer === "number") almanac.answerRecall(answer).then(setData);
            }}
            mode="instant"
            columns={2}
            correctIndex={recall.question.correctIndex}
            explanation={recall.question.explanation}
          />
        </section>
      </SessionPage>
    );
  }

  if (step === "lesson" && writeFailed) {
    return (
      <SessionPage {...leave} rail={rail} stepKey="lesson-failed">
        <LessonHeader daily={daily} headingRef={heading} />
        <Notice
          className="mt-6"
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
            <Button size="large" disabled busy>
              Writing the lesson
            </Button>
          ) : (
            <Button size="large" icon onClick={continueFromLesson}>
              Continue to the check
            </Button>
          )
        }
      >
        <article>
          <LessonHeader daily={daily} headingRef={heading} />
          {writing && (
            <p className="t-note m-0 mt-3 flex items-center gap-2 text-(--ink-muted)">
              <Caret className="h-[15px]" />
              You’re the first to open today’s lesson, so it’s being written now.
            </p>
          )}
          <LessonBody dropCap streaming={writing} paragraphs={paragraphs} className="mt-[22px] md:mt-8" />
          <p role="status" className="sr-only">
            {needsWriting && lesson.status === "done" ? "The lesson is ready." : ""}
          </p>
        </article>
        {/* The ask box stays hidden until the text is done. */}
        {!writing && (
          <AskBox
            lessonId={daily.id}
            hint={daily.askHint}
            onAsk={(question) => almanac.askTutor({ kind: "daily" }, question)}
            onExplainDifferently={() => almanac.askTutor({ kind: "daily" }, null)}
            className="mt-8 border-0 border-t border-solid border-(--rule) pt-[18px] md:mt-12 md:pt-5"
          />
        )}
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
        footerNote={keysNote}
        footer={
          checkAnswered ? (
            <Button size="large" icon onClick={continueFromCheck}>
              {lastCheck ? "Finish" : "Next question"}
            </Button>
          ) : (
            <Button size="large" disabled>
              Choose an answer
            </Button>
          )
        }
      >
        <section className="pt-7 md:pt-12">
          <p className={KICKER}>
            Check · question {checkIndex + 1} of {checkCount}
          </p>
          <h1 ref={heading} tabIndex={-1} className={QUESTION_HEADING}>
            {question.prompt}
          </h1>
          <Question
            className="mt-5 md:mt-7"
            label={question.prompt}
            options={question.options}
            value={session.checkAnswers[checkIndex]}
            onChange={(answer) => {
              if (typeof answer === "number") almanac.answerDailyCheck(checkIndex, answer).then(setData);
            }}
            mode="instant"
            columns={2}
            correctIndex={question.correctIndex}
            explanation={question.explanation}
          />
          {checkAnswered && lastCheck && (
            <p className="t-note m-0 mt-[10px] text-(--ink-muted)">
              Right or wrong, answering the check finishes the lesson.
            </p>
          )}
        </section>
      </SessionPage>
    );
  }

  // Finish
  return (
    <SessionPage {...leave} rail={rail} stepKey="finish" width="wide" footer={<FinishActions session={session} />} footerDesktop={false}>
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
    <header className="pt-7 md:pt-12">
      <div className="t-label flex flex-wrap justify-between gap-2 font-normal!">
        <span className="text-(--accent)">
          {daily.subject} · <span className="md:hidden">{lessonDate(daily.date, true)}</span>
          <span className="hidden md:inline">{lessonDate(daily.date)}</span>
        </span>
        <span className="hidden text-(--ink-muted) md:inline">About {daily.minutes} minutes</span>
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="m-0 mt-3 text-[42px] font-medium leading-[1.02] tracking-[-0.02em] outline-none md:mt-4 md:text-[clamp(42px,5vw,64px)] md:leading-none md:tracking-[-0.025em]"
      >
        {daily.title}
      </h1>
    </header>
  );
}
