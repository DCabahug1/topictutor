"use client";

import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { LessonRow } from "@/components/almanac/LessonRow";
import { PaperPage } from "@/components/almanac/Page";
import { ProgressMeter } from "@/components/almanac/ProgressMeter";
import { Section } from "@/components/almanac/Section";
import type { Mastery, Series } from "@/lib/almanac";
import { shortTitle } from "./copy";
import { BackLink } from "./SeriesStates";

const TO_GO = ["", "One lesson", "Two lessons", "Three lessons", "Four lessons", "Five lessons"];

/** Not open yet: the one step that gets it open, then the lessons still to do. */
export function MasteryLocked({ mastery, series }: { mastery: Mastery; series: Series }) {
  const seriesHref = `/series/${series.id}`;
  const todo = series.lessons.filter((lesson) => mastery.unfinished.includes(lesson.number));
  const first = todo[0];

  // The sample's Mastery Check never opens.
  if (series.isSample) {
    return (
      <PaperPage current="library">
        <BackLink href={seriesHref}>{shortTitle(series.title)}</BackLink>
        <section className="mt-10 md:mt-16">
          <LeadBlock
            size="sm"
            eyebrow={<span className="text-(--ink-muted)">Mastery Check · sample series</span>}
            title="The Mastery Check comes with your own series."
            line="It opens once every lesson’s check is answered, and draws on all five lessons."
            className="max-w-[860px]"
            primary={
              <Button icon href="/series/new">
                Make your own series
              </Button>
            }
            quiet={
              <Button variant="quiet" href={seriesHref}>
                or back to the series
              </Button>
            }
          />
        </section>
      </PaperPage>
    );
  }

  return (
    <PaperPage current="library">
      <BackLink href={seriesHref}>{shortTitle(series.title)}</BackLink>
      <section className="mt-10 md:mt-16">
        <LeadBlock
          size="sm"
          eyebrow={<span className="text-(--ink-muted)">Mastery Check · not open yet</span>}
          title={`${TO_GO[todo.length] ?? `${todo.length} lessons`} to go first.`}
          line="The check opens once every lesson’s check is answered right. It draws on all five lessons."
          className="max-w-[860px]"
          primary={
            first && (
              <Button icon href={`${seriesHref}/${first.number}`}>
                {first.written ? `Answer the lesson ${first.number} check` : `Start lesson ${first.number}`}
              </Button>
            )
          }
        >
          <ProgressMeter lessonsDone={series.lessonsDone} />
        </LeadBlock>
      </section>

      <Section title="Still to do" className="mt-[72px]! md:mt-[120px]!">
        <ol className="m-0 list-none p-0">
          {todo.map((lesson, i) => (
            <LessonRow
              key={lesson.number}
              number={lesson.number}
              title={lesson.title}
              status={i === 0 ? "upNext" : "notStarted"}
              // "Written" also covers a lesson prepared ahead, so it can't be called read.
              sub={i === 0 && lesson.written ? "Written. The check isn’t answered yet." : undefined}
              href={`${seriesHref}/${lesson.number}`}
            />
          ))}
        </ol>
      </Section>
    </PaperPage>
  );
}
