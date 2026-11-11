import { parseLocalDate } from "@/lib/almanac/rules";
import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

/**
 * Card metrics as CSS variables: the phone size, then the drawn desktop size (Today)
 * from the md breakpoint up.
 */
const SIZE =
  "[--num:56px] [--label:18px] [--cell:22px] [--gap:5px] [--pad:24px] md:max-w-[300px] md:[--num:72px] md:[--label:20px] md:[--cell:26px] md:[--gap:6px] md:[--pad:28px]";

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
  /** The finish moment: today's done square fills in accent. Elsewhere it is ink, part of the run. */
  celebrate?: boolean;
  className?: string;
};

/**
 * The 4 x 7 grid of the last 28 days, with weekday letters above and the range below.
 * Sized by the --cell, --gap and --meta (letter size, 11px by default) variables on a parent.
 */
export function FourWeekGrid({ days, count, todayDone, celebrate = false, className }: FourWeekGridProps) {
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
    if (day.isToday && !todayDone) return "border-dashed border-(--ink)";
    if (day.isToday) return celebrate ? "border-solid border-(--accent) bg-(--accent)" : "border-solid border-(--ink) bg-(--ink)";
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
  className?: string;
};

/**
 * The streak card, "Four weeks": the count, a 4 x 7 grid of the last 28 days, one italic note.
 * Current run is ink, older finished days ink-muted, missed days a rule outline, today a dashed
 * ink outline until it is done. No accent here: that is for the Finish screen (spec rule 4).
 */
export function StreakMark({ count, days, todayDone, longest, className }: StreakMarkProps) {
  // The longest run is worth naming only when it is longer than this one.
  const record = longest > count ? ` Longest so far: ${longest}.` : "";
  const note =
    count === 0
      ? "Finish today’s lesson to start a streak."
      : todayDone
        ? `Done for today.${record}`
        : `Today still counts until midnight.${record}`;

  return (
    <aside
      aria-label="Streak"
      className={cx(
        "box-border w-full border border-solid border-(--rule) bg-(--paper-raised) p-(--pad) pb-[calc(var(--pad)_-_2px)] font-serif text-(--ink)",
        SIZE,
        className
      )}
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
