"use client";

import { Button } from "@/components/almanac/Button";
import { CheckIcon } from "@/components/almanac/icons";
import { PaperPage } from "@/components/almanac/Page";
import { ProgressMeter, StatusLabel } from "@/components/almanac/StatusLabel";
import { LESSONS_PER_SERIES, type Mastery, type Series } from "@/lib/almanac";
import { lessonList, shortTitle, twoDigits } from "./copy";
import { BackLink } from "./SeriesStates";

const TO_GO = ["", "One lesson", "Two lessons", "Three lessons", "Four lessons", "Five lessons"];

// Drawn like the shared icons: 24px grid, one stroke, no fill.
function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-none"
    >
      <rect x="5" y="11" width="14" height="9" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Not open yet: the lessons still to do, each with a way in. */
export function MasteryLocked({ mastery, series }: { mastery: Mastery; series: Series }) {
  const seriesHref = `/series/${series.id}`;
  const todo = series.lessons.filter((lesson) => mastery.unfinished.includes(lesson.number));
  const doneNumbers = series.lessons.filter((lesson) => lesson.done).map((lesson) => lesson.number);

  const kicker = (
    <p className="t-label m-0 inline-flex items-center gap-2 text-(--ink-muted)">
      <LockIcon />
      Mastery Check · not open yet
    </p>
  );
  const title =
    "m-0 mt-3 text-[34px] font-medium leading-[1.05] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(40px,4.6vw,60px)] md:leading-[1.02] md:tracking-[-0.025em]";
  const lead = "m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft) md:mt-[14px] md:text-[20px]";

  // The sample's Mastery Check never opens.
  if (series.isSample) {
    return (
      <PaperPage current="library">
        <BackLink href={seriesHref}>{shortTitle(series.title)}</BackLink>
        <div className="mt-3 max-w-[820px] md:mt-7">
          {kicker}
          <h1 className={title}>The Mastery Check comes with your own series.</h1>
          <p className={lead}>It opens once every lesson’s check is answered.</p>
          <div className="mt-6 flex flex-wrap gap-[10px]">
            <Button icon href="/series/new">
              Make your own series
            </Button>
            <Button variant="secondary" href={seriesHref}>
              Back to the series
            </Button>
          </div>
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage current="library">
      <BackLink href={seriesHref}>{shortTitle(series.title)}</BackLink>
      <div className="mt-3 max-w-[820px] md:mt-7">
        {kicker}
        <h1 className={title}>{TO_GO[todo.length] ?? `${todo.length} lessons`} to go first.</h1>
        <p className={lead}>
          The Mastery Check opens once every lesson’s check is answered, right or wrong. It draws on all five
          lessons, so it’s fairer to you this way.
        </p>

        <div className="mt-[22px]">
          <div className="flex justify-between gap-3 font-mono text-[13px]">
            <span className="text-(--ink-muted)">
              {series.lessonsDone} of {LESSONS_PER_SERIES} lessons
            </span>
            <span className="font-medium">{series.percent}%</span>
          </div>
          <ProgressMeter
            lessonsDone={series.lessonsDone}
            passed={series.masteryPassed}
            showPercent={false}
            className="mt-2 md:[&_[role=img]>span]:h-[10px]"
          />
        </div>

        <h2 className="t-label m-0 mt-8 md:mt-11">Still to do</h2>
        <ol className="m-0 mt-[10px] list-none border-0 border-b border-solid border-(--rule) p-0">
          {todo.map((lesson) => (
            <li
              key={lesson.number}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 border-0 border-t border-solid border-(--rule) py-4 md:py-5"
            >
              <span className="flex-[0_0_30px] font-mono text-[13px] text-(--ink-muted) md:flex-[0_0_40px] md:text-[14px]">
                {twoDigits(lesson.number)}
              </span>
              <span className="min-w-0 flex-[999_1_200px] md:flex-[999_1_320px]">
                <span className="block text-[19px] font-medium leading-[1.2] md:text-[24px]">{lesson.title}</span>
                {/* "Written" also covers a lesson prepared ahead, so it can't be called read. */}
                <StatusLabel
                  status="notStarted"
                  label={lesson.written ? "Check not answered yet" : "Not started"}
                  className="mt-[6px] font-normal!"
                />
              </span>
              <Button
                variant="secondary"
                size="compact"
                href={`${seriesHref}/${lesson.number}`}
                className="flex-none md:min-h-12 md:px-[18px] md:text-[14px]"
              >
                {lesson.written ? `Open lesson ${lesson.number}` : `Start lesson ${lesson.number}`}
              </Button>
            </li>
          ))}
        </ol>

        {doneNumbers.length > 0 && (
          <p className="m-0 mt-[18px] inline-flex items-center gap-[6px] font-mono text-[13px] text-(--correct)">
            <CheckIcon size={12} strokeWidth={2.8} className="flex-none" />
            Done: {lessonList(doneNumbers)}
          </p>
        )}
      </div>
    </PaperPage>
  );
}
