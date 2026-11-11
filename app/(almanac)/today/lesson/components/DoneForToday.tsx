"use client";

import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import type { DailySession } from "@/lib/almanac";
import { deeperHref } from "./copy";

/** What a guest sees for the rest of the day once the lesson is finished. */
export function DoneForToday({ session }: { session: DailySession }) {
  const { lesson, streak } = session;
  const series = session.continueSeries?.nextLesson ? session.continueSeries : null;

  return (
    <PaperPage current="today">
      <section className="mt-(--lead-top) max-w-[780px]">
        <LeadBlock
          eyebrow={`✓ Done · Today in ${lesson.subject}`}
          title="Done for today."
          line={`Tomorrow’s lesson is ${session.tomorrowSubject}, at midnight.`}
          primary={
            series?.nextLesson ? (
              <Button icon href={`/series/${series.id}/${series.nextLesson.number}`}>
                Continue your series
              </Button>
            ) : (
              <Button icon href={deeperHref(lesson.deeperTopic)}>
                Go deeper on {lesson.deeperTopic}
              </Button>
            )
          }
          quiet={
            <Button variant="quiet" href="/today/lesson?read=1">
              or read today’s lesson again
            </Button>
          }
        />
        <div className="mt-14 flex max-w-[360px] items-end gap-3 border-0 border-t border-solid border-(--rule) pt-[18px]">
          <span className="text-[56px] font-medium leading-[0.8] tracking-[-0.04em]">{streak.count}</span>
          <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)">
            {streak.count === 1 ? "day in a row" : "days in a row"}
          </span>
        </div>
      </section>
    </PaperPage>
  );
}
