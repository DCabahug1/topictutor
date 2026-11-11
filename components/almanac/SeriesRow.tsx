import Link from "next/link";
import type { ReactNode } from "react";
import { LESSONS_PER_SERIES } from "@/lib/almanac/rules";
import type { SeriesSummary } from "@/lib/almanac/types";
import { cx } from "./cx";
import { ArrowIcon } from "./icons";
import { ProgressMeter } from "./ProgressMeter";

/** The part of a series title before its colon, for second lines: "How a Web Page Gets Built". */
export function shortTitle(title: string): string {
  const cut = title.indexOf(":");
  return cut > 0 ? title.slice(0, cut) : title;
}

/** The status at the end of a Library row: progress while in progress, otherwise a glyph and a word. */
function rowStatus(series: SeriesSummary): ReactNode {
  if (series.status === "completed") {
    return <ProgressMeter size="sm" lessonsDone={LESSONS_PER_SERIES} label={<span className="text-(--correct)">✓ Done</span>} />;
  }
  if (series.status === "notStarted") {
    return <ProgressMeter size="sm" lessonsDone={0} label="○ Not started" />;
  }
  return <ProgressMeter size="sm" lessonsDone={series.lessonsDone} label={`${series.lessonsDone} of ${LESSONS_PER_SERIES}`} />;
}

type SeriesRowProps = {
  series: SeriesSummary;
  /**
   * series: the series title with its subject underneath (the Library).
   * nextLesson: the lesson to open next, with the series underneath (Today).
   */
  lead?: "series" | "nextLesson";
  /** Defaults to the series overview, or straight to the next lesson when that is the lead. */
  href?: string;
  /** Controls beside the row, outside its link: the Library's delete button. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One series as a ruled row: a title, an italic line, and the status only
 * where it changes a decision. Put it inside an `li` that draws the hairline.
 */
export function SeriesRow({ series, lead = "series", href, actions, className }: SeriesRowProps) {
  const overview = `/series/${series.id}`;
  const next = series.nextLesson;
  const nextLesson = lead === "nextLesson";

  const title = nextLesson ? (next ? next.title : series.masteryPassed ? "Series completed" : "The Mastery Check is open") : series.title;
  const sub = nextLesson
    ? shortTitle(series.title)
    : [series.category, series.masteryBest !== null && series.masteryPassed ? `Mastery ${series.masteryBest}/5` : null]
        .filter(Boolean)
        .join(" · ");
  const status = nextLesson ? (
    <ProgressMeter
      size="sm"
      lessonsDone={series.lessonsDone}
      label={next ? `Lesson ${next.number} of ${LESSONS_PER_SERIES}` : "Mastery Check"}
    />
  ) : (
    rowStatus(series)
  );
  const target = href ?? (nextLesson && next ? `${overview}/${next.number}` : nextLesson && !next ? `${overview}/mastery` : overview);

  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4", className)}>
      <Link
        href={target}
        className="group grid grid-cols-[minmax(0,1fr)] items-center gap-x-8 gap-y-[10px] py-6 text-(--ink) no-underline md:grid-cols-[minmax(0,1fr)_auto_18px]"
      >
        <span className="min-w-0">
          <span className="block text-[21px] font-medium leading-[1.2] decoration-1 underline-offset-4 group-hover:underline md:text-[25px]">
            {title}
          </span>
          {sub && <span className="mt-[6px] block text-[16px] italic text-(--ink-muted)">{sub}</span>}
        </span>
        {status}
        <ArrowIcon className="hidden group-hover:text-(--accent) md:block" />
      </Link>
      {actions && <div className="flex items-center">{actions}</div>}
    </div>
  );
}
