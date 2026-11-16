import { parseLocalDate } from "@/lib/almanac/rules";
import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

/**
 * Card metrics as CSS variables: the phone size, then the drawn desktop size (Today)
 * from the md breakpoint up. The card's width comes from where it is placed.
 */
const SIZE =
  "[--num:56px] [--label:18px] [--gap:6px] [--pad:24px] md:[--num:72px] md:[--label:20px] md:[--pad:28px]";

/** Seven columns, Sunday first: one row per week of the month. */
const GRID = "grid grid-cols-[repeat(7,var(--cell))] gap-(--gap)";

/** "Su", "Mo": two letters, so T and S days can't be confused. */
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** "Thu, Nov 12", for the hover label on each square. */
function hoverDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type MonthGridProps = {
  /** Every day of the current month, the 1st first (Streak.month). */
  days: StreakDay[];
  /** The current run. Includes today only once today is done. */
  count: number;
  todayDone: boolean;
  /** Names what each kind of square means, under the grid. */
  legend?: boolean;
  className?: string;
};

const SWATCH = "box-border block size-[10px] flex-none border-[1.5px]";

// Three looks and a mark: a day with its lesson done is filled in accent, an
// earlier day without one is blank, a day still to come is a quiet sunk fill,
// and today is ringed in accent, filled once it's done.
const DONE = "border-solid border-(--accent) bg-(--accent)";
const BLANK = "border-solid border-(--rule)";
const UPCOMING = "border-solid border-(--paper-sunk) bg-(--paper-sunk)";
const TODAY_RING = "outline-2 outline-offset-2 outline-solid outline-(--accent)";

/**
 * The current month as a calendar: the month's name, weekday names (Sunday first)
 * and one square per day, the 1st under its weekday. Hovering a square names its
 * date. Sized by the --cell, --gap and --meta (label size, 11px by default)
 * variables on a parent.
 */
export function MonthGrid({ days, count, todayDone, legend = false, className }: MonthGridProps) {
  if (!days.length) return null;

  const first = parseLocalDate(days[0].date);
  const monthName = first.toLocaleDateString("en-US", { month: "long" });
  const today = days.find((d) => d.isToday);
  const todayWeekday = today ? parseLocalDate(today.date).getDay() : -1;

  const earlier = days.filter((d) => !d.isToday && !d.upcoming);
  const earlierDone = earlier.filter((d) => d.done).length;
  const label =
    `${monthName}: ` +
    (earlier.length ? `${earlierDone} of ${earlier.length} earlier days done, ` : "") +
    `current streak ${count} ${count === 1 ? "day" : "days"}, today ${todayDone ? "done" : "not done yet"}.`;

  function cellClass(day: StreakDay): string {
    if (day.isToday) return cx(todayDone ? DONE : "border-solid border-(--accent)", TODAY_RING);
    if (day.upcoming) return UPCOMING;
    return day.done ? DONE : BLANK;
  }

  function hoverLabel(day: StreakDay): string {
    const date = hoverDate(day.date);
    if (day.isToday) return todayDone ? `Today, ${date} · Lesson done` : `Today, ${date}`;
    if (day.upcoming) return `${date} · Upcoming`;
    return `${date} · ${day.done ? "Lesson done" : "No lesson"}`;
  }

  const meta = "font-label text-[length:var(--meta,11px)]";

  return (
    <div role="img" aria-label={label} className={cx("w-fit", className)}>
      <p aria-hidden="true" className={cx(meta, "m-0 mb-2 font-medium uppercase tracking-[0.04em] text-(--ink)")}>
        {monthName}
      </p>
      <div aria-hidden="true" className={cx(GRID, meta, "text-center")}>
        {WEEKDAYS.map((name, i) => (
          <span key={name} className={i === todayWeekday ? "font-medium text-(--ink)" : "text-(--ink-muted)"}>
            {name}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={cx(GRID, "mt-2")}>
        {days.map((day, i) => (
          <span
            key={day.date}
            title={hoverLabel(day)}
            // The 1st sits under its weekday; the slots before it stay empty.
            style={i === 0 ? { gridColumnStart: first.getDay() + 1 } : undefined}
            className={cx(
              "box-border block h-(--cell) w-(--cell) border-[1.5px] transition-colors duration-(--duration-step) ease-(--ease-enter)",
              cellClass(day)
            )}
          />
        ))}
      </div>
      {legend && (
        <ul
          aria-hidden="true"
          className={cx(meta, "m-0 mt-3 grid list-none grid-cols-[auto_auto] justify-start gap-x-4 gap-y-1.5 p-0 text-(--ink-muted)")}
        >
          {[
            { look: DONE, text: "Lesson done" },
            { look: BLANK, text: "No lesson" },
            { look: UPCOMING, text: "Upcoming" },
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
  /** Every day of the current month, the 1st first (Streak.month). */
  days: StreakDay[];
  todayDone: boolean;
  /** The longest run ever, for the note. */
  longest: number;
  className?: string;
};

/**
 * The streak card: the count, this month's calendar with a legend, one italic
 * note. Days with the lesson done are filled in accent, earlier days without one
 * are blank, days still to come are muted, and today is ringed in accent (filled
 * once it's done).
 *
 * It lays itself out by its own width (container queries), so the page decides
 * how wide it is: a narrow card (beside the lesson on Today, or a phone) stacks
 * the count, the note and the calendar (its squares filling the width); a wide
 * one (below the lesson) puts the count and note on the left and the calendar
 * on the right.
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
      <div className="grid grid-cols-1 @min-[34rem]:grid-cols-[minmax(0,1fr)_auto] @min-[34rem]:grid-rows-[auto_1fr] @min-[34rem]:gap-x-8">
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

        {note && (
          <p
            className={cx(
              "m-0 mt-4 text-[16px] italic leading-[1.4] text-(--ink-muted)",
              "@min-[34rem]:col-start-1 @min-[34rem]:row-start-2 @min-[34rem]:mt-[18px] @min-[34rem]:self-start"
            )}
          >
            {note}
          </p>
        )}

        <MonthGrid
          days={days}
          count={count}
          todayDone={todayDone}
          legend
          className={cx(
            "mt-6 [--meta:12px]",
            // Narrow: seven squares filling the card's width, up to 48px each.
            "[--cell:min(48px,calc((100cqi_-_6_*_var(--gap))_/_7))]",
            // Wide: beside the count and note, at a fixed size.
            "@min-[34rem]:col-start-2 @min-[34rem]:row-span-2 @min-[34rem]:row-start-1 @min-[34rem]:mt-0 @min-[34rem]:[--cell:40px]"
          )}
        />
      </div>
    </aside>
  );
}
