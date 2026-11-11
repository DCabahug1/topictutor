"use client";

import Link from "next/link";
import { useEffect, useState, type Ref } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { ArrowIcon } from "@/components/almanac/icons";
import { useSession } from "@/components/almanac/SessionProvider";
import { weekLabel } from "@/components/almanac/StreakMark";
import { almanac, prefersReducedMotion, useAlmanac, type DailySession } from "@/lib/almanac";
import { deeperHref, spellOut } from "./copy";

type NextStep = { kicker: string; title: string; note: string; action: string; href: string; accent?: boolean };

/** The subject picker is offered once, after the first lesson. */
function useSubjectsPrompted(): boolean | null {
  const { data } = useAlmanac(() => almanac.getGuestState(), []);
  return data ? data.subjectsPrompted : null;
}

function nextSteps(session: DailySession, signedIn: boolean, prompted: boolean | null): NextStep[] {
  const steps: NextStep[] = [];
  const series = session.continueSeries;
  if (series?.nextLesson) {
    steps.push({
      kicker: `Continue · Lesson ${series.nextLesson.number} of 5`,
      title: series.nextLesson.title,
      note: `${series.title} · ${series.percent}%`,
      action: "Open lesson",
      href: `/series/${series.id}/${series.nextLesson.number}`,
      accent: true,
    });
  }
  steps.push({
    kicker: "Go deeper",
    title: `A five-lesson series on ${session.lesson.deeperTopic}`,
    note: "Starts with a five-question test, then focuses on what you miss.",
    action: "Take the test",
    href: deeperHref(session.lesson.deeperTopic),
    accent: !series?.nextLesson,
  });
  if (prompted === false) {
    steps.push({
      kicker: "Your subjects",
      title: "Pick what tomorrow is about",
      note: "Your daily lesson rotates through the subjects you pick.",
      action: "Pick your subjects",
      href: "/welcome/subjects",
    });
  }
  steps.push({
    kicker: "Stop for today",
    title: `Tomorrow’s lesson is in ${session.tomorrowSubject}`,
    note: "It arrives at midnight, your time.",
    action: signedIn ? "Back to Today" : "Stop for today",
    // A guest sees the account offer first.
    href: signedIn ? "/today" : "/welcome/account",
  });
  return steps;
}

