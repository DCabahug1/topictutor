import type { CSSProperties } from "react";
import { parseLocalDate } from "@/lib/almanac/rules";
import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

/**
 * Card metrics as CSS variables, so one render can change size at a breakpoint.
 * md is the drawn size (Today, desktop). sm is the phone. lg is for Stats and was not drawn.
 * auto is sm on phones and md from the md breakpoint up.
 */
const SIZES = {
  sm: "[--num:56px] [--label:18px] [--cell:22px] [--gap:5px] [--pad:24px]",
  md: "max-w-[300px] [--num:72px] [--label:20px] [--cell:26px] [--gap:6px] [--pad:28px]",
  lg: "max-w-[380px] [--num:96px] [--label:22px] [--cell:34px] [--gap:8px] [--pad:32px]",
  auto:
    "[--num:56px] [--label:18px] [--cell:22px] [--gap:5px] [--pad:24px] md:max-w-[300px] md:[--num:72px] md:[--label:20px] md:[--cell:26px] md:[--gap:6px] md:[--pad:28px]",
} as const;

const GRID = "grid grid-cols-[repeat(7,var(--cell))] gap-(--gap)";

function shortDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type FourWeekGridProps = {
  /** The last 28 days, oldest first, ending today (Streak.month). */
  days: StreakDay[];
  /** The current run. Includes today only once today is done. */
  count: number;
  todayDone: boolean;
  className?: string;
};

/**
 * The 4 x 7 grid of the last 28 days, with weekday letters above and the range below.
 * Sized by the --cell, --gap and --meta (letter size, 11px by default) variables on a parent.
 */
export function FourWeekGrid({ days, count, todayDone, className }: FourWeekGridProps) {
  if (!days.length) return null;
  const last = days.length - 1;

  // Where the current run starts inside the window. Today joins it only once done.
  let runStart = todayDone ? last : last - 1;
  while (runStart >= 0 && days[runStart].done) runStart -= 1;
  runStart += 1;

  const earlierDone = days.slice(0, last).filter((d) => d.done).length;
  const label =
    `Last four weeks: ${earlierDone} of ${last} earlier days done, ` +
    `current streak ${count} ${count === 1 ? "day" : "days"}, today ${todayDone ? "done" : "not done yet"}.`;

  function cellClass(day: StreakDay, i: number): string {
    if (day.isToday) return todayDone ? "border-solid border-(--accent) bg-(--accent)" : "border-dashed border-(--ink)";
    if (!day.done) return "border-solid border-(--rule)";
    return i >= runStart ? "border-solid border-(--ink) bg-(--ink)" : "border-solid border-(--ink-muted) bg-(--ink-muted)";
  }

  const meta = "font-mono text-[length:var(--meta,11px)]";

  return (
    <div role="img" aria-label={label} className={cx("w-fit", className)}>
      <div aria-hidden="true" className={cx(GRID, meta, "text-center")}>
        {days.slice(-7).map((day) => (
          <span key={day.date} className={day.isToday ? "font-medium text-(--ink)" : "text-(--ink-muted)"}>
            {day.letter}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={cx(GRID, "mt-2")}>
        {days.map((day, i) => (
          <span
            key={day.date}
            className={cx(
              "box-border block h-(--cell) w-(--cell) border-[1.5px] transition-colors duration-(--duration-step) ease-(--ease-enter)",
              cellClass(day, i)
            )}
          />
        ))}
      </div>
      <div aria-hidden="true" className={cx(meta, "mt-2.5 flex justify-between uppercase tracking-[0.04em] text-(--ink-muted)")}>
        <span>{shortDate(days[0].date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

type StreakMarkProps = {
  /** The current run. Includes today only once today is done. */
  count: number;
  /** The last 28 days, oldest first, ending today (Streak.month). */
  days: StreakDay[];
  todayDone: boolean;
  /** The longest run ever, for the note. */
  longest: number;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * The streak card, "Four weeks": the count, a 4 x 7 grid of the last 28 days, one italic note.
 * Current run is ink, older finished days ink-muted, missed days a rule outline, today a dashed
 * ink outline until it is done and then the card's only accent.
 */
export function StreakMark({ count, days, todayDone, longest, size = "md", className }: StreakMarkProps) {
  const best = Math.max(longest, count);
  const note =
    count === 0
      ? "Finish today’s lesson to start a streak."
      : todayDone
        ? `Done for today. Longest so far: ${best}.`
        : `Today still counts until midnight. Longest so far: ${best}.`;

  const pad: CSSProperties = { padding: "var(--pad) var(--pad) calc(var(--pad) - 2px)" };

  return (
    <aside
      aria-label="Streak"
      className={cx(
        "box-border w-full border border-solid border-(--rule) bg-(--paper-raised) font-serif text-(--ink)",
        SIZES[size],
        className
      )}
      style={pad}
    >
      <div className="flex items-baseline gap-3">
        <p
          className={cx(
            "m-0 text-(length:--num) font-medium leading-[0.85] tracking-[-0.04em] tabular-nums",
            count === 0 ? "text-(--ink-muted)" : "text-(--ink)"
          )}
        >
          {count}
        </p>
        <p className="m-0 text-(length:--label) text-(--ink-muted)">day streak</p>
      </div>

      <FourWeekGrid days={days} count={count} todayDone={todayDone} className="mt-6" />

      <p className="m-0 mt-[18px] text-[16px] italic leading-[1.4] text-(--ink-muted)">{note}</p>
    </aside>
  );
}
