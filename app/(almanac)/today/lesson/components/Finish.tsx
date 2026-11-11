"use client";

import { useEffect, useState, type Ref } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { LeadActions } from "@/components/almanac/LeadBlock";
import { useSession } from "@/components/almanac/SessionProvider";
import { WeekStrip } from "@/components/almanac/StreakMark";
import { almanac, prefersReducedMotion, useAlmanac, type DailySession } from "@/lib/almanac";
import { deeperHref, spellOut } from "./copy";

/** The subject picker is offered once, after the first lesson. */
function useSubjectsPrompted(): boolean | null {
  const { data } = useAlmanac(() => almanac.getGuestState(), []);
  return data ? data.subjectsPrompted : null;
}

/** "You got 1 of 2 on the check." Missing it still finishes the lesson. */
function checkLine(correct: number, total: number): string {
  if (correct === total) return total === 1 ? "You got the check right." : `You got all ${total} on the check.`;
  if (correct === 0) return "You missed the check, and it still counts.";
  return `You got ${correct} of ${total} on the check.`;
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

  const head = to === 1 ? "Your first day is done!" : `${spellOut(to)} days in a row!`;
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
      Go deeper on {lesson.deeperTopic}
    </Button>
  );

  const quiet = (
    <>
      {(series || pickSubjects) && (
        <Button variant="quiet" href={deeper}>
          or go deeper on {lesson.deeperTopic}
        </Button>
      )}
      <Button variant="quiet" href={stopHref}>
        or stop for today
      </Button>
    </>
  );

  const slide = "absolute bottom-0 left-0 transition-[transform,opacity] duration-(--duration-moment) ease-(--ease-enter)";

  return (
    <div>
      <p className="t-eyebrow m-0">Lesson finished · {lesson.subject}</p>
      <div className="mt-[18px] flex flex-wrap items-end gap-x-12 gap-y-4">
        <div className="relative h-[1em] min-w-[1.1em] overflow-hidden text-[120px] font-medium leading-none tracking-[-0.05em] md:text-[160px]">
          {/* Reserves the width of the widest number. */}
          <span aria-hidden="true" className="invisible">
            {to}
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
        <WeekStrip week={streak.week} className="mb-3 hidden md:grid" />
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
      <LeadActions primary={primary} quiet={quiet} />
    </div>
  );
}