/** The one moment of celebration: the streak number changes and the double rule draws across. */
export function Finish({ session, headingRef }: { session: DailySession; headingRef?: Ref<HTMLHeadingElement> }) {
  const user = useSession();
  const prompted = useSubjectsPrompted();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setFlipped(true), prefersReducedMotion() ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, []);

  const { lesson, streak, recall } = session;
  const to = Math.max(streak.count, 1);
  const from = to - 1;
  const correct = lesson.check.filter((q, i) => session.checkAnswers[i] === q.correctIndex).length;
  const head = to === 1 ? "That’s day one!" : `${spellOut(to)} days running.`;
  const recallLine = !recall
    ? "Come back tomorrow and the streak keeps going."
    : session.recallAnswer === recall.question.correctIndex
      ? `Recall says you still remember ${recall.fromDay}’s lesson, too.`
      : `Recall slipped on ${recall.fromDay}’s lesson, so it will come round again.`;
  const steps = nextSteps(session, Boolean(user), prompted);

  const slide = "absolute bottom-0 left-0 transition-[transform,opacity] duration-(--duration-moment) ease-(--ease-enter)";
  const rule = "origin-left bg-(--ink) transition-transform duration-(--duration-moment) ease-(--ease-enter)";

  return (
    <div className="mx-auto max-w-[1120px] pt-8 md:pt-16">
      <div className="flex flex-wrap items-end gap-x-20 gap-y-[22px] md:gap-y-12">
        <div className="min-w-0 flex-[1_1_360px]">
          <p className="t-label m-0 font-normal! text-(--ink-muted)">
            Lesson finished · {lesson.subject}
            <span className="hidden md:inline"> · {lesson.title}</span>
          </p>
          <div aria-live="polite" className="mt-[18px] flex items-end gap-[14px] md:mt-5 md:gap-[18px]">
            <div className="relative h-[1em] min-w-[1.1em] overflow-hidden text-[128px] font-medium leading-none tracking-[-0.04em] md:text-[176px] md:tracking-[-0.05em]">
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
              <span className={cx(slide, "text-(--accent)", flipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
                {to}
              </span>
            </div>
            <p className="m-0 mb-[14px] font-mono text-[13px] uppercase tracking-[0.06em] text-(--ink-muted)">
              {to === 1 ? "day in a row" : "days in a row"}
            </p>
          </div>
          <div
            role="img"
            aria-label={weekLabel(streak.week)}
            className="mt-[22px] hidden grid-cols-[repeat(7,36px)] gap-[6px] text-center font-mono text-[11px] text-(--ink-muted) md:grid"
          >
            {streak.week.map((day) => (
              <div key={day.date} className={cx(day.isToday && "font-medium text-(--ink)")}>
                <div
                  className={cx(
                    "mx-auto mb-[6px] box-border h-[14px] w-[14px] rounded-(--radius-full) border-[1.5px] border-solid",
                    day.isToday
                      ? "border-(--accent) bg-(--accent)"
                      : day.done
                        ? "border-(--ink) bg-(--ink)"
                        : "border-(--ink-muted)"
                  )}
                />
                {day.letter}
              </div>
            ))}
          </div>
        </div>

        <div className="order-3 min-w-0 flex-[1_1_420px] md:order-none">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="m-0 text-[36px] font-medium leading-[1.05] tracking-[-0.02em] outline-none md:text-[clamp(40px,4.4vw,60px)] md:leading-none md:tracking-[-0.025em]"
          >
            {head}
          </h1>
          <p className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft) md:mt-4 md:text-[20px]">
            You got {correct} of {lesson.check.length} on the check. {recallLine}
          </p>
        </div>

        {/* The double rule draws across, left to right. On phones it sits under the number. */}
        <div aria-hidden="true" className="order-2 -mt-3 w-full md:order-none md:mt-0">
          <div className={cx(rule, "h-[3px]", flipped ? "scale-x-100" : "scale-x-0")} />
          <div className={cx(rule, "mt-[3px] h-px", flipped ? "scale-x-100" : "scale-x-0")} />
        </div>
      </div>

      <ul className="m-0 mt-[26px] grid list-none grid-cols-1 border-0 border-t border-solid border-(--rule) p-0 md:mt-0 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:border-t-0">
        {steps.map((step, i) => (
          <li
            key={step.href}
            className={cx(
              "border-0 border-b border-solid border-(--rule) md:border-b-0",
              i < steps.length - 1 && "md:border-r",
              // On phones the pinned footer already offers these two.
              (step.kicker === "Stop for today" || step.kicker === "Your subjects") && "hidden md:block"
            )}
          >
            <Link
              href={step.href}
              className={cx(
                "group grid grid-cols-[minmax(0,1fr)_20px] items-center gap-3 py-4 text-(--ink) no-underline md:flex md:min-h-[200px] md:flex-col md:items-stretch md:gap-2 md:py-7",
                i === 0 ? "md:pr-7" : "md:px-7"
              )}
            >
              <span className="flex flex-col md:contents">
                <span className={cx("t-label font-normal! max-md:text-[11px]", step.accent ? "text-(--accent)" : "text-(--ink-muted)")}>
                  {step.kicker}
                </span>
                <span className="mt-1 text-[19px] leading-[1.25] md:mt-0 md:text-[26px] md:font-medium md:leading-[1.15]">
                  {step.title}
                </span>
                <span className="mt-[2px] text-[15px] italic text-(--ink-muted) md:mt-0 md:text-[16px]">{step.note}</span>
              </span>
              <span className="inline-flex items-center gap-[10px] font-mono text-[14px] font-medium group-hover:text-(--accent) md:mt-auto md:pt-4">
                <span className="hidden md:inline">{step.action}</span>
                <ArrowIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The pinned footer on phones. From 768px the cards above carry the same choices. */
export function FinishActions({ session }: { session: DailySession }) {
  const user = useSession();
  const prompted = useSubjectsPrompted();
  const stopHref = user ? "/today" : "/welcome/account";

  if (prompted === false) {
    return (
      <>
        <Button size="large" icon href="/welcome/subjects">
          Pick your subjects
        </Button>
        <Button variant="quiet" size="compact" href={stopHref} className="text-[14px]!">
          Stop for today
        </Button>
      </>
    );
  }
  return (
    <>
      <Button size="large" href={stopHref}>
        Done for today
      </Button>
      <p className="m-0 text-center font-mono text-[12px] text-(--ink-muted)">
        Tomorrow: {session.tomorrowSubject}
      </p>
    </>
  );
}
