import { parseLocalDate } from "@/lib/almanac/rules";
import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

/**
 * Card metrics as CSS variables: the phone size, then the drawn desktop size (Today)
 * from the md breakpoint up. The card's width comes from where it is placed.
 */
const SIZE =
  "[--num:56px] [--label:18px] [--gap:6px] [--pad:24px] md:[--num:72px] md:[--label:20px] md:[--pad:28px]";

/** Seven columns (four weeks of rows), or --cols:14 for two rows of two weeks. */
const GRID = "grid grid-cols-[repeat(var(--cols,7),var(--cell))] gap-(--gap)";

function shortDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Mo", "Tu": two letters, so T and S days can't be confused. */
const dayLabel = (day: StreakDay) => day.short.slice(0, 2);

type FourWeekGridProps = {
  /** The last 28 days, oldest first, ending today (Streak.month). */
  days: StreakDay[];
  /** The current run. Includes today only once today is done. */
  count: number;
  todayDone: boolean;
  /** Names what each kind of square means, under the grid. */
  legend?: boolean;
  /**
   * Dates down the left: each row's first day. Takes --axis (the column's width)
   * from a parent and replaces the range row under the grid.
   */
  axis?: boolean;
  className?: string;
};

const SWATCH = "box-border block size-[10px] flex-none border-[1.5px]";

/**
 * The 4 x 7 grid of the last 28 days, with weekday names above and the range below
 * (or row dates on the left, with `axis`). Sized by the --cell, --gap and --meta
 * (label size, 11px by default) variables on a parent. A parent can set --cols:14,
 * --rows:2, --early-letters:block and --odd-weeks:none to lay the same days out as 2 x 14.
 */
