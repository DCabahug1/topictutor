"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button } from "@/components/almanac/Button";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Markdown } from "@/components/almanac/Markdown";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { LESSONS_PER_SERIES, almanac, splitSections, useAlmanac, useTextStream } from "@/lib/almanac";
import { lessonList, shortTitle } from "./copy";
import { SeriesLoading, SeriesProblem } from "./SeriesStates";

export function SeriesLessonView() {
  const params = useParams<{ id: string; n: string }>();
  const number = /^\d$/.test(params.n) ? Number(params.n) : 0;
  if (number < 1 || number > LESSONS_PER_SERIES) return <SeriesProblem notFound what="lesson" />;
  // Keyed, so moving to another lesson starts clean: no text, no answer, no conversation.
  return <SeriesLesson key={`${params.id}/${number}`} id={params.id} number={number} />;
}

function SeriesLesson({ id, number }: { id: string; number: number }) {
  const { data: lesson, error, reload, setData } = useAlmanac(() => almanac.getSeriesLesson(id, number), [id, number]);
  // Only to know the sample series. The page works without it.
  const { data: series } = useAlmanac(() => almanac.getSeries(id), [id]);
  const { text, status: writeStatus, start: startWriting } = useTextStream();
  const [saveFailed, setSaveFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const checkHeading = useRef<HTMLHeadingElement>(null);

  // A lesson opened for the first time is written while the learner watches.
  const needsWriting = Boolean(lesson && !lesson.paragraphs);
  useEffect(() => {
    if (needsWriting && writeStatus === "idle") startWriting(almanac.streamSeriesLesson(id, number));
  }, [needsWriting, writeStatus, startWriting, id, number]);

  // Once it is written, read it again so "the next lesson is ready" is current.
  useEffect(() => {
    if (!needsWriting || writeStatus !== "done") return;
    let current = true;
    almanac
      .getSeriesLesson(id, number)
      .then((fresh) => {
        if (current) setData(fresh);
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [needsWriting, writeStatus, id, number, setData]);

  if (error) return <SeriesProblem notFound={error.kind === "notFound"} what="lesson" onRetry={reload} />;
  if (!lesson) return <SeriesLoading label="Loading the lesson" />;

  const paragraphs = lesson.paragraphs ?? (text ? splitSections(text, { streaming: true }) : []);
  const writing = needsWriting && writeStatus !== "done" && writeStatus !== "failed";
  const writeFailed = needsWriting && writeStatus === "failed";
  const last = number === LESSONS_PER_SERIES;
  const allDone = lesson.unfinished.length === 0;
  const seriesHref = `/series/${id}`;
  const nextNumber = number + 1;
  const leave = { leaveHref: seriesHref, leaveLabel: "Back to series", leaveIcon: "back" as const };

  const answer = (choice: number) => {
    setSaveFailed(false);
    almanac
      .answerSeriesCheck(id, number, choice)
      .then(setData)
      .catch(() => setSaveFailed(true));
  };

  // A wrong answer is shown with the right one, then the check comes back in new words.
  const retry = () => {
    setRetrying(true);
    setRetryFailed(false);
    almanac
      .retrySeriesCheck(id, number)
      .then((fresh) => {
        setData(fresh);
        checkHeading.current?.focus();
      })
      .catch(() => setRetryFailed(true))
      .finally(() => setRetrying(false));
  };

  // The next step: the next lesson, the Mastery Check, or the lessons still unfinished.
  const firstUnfinished = lesson.unfinished[0];
  const onward = !last ? (
    <Button icon href={`${seriesHref}/${nextNumber}`}>
      Continue to lesson {nextNumber}
    </Button>
  ) : !allDone ? (
    <Button icon href={`${seriesHref}/${firstUnfinished}`}>
      Answer the lesson {firstUnfinished} check
    </Button>
  ) : series?.isSample ? (
    <Button icon href="/series/new">
      Make your own series
    </Button>
  ) : (
    <Button icon href={`${seriesHref}/mastery`}>
      Take the Mastery Check
    </Button>
  );
  const onwardNote = !last
    ? lesson.nextReady
      ? `Lesson ${nextNumber} is ready.`
      : undefined
    : !allDone
      ? `That was the last lesson. Still unfinished: ${lessonList(lesson.unfinished)}.`
      : "That was the last lesson.";

  const footer = {
    missed: (
      <Button icon busy={retrying} onClick={retry}>
        {retrying ? "Writing a new question" : "Try the question again"}
      </Button>
    ),
    unanswered: <Button disabled>Answer the check to continue</Button>,
    passed: onward,
  }[lesson.checkState];
  const footerNote = lesson.checkState === "missed" ? "Get the check right to move on. It comes back in new words." : onwardNote;

  return (
    <SessionPage
      {...leave}
      footer={writing || writeFailed ? undefined : footer}
      footerNote={writing ? "The tutor and the check appear when the lesson is written." : writeFailed ? undefined : footerNote}
      footerQuiet={
        writing || writeFailed ? undefined : (
          <Button variant="quiet" href={seriesHref}>
            or back to the series
          </Button>
        )
      }
    >
      <article>
        <header>
          <p className="t-eyebrow m-0">
            Lesson {number} of {LESSONS_PER_SERIES} · {shortTitle(lesson.seriesTitle)}
          </p>
          <h1 className="t-lead-h1-sm after-eyebrow m-0 [overflow-wrap:anywhere]">{lesson.title}</h1>
        </header>

        {writing && (
          <p className="m-0 mt-7 flex items-center gap-3 text-[17px] italic text-(--ink-muted) md:text-[18px]">
            <span aria-hidden="true" className="relative block h-[3px] w-10 bg-(--rule)">
              <span className="absolute inset-y-0 left-0 w-1/2 bg-(--accent)" />
            </span>
            Writing this lesson for you. The first time is the only wait.
          </p>
        )}

        {writeFailed ? (
          <Notice
            className="mt-8"
            tone="error"
            kicker="Didn’t finish writing"
            title={`Lesson ${number} didn’t finish writing.`}
            body="The rest of your series is fine. Try again, or open another lesson and come back to this one."
            primary={{ label: "Try again", onClick: () => startWriting(almanac.streamSeriesLesson(id, number)) }}
            secondary={{ label: "or back to the series", href: seriesHref }}
          />
        ) : (
          // Series lessons have no drop cap.
          <LessonBody streaming={writing} paragraphs={paragraphs} className="mt-7 md:mt-9" />
        )}
        {/* Announced once when the text is complete, never word by word. */}
        <p role="status" className="sr-only">
          {writeStatus === "done" ? "The lesson is ready." : ""}
        </p>
      </article>

      {/* The tutor and the check stay hidden until the text is done. */}
      {!writing && !writeFailed && (
        <>
          <AskBox
            lessonId={`${id}/${number}`}
            hint={lesson.askHint}
            onAsk={(question) => almanac.askTutor({ kind: "series", seriesId: id, number }, question)}
            onExplainDifferently={() => almanac.askTutor({ kind: "series", seriesId: id, number }, null)}
            className="mt-12 md:mt-16"
          />
          <section aria-labelledby="lesson-check" className="mt-14 border-0 border-t border-solid border-(--ink) pt-6 md:mt-16 md:pt-8">
            <p className="m-0 font-label text-[12px] uppercase tracking-[0.1em] text-(--ink-muted)">Check</p>
            <h2
              id="lesson-check"
              ref={checkHeading}
              tabIndex={-1}
              className="after-eyebrow m-0 text-[26px] font-medium leading-[1.15] tracking-[-0.015em] md:text-[36px]"
            >
              <Markdown mode="inline">{lesson.check.prompt}</Markdown>
            </h2>
            <Question
              // A new question starts clean.
              key={lesson.check.prompt}
              className="mt-7"
              label={lesson.check.prompt}
              options={lesson.check.options}
              value={lesson.checkPick}
              onChange={(choice) => {
                if (typeof choice === "number") answer(choice);
              }}
              mode="instant"
              correctIndex={lesson.check.correctIndex}
              explanation={lesson.check.explanation}
            />
            {saveFailed && (
              <p role="alert" className="m-0 mt-5 text-[17px] text-(--incorrect)">
                That answer didn’t save. Pick it again.
              </p>
            )}
            {retryFailed && (
              <p role="alert" className="m-0 mt-5 text-[17px] text-(--incorrect)">
                The new question didn’t arrive. Try again.
              </p>
            )}
          </section>
        </>
      )}
    </SessionPage>
  );
}
