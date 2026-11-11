"use client";

import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import type { DailySession } from "@/lib/almanac";
import { DEEPER_ACTION, OWN_TOPIC_ACTION, OWN_TOPIC_HREF, deeperHref } from "./copy";
import { DeeperSuggestion } from "./DeeperSuggestion";

/** What a guest sees for the rest of the day once the lesson is finished. */
export function DoneForToday({ session }: { session: DailySession }) {
  const { lesson, streak } = session;
  const series = session.continueSeries?.nextLesson ? session.continueSeries : null;

  return (
    <PaperPage current="today">
      <section className="mt-(--lead-top) max-w-[780px]">
        <LeadBlock
          eyebrow={`✓ Done · Today in ${lesson.subjectName}`}
          title="Done for today."
          line={`Tomorrow’s lesson is ${session.tomorrowSubject}, at midnight.`}
          primary={
            series?.nextLesson ? (
              <Button icon href={`/series/${series.id}/${series.nextLesson.number}`}>
                Continue your series
              </Button>
            ) : (
              <Button icon href={deeperHref(lesson.deeperTopic)}>
                {DEEPER_ACTION}
              </Button>
            )
          }
          secondary={
            !series?.nextLesson && (
              <Button variant="outline" href={OWN_TOPIC_HREF}>
                {OWN_TOPIC_ACTION}
              </Button>
            )
          }
          quiet={
            <Button variant="quiet" href="/today/lesson?read=1">
              or read today’s lesson again
            </Button>
          }
        >
          {/* With no series to continue, the related topic is named here and the button just starts it. */}
          {!series?.nextLesson && <DeeperSuggestion topic={lesson.deeperTopic} />}
        </LeadBlock>
        {/* "day streak" sits on the numeral's baseline, as on the finish. */}
        <div className="mt-14 flex max-w-[360px] items-baseline gap-3 border-0 border-t border-solid border-(--rule) pt-[18px]">
          <span className="text-[56px] font-medium leading-none tracking-[-0.04em]">{streak.count}</span>
          <span className="font-serif text-[20px] leading-none text-(--ink-muted)">
            day streak
          </span>
        </div>
      </section>
    </PaperPage>
  );
}
