"use client";

import { useEffect, useState, type Ref } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { LeadActions } from "@/components/almanac/LeadBlock";
import { useSession } from "@/components/almanac/SessionProvider";
import { FourWeekGrid } from "@/components/almanac/StreakMark";
import { almanac, prefersReducedMotion, runLength, useAlmanac, type DailySession } from "@/lib/almanac";
import { DEEPER_ACTION, OWN_TOPIC_ACTION, OWN_TOPIC_HREF, deeperHref } from "./copy";
import { DeeperSuggestion } from "./DeeperSuggestion";

/** The subject picker is offered once, after the first lesson. */
function useSubjectsPrompted(): boolean | null {
  const { data } = useAlmanac(() => almanac.getGuestState(), []);
  return data ? data.subjectsPrompted : null;
}

/**
 * "You got the check right." The lesson finishes only once the check is right, so
 * this is nearly always all of it; days finished before that rule may show misses.
 */
function checkLine(correct: number, total: number): string {
  if (correct === total) return total === 1 ? "You got the check right." : `You got all ${total} on the check.`;
  if (correct === 0) return "You missed the check, and it still counts.";
  return `You got ${correct} of ${total} on the check.`;
}

/**
 * The headline under the streak numeral. It never repeats the number, which is right above it:
 * short runs say a day was added, longer ones say how long it feels, the same way Stats does.
 */
function finishHeadline(count: number): string {
  if (count <= 1) return "Your first day is done!";
  const long = runLength(count);
  return long ? `${long}!` : "Another day done!";
}

/**
 * The one moment of celebration: the streak numeral flips in accent, with the
 * product's one exclamation mark, then one button for what comes next.
 */
export function Finish({ session, headingRef }: { session: DailySession; headingRef?: Ref<HTMLHeadingElement> }) {
  const user = useSession();
  const prompted = useSubjectsPrompted();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlipped(true), prefersReducedMotion() ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, []);

  const { lesson, streak } = session;
  const to = Math.max(streak.count, 1);
  const from = to - 1;
  const correct = lesson.check.filter((q, i) => session.checkAnswers[i] === q.correctIndex).length;
  const series = session.continueSeries?.nextLesson ? session.continueSeries : null;
  const pickSubjects = !user && prompted === false;
  const stopHref = user ? "/today" : "/welcome/account";
  const deeper = deeperHref(lesson.deeperTopic);

  const head = finishHeadline(to);
  const next = series?.nextLesson
    ? `Up next in your series is lesson ${series.nextLesson.number}: ${series.nextLesson.title}.`
    : pickSubjects
      ? "One more step and tomorrow’s lesson is set."
      : `Tomorrow’s lesson is ${session.tomorrowSubject}.`;

  const primary = series?.nextLesson ? (
    <Button icon href={`/series/${series.id}/${series.nextLesson.number}`}>
      Continue your series
    </Button>
  ) : pickSubjects ? (
    <Button icon href="/welcome/subjects">
      Pick tomorrow’s subjects
    </Button>
  ) : (
    <Button icon href={deeper}>
      {DEEPER_ACTION}
    </Button>
  );
  // Going deeper is the primary unless there is a series to continue or subjects to pick.
  // Then it is a real second path: its own block under the actions, with an outline button.
  const deeperIsSecond = Boolean(series || pickSubjects);

  const quiet = (
    <Button variant="quiet" href={stopHref}>
      or stop for today
    </Button>
  );

  const slide = "absolute bottom-0 left-0 transition-[transform,opacity] duration-(--duration-moment) ease-(--ease-enter)";

  return (
    <div className="md:flex md:items-center md:justify-between md:gap-12 lg:gap-20">
      <div className="min-w-0">
        <p className="t-eyebrow m-0">Lesson finished · {lesson.subjectName}</p>
        <div className="mt-(--eyebrow-gap) flex items-baseline gap-4 md:gap-5">
          <div className="relative h-[1em] w-fit shrink-0 overflow-hidden text-[120px] font-medium leading-none tracking-[-0.05em] md:text-[160px]">
            {/* Reserves the width of the wider number, so "0" fits when it flips to a narrow "1". */}
            <span aria-hidden="true" className="invisible grid">
              <span className="col-start-1 row-start-1">{from}</span>
              <span className="col-start-1 row-start-1">{to}</span>
            </span>
            <span
              aria-hidden="true"
              className={cx(slide, "text-(--ink-muted)", flipped ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100")}
            >
              {from}
            </span>
            <span
              aria-hidden="true"
              className={cx(slide, "text-(--accent)", flipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}
            >
              {to}
            </span>
          </div>
          <p aria-hidden="true" className="m-0 font-serif text-[24px] leading-none text-(--ink-muted) md:text-[28px]">
            day streak
          </p>
        </div>
        <p role="status" className="sr-only">
          {flipped ? `${to} ${to === 1 ? "day" : "days"} in a row.` : ""}
        </p>

        <h1 ref={headingRef} tabIndex={-1} className="t-lead-h1-sm m-0 mt-6">
          {head}
        </h1>
        <p className="t-lead m-0 mt-5 max-w-[560px]">
          {checkLine(correct, lesson.check.length)} {next}
        </p>
        {!deeperIsSecond && <DeeperSuggestion topic={lesson.deeperTopic} className="mt-9" />}
        <LeadActions
          primary={primary}
          secondary={
            !deeperIsSecond && (
              <Button variant="outline" href={OWN_TOPIC_HREF}>
                {OWN_TOPIC_ACTION}
              </Button>
            )
          }
          quiet={quiet}
        />
        {deeperIsSecond && (
          <DeeperSuggestion
            topic={lesson.deeperTopic}
            className="mt-12"
            action={
              <Button variant="outline" icon href={deeper}>
                {DEEPER_ACTION}
              </Button>
            }
          />
        )}
      </div>
      {/* Today's square fills in accent as the number flips. Phones keep just the number. */}
      <FourWeekGrid
        days={streak.month}
        count={flipped ? to : from}
        todayDone={flipped}
        className="hidden shrink-0 [--cell:28px] [--gap:6px] [--meta:12px] md:block lg:[--cell:44px] lg:[--gap:8px] lg:[--meta:13px]"
      />
    </div>
  );
}
