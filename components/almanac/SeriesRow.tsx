import Link from "next/link";
import type { ReactNode } from "react";
import { LESSONS_PER_SERIES, localDate, parseLocalDate, shiftDate } from "@/lib/almanac/rules";
import type { SeriesSummary } from "@/lib/almanac/types";
import { cx } from "./cx";
import { ArrowIcon } from "./icons";
import { ProgressMeter, StatusLabel } from "./StatusLabel";

/**
 * "Today", "Yesterday" or a short date such as "Nov 6" for an ISO time.
 * `today` is the learner's local date (YYYY-MM-DD), read in the browser.
 */
export function updatedLabel(updatedAt: string, today: string): string {
  const day = localDate(new Date(updatedAt));
  if (day === today) return "Today";
  if (day === shiftDate(today, -1)) return "Yesterday";
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return parseLocalDate(day).toLocaleDateString(
    "en-US",
    sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }
  );
}

type SeriesRowProps = {
  series: SeriesSummary;
  /**
   * series: the series itself, with status, description and progress (the Library).
   * nextLesson: leads with the lesson to open next, with the series underneath (Today).
   */
  lead?: "series" | "nextLesson";
  /** Defaults to the series overview, or straight to the next lesson when that is the lead. */
  href?: string;
  /** The learner's local date (YYYY-MM-DD). Give it to show "Updated today"; leave it out to hide the stamp. */
  today?: string;
  /** Controls beside the row, outside its link: the Library's delete button. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One series in a list. The whole row is a link, and the title is never
 * truncated. Put it inside an `li` that draws the hairline between rows.
 */
export function SeriesRow({ series, lead = "series", href, today, actions, className }: SeriesRowProps) {
  const overview = `/series/${series.id}`;

  if (lead === "nextLesson") {
    const next = series.nextLesson;
    const kicker = next
      ? `Lesson ${next.number} of ${LESSONS_PER_SERIES}`
      : series.masteryPassed
        ? "Completed"
        : "Mastery Check";
    const title = next ? next.title : series.masteryPassed ? "Series completed" : "The Mastery Check is open";
    return (
      <div className={cx("grid grid-cols-[minmax(0,1fr)_auto] gap-3", className)}>
        <Link
          href={href ?? (next ? `${overview}/${next.number}` : overview)}
          className="group grid grid-cols-[minmax(0,1fr)_20px] gap-3 py-4 text-(--ink) no-underline"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-(--accent)">
              {kicker} · {series.category}
            </span>
            <span className="mt-[6px] block text-[19px] font-medium leading-[1.2] md:text-[22px]">{title}</span>
            <span className="mt-1 block text-[15px] italic text-(--ink-muted)">
              {series.title} · {series.percent}%
            </span>
          </span>
          <ArrowIcon className="mt-[22px] group-hover:text-(--accent)" />
        </Link>
        {actions && <div className="flex items-start">{actions}</div>}
      </div>
    );
  }

  return (
    <div className={cx("grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-[18px]", className)}>
      <Link href={href ?? overview} className="group min-w-0 text-(--ink) no-underline">
        <span className="flex flex-wrap items-center gap-x-[10px] gap-y-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em]">
          <span className="text-(--accent)">{series.category}</span>
          <StatusLabel status={series.status} className="text-[11px]!" />
          {today && (
            <span className="font-normal text-(--ink-muted)">Updated {updatedLabel(series.updatedAt, today)}</span>
          )}
        </span>
        <span className="mt-[6px] block text-[20px] font-medium leading-[1.2] decoration-1 underline-offset-4 group-hover:underline md:text-[24px]">
          {series.title}
        </span>
        <span className="mt-1 block text-[16px] leading-[1.45] text-(--ink-soft)">{series.description}</span>
        <div className="mt-[10px] flex items-center gap-[10px]">
          <ProgressMeter
            lessonsDone={series.lessonsDone}
            passed={series.masteryPassed}
            showPercent={false}
            className="w-[94px] flex-none"
          />
          <span className="font-mono text-[12px] font-medium">{series.percent}%</span>
          {/* The best Mastery Check score, out of its five questions. */}
          {series.masteryBest !== null && (
            <span className="font-mono text-[12px] text-(--ink-muted)">· best {series.masteryBest}/5</span>
          )}
        </div>
      </Link>
      {actions && <div className="flex items-start">{actions}</div>}
    </div>
  );
}
