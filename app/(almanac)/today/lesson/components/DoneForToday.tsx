"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/almanac/icons";
import { PaperPage } from "@/components/almanac/Page";
import { StatusLabel } from "@/components/almanac/StatusLabel";
import type { DailySession } from "@/lib/almanac";
import { deeperHref, lessonDate } from "./copy";

/** What a guest sees for the rest of the day once the lesson is finished. */
export function DoneForToday({ session }: { session: DailySession }) {
  const { lesson, streak } = session;
  return (
    <PaperPage current="today">
      <section className="max-w-[680px] pb-7 pt-[26px] md:pt-12">
        <p className="t-label m-0 font-normal! text-(--ink-muted)">{lessonDate(lesson.date)}</p>
        <h1 className="m-0 mt-[10px] text-[38px] font-medium leading-[1.04] tracking-[-0.02em] md:text-[64px] md:leading-none md:tracking-[-0.025em]">
          You’re done for today.
        </h1>

        <div className="mt-[22px] border border-solid border-(--rule) bg-(--paper-raised) px-5 py-[18px] md:mt-9 md:px-8 md:py-[30px]">
          <StatusLabel status="done" label={`Done · ${lesson.subject}`} />
          <p className="m-0 mt-2 text-[24px] font-medium leading-[1.15] md:text-[36px] md:tracking-[-0.015em]">{lesson.title}</p>
          <Link
            href="/today/lesson?read=1"
            className="mt-2 inline-block py-[6px] font-mono text-[13px] text-(--ink) underline-offset-4"
          >
            Read it again
          </Link>
        </div>

        <div className="mt-[26px] flex items-end justify-between gap-4 border-0 border-b border-solid border-(--rule) pb-[18px]">
          <div>
            <p className="t-label m-0 font-normal! text-(--ink-muted)">Streak</p>
            <p className="m-0 mt-1 text-[56px] font-medium leading-none tracking-[-0.03em] text-(--accent)">
              {streak.count}
              <span className="sr-only">{streak.count === 1 ? " day in a row" : " days in a row"}</span>
            </p>
          </div>
          <p className="m-0 mb-[6px] max-w-[220px] text-right text-[16px] italic leading-[1.4] text-(--ink-soft)">
            Tomorrow’s lesson is in <strong className="font-semibold not-italic text-(--ink)">{session.tomorrowSubject}</strong>.
            It arrives at midnight.
          </p>
        </div>

        <Link
          href={deeperHref(lesson.deeperTopic)}
          className="group grid grid-cols-[minmax(0,1fr)_20px] items-center gap-3 border-0 border-b border-solid border-(--rule) py-4 text-(--ink) no-underline"
        >
          <span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-(--accent)">Still curious?</span>
            <span className="mt-1 block text-[19px]">Go deeper on {lesson.deeperTopic}</span>
          </span>
          <ArrowIcon className="group-hover:text-(--accent)" />
        </Link>
      </section>
    </PaperPage>
  );
}
