"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
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

/** Daily lessons so far, each one readable again. */
export function PastDailyList({ lessons, today }: PastDailyListProps) {
  const [showAll, setShowAll] = useState(false);
  const firstOlder = useRef<HTMLAnchorElement>(null);
  const shown = showAll ? lessons : lessons.slice(0, FIRST);

  // The button is gone once the older lessons show, so focus moves to the first of them.
  useEffect(() => {
    if (showAll) firstOlder.current?.focus();
  }, [showAll]);

  return (
    <section
      aria-labelledby="daily-heading"
      className="min-w-0 flex-[1_1_340px] border-0 border-t-[3px] border-solid border-(--ink)"
    >
      <div className="flex items-baseline justify-between gap-3 pt-[14px]">
        <h2 id="daily-heading" className="t-label m-0">
          Past daily lessons
        </h2>
        {lessons.length > 0 && (
          <span className="font-mono text-[12px] text-(--ink-muted)">{lessons.length} so far</span>
        )}
      </div>

      {lessons.length === 0 ? (
        <p className="m-0 mt-[18px] text-[17px] leading-normal text-(--ink-soft)">
          Each day’s lesson lands here after the day is over, so you can come back to any of them.
        </p>
      ) : (
        <>
          <ul className="m-0 mt-[10px] list-none p-0">
            {shown.map((lesson, i) => {
              const href =
                lesson.date === today
                  ? lesson.done
                    ? "/today/lesson?read=1"
                    : "/today/lesson"
                  : `/library/daily/${encodeURIComponent(lesson.id)}`;
              return (
                <li key={lesson.id} className="border-0 border-t border-solid border-(--rule)">
                  <Link
                    ref={i === FIRST ? firstOlder : undefined}
                    href={href}
                    className="group grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-[14px] text-(--ink) no-underline"
                  >
                    <time
                      dateTime={lesson.date}
                      title={fullDate(lesson.date)}
                      className="font-mono text-[12px] leading-normal text-(--ink-muted)"
                    >
                      {shortDate(lesson.date)}
                    </time>
                    <span className="min-w-0">
                      <span
                        className={cx(
                          "block font-mono text-[11px] uppercase tracking-[0.08em]",
                          lesson.done ? "text-(--ink-muted)" : "text-(--accent)"
                        )}
                      >
                        {lesson.subject} · {lesson.done ? "Done" : "Not read"}
                      </span>
                      <span className="mt-[3px] block text-[18px] leading-[1.25] decoration-1 underline-offset-4 group-hover:underline">
                        {lesson.title}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {lessons.length > FIRST && !showAll && (
            <Button variant="secondary" size="compact" className="mt-[10px] px-[14px]!" onClick={() => setShowAll(true)}>
              Show older lessons
            </Button>
          )}
        </>
      )}
    </section>
  );
}
