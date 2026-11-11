import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

type StreakMarkProps = {
  count: number;
  /** The last seven days, oldest first. Omit to show the numeral alone. */
  week?: StreakDay[];
  todayDone: boolean;
  /** lg: 64px on Stats and the finish. md: 30px in Today's header. sm: 15px mono in the nav. */
  size?: "lg" | "md" | "sm";
  /** Shown under the strip. Defaults follow the state. */
  note?: string;
  className?: string;
};

/** Spells the strip out for screen readers. */
export function weekLabel(week: StreakDay[]): string {
  const done = week.filter((d) => d.done && !d.isToday).map((d) => d.name);
  const today = week.find((d) => d.isToday);
  const before = done.length ? `Done ${done.join(", ")}` : "No days done before today";
  return `${before}. Today ${today?.done ? "done" : "not done yet"}.`;
}

/**
 * The streak as a vermilion numeral with a seven-day strip.
 * Zero is muted and never a warning. Today not done is a dashed ring, not a break.
 */
export function StreakMark({ count, week, todayDone, size = "lg", note, className }: StreakMarkProps) {
  const unit = count === 1 ? "day in a row" : "days in a row";

  if (size === "sm") {
    return (
      <span className={cx("font-mono text-[15px] font-medium", count ? "text-(--accent)" : "text-(--ink-muted)", className)}>
        {count}
        <span className="sr-only"> {unit}</span>
      </span>
    );
  }

  const defaultNote =
    count === 0 ? "It takes about three minutes." : todayDone ? undefined : "Today still counts until midnight.";

  return (
    <div className={className}>
      <p
        className={cx(
          "m-0 font-serif font-medium leading-none tracking-[-0.02em]",
          size === "lg" ? "text-[64px]" : "text-[30px]",
          count ? "text-(--accent)" : "text-(--ink-muted)"
        )}
      >
        {count}
      </p>
      <p className={cx("m-0 mt-1", size === "lg" ? "text-[17px]" : "text-[15px]")}>
        {count === 0 ? "Finish one lesson to start a streak." : unit}
      </p>
      {week && count > 0 && (
        <div
          role="img"
          aria-label={weekLabel(week)}
          className="mt-[14px] grid max-w-[260px] grid-cols-7 gap-1 text-center font-mono text-[11px] text-(--ink-muted)"
        >
          {week.map((day) => (
            <div key={day.date} className={cx(day.isToday && "text-(--ink)")}>
              <div
                className={cx(
                  "mx-auto mb-1 box-border h-[14px] w-[14px] rounded-(--radius-full) border-[1.5px]",
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
      {(note ?? defaultNote) && <p className="t-note m-0 mt-[10px] text-(--ink-muted)">{note ?? defaultNote}</p>}
    </div>
  );
}
