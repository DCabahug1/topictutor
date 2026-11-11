"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { Section } from "@/components/almanac/Section";
import { parseLocalDate, type PastDailyLesson } from "@/lib/almanac";

/** How many lessons show before "Show older lessons". */
const FIRST = 6;

/** "Tue 11.10" */
function shortDate(date: string): string {
  const day = parseLocalDate(date);
  const weekday = day.toLocaleDateString("en-US", { weekday: "short" });
  return `${weekday} ${String(day.getMonth() + 1).padStart(2, "0")}.${String(day.getDate()).padStart(2, "0")}`;
}

function fullDate(date: string): string {
  return parseLocalDate(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type PastDailyListProps = {
  /** Newest first. Today's lesson may lead the list. */
  lessons: PastDailyLesson[];
  /** The learner's local date (YYYY-MM-DD): today's lesson opens in the daily session. */
  today: string;
};

/** Daily lessons so far, in two columns of ruled rows, each one readable again. */
export function PastDailyList({ lessons, today }: PastDailyListProps) {
  const [showAll, setShowAll] = useState(false);
  const firstOlder = useRef<HTMLAnchorElement>(null);
  const shown = showAll ? lessons : lessons.slice(0, FIRST);

  // The button is gone once the older lessons show, so focus moves to the first of them.
  useEffect(() => {
    if (showAll) firstOlder.current?.focus();
  }, [showAll]);

  return (
    <Section
      id="daily"
      title="Past daily lessons"
      aside={
        lessons.length > 0 ? (
          <span className="font-label text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)">{lessons.length} so far</span>
        ) : undefined
      }
    >
      {lessons.length === 0 ? (
        <p className="m-0 pt-5 text-[18px] leading-normal text-(--ink-soft)">
          Each day’s lesson lands here, so you can come back to any of them.
        </p>
      ) : (
        <>
          <ul className="almanac-stagger [--stagger-base:120ms] [--stagger-step:50ms] m-0 grid list-none grid-cols-1 gap-x-10 p-0 md:grid-cols-2">
            {shown.map((lesson, i) => {
              const href =
                lesson.date === today
                  ? lesson.done
                    ? "/today/lesson?read=1"
                    : "/today/lesson"
                  : `/library/daily/${encodeURIComponent(lesson.id)}`;
              return (
                <li key={lesson.id} className="border-0 border-b border-solid border-(--rule)">
                  <Link
                    ref={i === FIRST ? firstOlder : undefined}
                    href={href}
                    className="group grid grid-cols-[84px_minmax(0,1fr)_auto] items-baseline gap-3 py-[18px] text-(--ink) no-underline"
                  >
                    <time
                      dateTime={lesson.date}
                      title={fullDate(lesson.date)}
                      className="font-label text-[12px] text-(--ink-muted)"
                    >
                      {shortDate(lesson.date)}
                    </time>
                    <span className="text-[18px] leading-[1.3] decoration-1 underline-offset-4 group-hover:underline">
                      {lesson.title}
                      <span className="sr-only"> · {lesson.subject}</span>
                    </span>
                    {!lesson.done && (
                      <span className="whitespace-nowrap font-label text-[11px] uppercase tracking-[0.06em] text-(--accent)">
                        ○ Not read
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          {lessons.length > FIRST && !showAll && (
            <div className="mt-3 flex justify-end">
              <Button variant="quiet" className="text-[16px]!" onClick={() => setShowAll(true)}>
                Show older lessons
              </Button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