export function FourWeekGrid({ days, count, todayDone, legend = false, axis = false, className }: FourWeekGridProps) {
  if (!days.length) return null;
  const last = days.length - 1;

  const earlierDone = days.slice(0, last).filter((d) => d.done).length;
  const label =
    `Last four weeks: ${earlierDone} of ${last} earlier days done, ` +
    `current streak ${count} ${count === 1 ? "day" : "days"}, today ${todayDone ? "done" : "not done yet"}.`;

  // Two looks and a mark: a day with its lesson done is filled in accent, any
  // other day is blank, and today is ringed in accent, filled once it's done.
  const DONE = "border-solid border-(--accent) bg-(--accent)";
  const BLANK = "border-solid border-(--rule)";
  const TODAY_RING = "outline-2 outline-offset-2 outline-solid outline-(--accent)";
  const TODAY = cx(todayDone ? DONE : "border-solid border-(--accent)", TODAY_RING);

  function cellClass(day: StreakDay): string {
    if (day.isToday) return TODAY;
    return day.done ? DONE : BLANK;
  }

  const meta = "font-label text-[length:var(--meta,11px)]";

  return (
    <div role="img" aria-label={label} className={cx("w-fit", className)}>
      <div className={cx(axis && "grid grid-cols-[var(--axis)_auto] gap-x-2")}>
        {axis && <span aria-hidden="true" />}
        <div aria-hidden="true" className={cx(GRID, meta, "text-center")}>
          {/* Two weeks of names: the first week's only show in the two-row layout. */}
          {days.slice(-14).map((day, i) => (
            <span
              key={day.date}
              className={cx(
                day.isToday ? "font-medium text-(--ink)" : "text-(--ink-muted)",
                i < 7 && "[display:var(--early-letters,none)]"
              )}
            >
              {dayLabel(day)}
            </span>
          ))}
        </div>
        {axis && (
          // One date per row: the week it starts. In two rows of two weeks, every other date goes.
          <div
            aria-hidden="true"
            className={cx(meta, "mt-2 grid grid-rows-[repeat(var(--rows,4),var(--cell))] gap-y-(--gap) text-right text-(--ink-muted)")}
          >
            {[0, 7, 14, 21].map((start) => (
              <span
                key={start}
                className={cx("self-center whitespace-nowrap", start % 14 === 7 && "[display:var(--odd-weeks,block)]")}
              >
                {shortDate(days[start].date)}
              </span>
            ))}
          </div>
        )}
        <div aria-hidden="true" className={cx(GRID, "mt-2")}>
          {days.map((day) => (
            <span
              key={day.date}
              className={cx(
                "box-border block h-(--cell) w-(--cell) border-[1.5px] transition-colors duration-(--duration-step) ease-(--ease-enter)",
                cellClass(day)
              )}
            />
          ))}
        </div>
      </div>
      {!axis && (
        <div aria-hidden="true" className={cx(meta, "mt-2.5 flex justify-between uppercase tracking-[0.04em] text-(--ink-muted)")}>
          <span>{shortDate(days[0].date)}</span>
          <span>Today</span>
        </div>
      )}
      {legend && (
        <ul
          aria-hidden="true"
          className={cx(meta, "m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-(--ink-muted)")}
        >
          {[
            { look: DONE, text: "Lesson done" },
            { look: BLANK, text: "No lesson" },
            // A smaller ring, so the swatch keeps the same proportions as the square.
            { look: "border-solid border-(--accent) outline-[1.5px] outline-offset-1 outline-solid outline-(--accent)", text: "Today" },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-2">
              <span className={cx(SWATCH, item.look)} />
              {item.text}
            </li>
          ))}
        </ul>
      )}
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
 * The streak card, "Four weeks": the count, a grid of the last 28 days with a
 * legend, one italic note. Days with the lesson done are filled in accent, other
 * days are blank, and today is ringed in accent (filled once it's done).
 *
 * It lays itself out by its own width (container queries), so the page decides
 * how wide it is: a narrow card (beside the lesson on Today, or a small phone)
 * is 4 x 7 with the squares filling the width; a wide one (below the lesson)
 * puts the count and note on one line over a 2 x 14 grid that fills the card.
 */
export function StreakMark({ count, days, todayDone, longest, className }: StreakMarkProps) {
  // The longest run is worth naming only when it is longer than this one. Once
  // today is done the page says so, so the card adds only the record, if any.
  const record = longest > count ? `Longest so far: ${longest}.` : "";
  const note =
    count === 0
      ? "Finish today’s lesson to start a streak."
      : todayDone
        ? record
        : `Today still counts until midnight.${record ? ` ${record}` : ""}`;

  return (
    <aside
      aria-label="Streak"
      className={cx(
        "@container box-border w-full border border-solid border-(--rule) bg-(--paper-raised) p-(--pad) pb-[calc(var(--pad)_-_2px)] font-serif text-(--ink)",
        SIZE,
        className
      )}
    >
      <div className="grid grid-cols-1 @min-[21rem]:grid-cols-[auto_minmax(0,1fr)] @min-[21rem]:items-end @min-[21rem]:gap-x-6 @min-[21rem]:[--cols:14] @min-[21rem]:[--early-letters:block]">
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

        <FourWeekGrid
          days={days}
          count={count}
          todayDone={todayDone}
          legend
          axis
          className={cx(
            "mt-6 [--meta:12px] [--axis:3rem]",
            // Narrow: the dates, then seven squares filling the rest of the card's width.
            "[--cell:calc((100cqi_-_var(--axis)_-_0.5rem_-_6_*_var(--gap))_/_7)]",
            // Wide: two rows of fourteen across the full width, under the count and note.
            "@min-[21rem]:col-span-2 @min-[21rem]:row-start-2 @min-[21rem]:[--gap:5px] @min-[21rem]:[--rows:2] @min-[21rem]:[--odd-weeks:none] @min-[21rem]:[--cell:calc((100cqi_-_var(--axis)_-_0.5rem_-_13_*_var(--gap))_/_14)]"
          )}
        />

        {note && (
          <p
            className={cx(
              "m-0 mt-[18px] text-[16px] italic leading-[1.4] text-(--ink-muted)",
              "@min-[21rem]:col-start-2 @min-[21rem]:row-start-1 @min-[21rem]:mt-0 @min-[21rem]:text-right"
            )}
          >
            {note}
          </p>
        )}
      </div>
    </aside>
  );
}
