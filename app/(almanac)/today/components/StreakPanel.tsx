import Link from "next/link";
import { cx } from "@/components/almanac/cx";
import { weekLabel } from "@/components/almanac/StreakMark";
import type { Stats, Streak } from "@/lib/almanac";
import { spellOut } from "../lesson/components/copy";

function streakNote(streak: Streak): string {
  if (streak.todayDone) {
    return streak.count <= 1 ? "Day one. See you tomorrow." : `${spellOut(streak.count)} days running. See you tomorrow.`;
  }
  if (streak.count === 0) return "Finish one lesson to start a streak. It takes about three minutes.";
  const longest = streak.longest > streak.count ? ` Longest streak: ${streak.longest} days.` : "";
  return `Today still counts until midnight.${longest}`;
}

type StreakPanelProps = {
  streak: Streak;
  /** False for a learner with no finished lessons: there is no week to draw yet. */
  showWeek: boolean;
  /** Lessons and recall so far. Null leaves the two figures out. */
  stats: Stats | null;
};

/**
 * The streak beside today's lesson: the numeral, the last seven days and a line
 * about today. Zero is muted, and today not done is a dashed ring, never a break.
 */
export function StreakPanel({ streak, showWeek, stats }: StreakPanelProps) {
  const recall = stats && stats.recall.total > 0 ? Math.round((stats.recall.correct / stats.recall.total) * 100) : null;

  return (
    <section aria-labelledby="streak-heading" className="min-w-0 flex-[1_1_300px]">
      <h2 id="streak-heading" className="t-label m-0 text-(--ink-muted)">
        Streak
      </h2>
      <div className="mt-[10px] flex items-end gap-3">
        <p
          className={cx(
            "m-0 text-[72px] font-medium leading-[0.85] tracking-[-0.04em] md:text-[120px]",
            streak.count ? "text-(--accent)" : "text-(--ink-muted)"
          )}
        >
          {streak.count}
        </p>
        <p className="m-0 mb-[6px] font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)">
          {streak.count === 1 ? "day in a row" : "days in a row"}
        </p>
      </div>
      {showWeek && (
        <div
          role="img"
          aria-label={weekLabel(streak.week)}
          className="mt-4 grid grid-cols-[repeat(7,32px)] gap-1 text-center font-mono text-[11px] text-(--ink-muted)"
        >
          {streak.week.map((day) => (
            <div key={day.date} className={cx(day.isToday && "text-(--ink)")}>
              <div
                className={cx(
                  "mx-auto mb-[5px] box-border h-[14px] w-[14px] rounded-(--radius-full) border-[1.5px]",
                  day.done && !day.isToday && "border-solid border-(--ink) bg-(--ink)",
                  day.done && day.isToday && "border-solid border-(--accent) bg-(--accent)",
                  !day.done && day.isToday && "border-dashed border-(--ink)",
                  !day.done && !day.isToday && "border-solid border-(--ink-muted)"
                )}
              />
              {day.letter}
            </div>
          ))}
        </div>
      )}
      <p className="m-0 mt-3 text-[16px] italic text-(--ink-muted)">{streakNote(streak)}</p>
      {stats && recall !== null && (
        <>
          <dl className="m-0 mt-[18px] grid grid-cols-2 gap-3 border-0 border-t border-solid border-(--rule) pt-[14px]">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-(--ink-muted)">Lessons</dt>
              <dd className="m-0 mt-1 font-mono text-[22px] font-medium">{stats.totalLessons}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.06em] text-(--ink-muted)">Recall</dt>
              <dd className="m-0 mt-1 font-mono text-[22px] font-medium">{recall}%</dd>
            </div>
          </dl>
          <Link
            href="/stats"
            className="mt-[10px] inline-flex min-h-11 items-center font-mono text-[13px] text-(--ink) underline underline-offset-4"
          >
            All your stats
          </Link>
        </>
      )}
    </section>
  );
}
