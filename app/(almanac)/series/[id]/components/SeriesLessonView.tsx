"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { AskBox } from "@/components/almanac/AskBox";
import { Button, Caret } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { ArrowIcon, BackIcon } from "@/components/almanac/icons";
import { LessonBody } from "@/components/almanac/LessonBody";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { Question } from "@/components/almanac/Question";
import { StatusLabel } from "@/components/almanac/StatusLabel";
import { LESSONS_PER_SERIES, almanac, useAlmanac, useTextStream } from "@/lib/almanac";
import { lessonList, shortTitle } from "./copy";
import { BackLink, PhoneActions, SeriesLoading, SeriesProblem } from "./SeriesStates";

export function SeriesLessonView() {
  const params = useParams<{ id: string; n: string }>();
  const number = /^\d$/.test(params.n) ? Number(params.n) : 0;
  if (number < 1 || number > LESSONS_PER_SERIES) return <SeriesProblem notFound what="lesson" />;
  // Keyed, so moving to another lesson starts clean: no text, no answer, no conversation.
  return <SeriesLesson key={`${params.id}/${number}`} id={params.id} number={number} />;
}

function SeriesLesson({ id, number }: { id: string; number: number }) {
  const { data: lesson, error, reload, setData } = useAlmanac(() => almanac.getSeriesLesson(id, number), [id, number]);
  // Only for the next lesson's title and to know the sample series. The page works without it.
  const { data: series } = useAlmanac(() => almanac.getSeries(id), [id]);
  const { text, status: writeStatus, start: startWriting } = useTextStream();

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

  const paragraphs = lesson.paragraphs ?? (text ? text.split("\n\n") : []);
  const writing = needsWriting && writeStatus !== "done" && writeStatus !== "failed";
  const writeFailed = needsWriting && writeStatus === "failed";
  const done = lesson.checkAnswer !== null;
  const last = number === LESSONS_PER_SERIES;
  const allDone = lesson.unfinished.length === 0;
  const seriesHref = `/series/${id}`;
  const nextNumber = number + 1;
  const nextTitle = series?.lessons[number]?.title;

  // The last lesson leads to the Mastery Check, or says what is still unfinished.
  const closing = !last
    ? null
    : !allDone
      ? { label: "Back to the series", href: seriesHref, arrow: false, note: `Still unfinished: ${lessonList(lesson.unfinished)}.` }
      : series?.isSample
        ? { label: "Make your own series", href: "/series/new", arrow: true, note: "That was the last lesson." }
        : { label: "Take the Mastery Check", href: `${seriesHref}/mastery`, arrow: true, note: "That was the last lesson." };

  const writingButton = (
    <Button size="large" disabled busy>
      Writing the lesson
    </Button>
  );

  return (
    <PaperPage current="library" tabs={false}>
      <div className="mx-auto max-w-[680px] pb-28 md:pb-0">
        <BackLink href={seriesHref}>
          <span className="md:hidden">Series</span>
          <span className="hidden md:inline">{shortTitle(lesson.seriesTitle)}</span>
        </BackLink>

        <article>
          <header className="pt-2 md:pt-7">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="t-label text-(--accent)">
                Lesson {number} of {LESSONS_PER_SERIES}
              </span>
              <StatusLabel status={done ? "done" : "notStarted"} label={done ? "Done" : "Not done yet"} />
            </div>
            <h1 className="m-0 mt-3 text-[36px] font-medium leading-[1.04] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(40px,4.6vw,58px)] md:leading-[1.02] md:tracking-[-0.025em]">
              {lesson.title}
            </h1>
            <p className="m-0 mt-2 text-[17px] italic leading-[1.45] text-(--ink-soft) md:mt-3 md:text-[20px]">
              {lesson.description}
            </p>
          </header>

          {writing && (
            <p className="t-note m-0 mt-3 flex items-center gap-2 text-(--ink-muted) md:mt-[18px] md:text-[16px]">
              <Caret className="h-[15px] md:h-4" />
              <span>
                Writing this lesson for you now.
                <span className="hidden md:inline"> The first time is the only wait.</span>
              </span>
            </p>
          )}

          {writeFailed ? (
            <Notice
              className="mt-6"
              tone="error"
              kicker="Didn’t finish writing"
              title={`Lesson ${number} didn’t finish writing.`}
              body="The rest of your series is fine. Try again, or open another lesson and come back to this one."
              primary={{ label: "Try again", onClick: () => startWriting(almanac.streamSeriesLesson(id, number)) }}
              secondary={{ label: "Back to the series", href: seriesHref }}
            />
          ) : (
            // Series lessons have no drop cap.
            <LessonBody streaming={writing} paragraphs={paragraphs} className="mt-[22px] md:mt-[30px]" />
          )}
          {/* Announced once when the text is complete, never word by word. */}
          <p role="status" className="sr-only">
            {writeStatus === "done" ? "The lesson is ready." : ""}
          </p>
        </article>

        {writing && (
          <div
            aria-hidden="true"
            className="mt-11 hidden border-0 border-t border-solid border-(--rule) pt-[18px] md:block"
          >
            <p className="t-label m-0 font-normal! text-(--ink-muted)">
              Ask the tutor and the check appear when the lesson is written
            </p>
            <span className="mt-3 block h-12 bg-(--paper-raised)" />
          </div>
        )}

        {/* The ask box and the check stay hidden until the text is done. */}
        {!writing && !writeFailed && (
          <>
            <AskBox
              lessonId={`${id}/${number}`}
              hint={lesson.askHint}
              onAsk={(question) => almanac.askTutor({ kind: "series", seriesId: id, number }, question)}
              onExplainDifferently={() => almanac.askTutor({ kind: "series", seriesId: id, number }, null)}
              className="mt-7 border-0 border-t border-solid border-(--rule) pt-4 md:mt-11 md:pt-[18px]"
            />
            <section className="mt-7 border-0 border-t-[3px] border-solid border-(--ink) pt-4 md:mt-11 md:pt-[18px]">
              <p className="t-label m-0 font-normal! text-(--accent)">Check</p>
              <h2 className="m-0 mt-2 text-[22px] font-medium leading-[1.25] md:mt-[10px] md:text-[28px] md:leading-[1.2]">
                {lesson.check.prompt}
              </h2>
              <Question
                className="mt-4 md:mt-6"
                label={lesson.check.prompt}
                options={lesson.check.options}
                value={lesson.checkAnswer}
                onChange={(answer) => {
                  if (typeof answer === "number") {
                    almanac
                      .answerSeriesCheck(id, number, answer)
                      .then(setData)
                      .catch(() => {});
                  }
                }}
                mode="instant"
                correctIndex={lesson.check.correctIndex}
                explanation={lesson.check.explanation}
              />
            </section>
          </>
        )}

        {!writeFailed && (
          <nav
            aria-label="Lessons in this series"
            className={cx(
              "mt-7 items-center justify-between gap-x-4 gap-y-3 border-0 border-t border-solid border-(--rule) pb-7 pt-[14px] md:mt-11 md:flex md:flex-wrap md:border-t-[3px] md:border-(--ink) md:pb-0 md:pt-[18px]",
              // On phones the lesson links wait for the text, like the ask box and the check.
              writing ? "hidden" : "flex"
            )}
          >
            {number > 1 ? (
              <Link
                href={`${seriesHref}/${number - 1}`}
                className="inline-flex min-h-11 items-center gap-[6px] font-mono text-[13px] text-(--ink) no-underline hover:text-(--accent) md:min-h-12 md:gap-2 md:text-[14px]"
              >
                <BackIcon size={15} />
                Lesson {number - 1}
              </Link>
            ) : (
              <span />
            )}
            {closing && !writing && (
              <p className="t-note m-0 max-w-[220px] text-right text-(--ink-muted) md:max-w-none md:flex-auto">
                {closing.note}
              </p>
            )}
            {/* On phones the next step is pinned to the bottom of the screen. */}
            <div className="hidden md:block">
              {writing ? (
                writingButton
              ) : closing ? (
                <Button variant={allDone ? "primary" : "secondary"} icon={closing.arrow} href={closing.href}>
                  {closing.label}
                </Button>
              ) : (
                <Link
                  href={`${seriesHref}/${nextNumber}`}
                  className="inline-flex min-h-[52px] items-center gap-3 border-[1.5px] border-solid border-(--ink) px-[22px] py-2 font-mono text-[14px] text-(--ink) no-underline hover:bg-(--paper-sunk)"
                >
                  <span>
                    {lesson.nextReady && (
                      <span className="block text-[11px] uppercase tracking-[0.06em] text-(--ink-muted)">Ready</span>
                    )}
                    Lesson {nextNumber}
                    {nextTitle && ` · ${nextTitle}`}
                  </span>
                  <ArrowIcon size={16} className="flex-none" />
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>

      {!writeFailed && (
        <PhoneActions note={!writing && !closing && lesson.nextReady ? `Lesson ${nextNumber} is ready.` : undefined}>
          {writing ? (
            writingButton
          ) : closing ? (
            <Button size="large" icon={closing.arrow} href={closing.href}>
              {closing.label}
            </Button>
          ) : (
            <Button size="large" icon href={`${seriesHref}/${nextNumber}`}>
              Next · Lesson {nextNumber}
            </Button>
          )}
        </PhoneActions>
      )}
    </PaperPage>
  );
}
