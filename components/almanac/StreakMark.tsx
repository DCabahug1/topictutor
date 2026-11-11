import type { StreakDay } from "@/lib/almanac/types";
import { cx } from "./cx";

type StreakMarkProps = {
  count: number;
  /** The last seven days, oldest first. Omit to show the numeral alone. */
  week?: StreakDay[];
  todayDone: boolean;
  /** lg: set aside beside a lead (80px, 56px on phones). md: 40px. sm: 15px mono in the nav. */
  size?: "lg" | "md" | "sm";
  /** The finish moment: the numeral turns accent. Everywhere else it is ink. */
  celebrate?: boolean;
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

/** The seven-day strip: filled dots for done days, a dashed ring for today not done yet. */
export function WeekStrip({ week, className }: { week: StreakDay[]; className?: string }) {
  return (
    <div
      role="img"
      aria-label={weekLabel(week)}
      className={cx("grid grid-cols-[repeat(7,28px)] gap-1 text-center font-mono text-[11px]", className)}
    >
      {week.map((day) => (
        <div key={day.date} className={day.isToday ? "text-(--ink)" : "text-(--ink-muted)"}>
          <div
            className={cx(
              "mx-auto mb-[5px] box-border h-3 w-3 rounded-(--radius-full) border-[1.5px]",
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
  );
}

/**
 * The streak, set aside from the lead: a Newsreader numeral in ink with the
 * seven-day strip. Zero is muted and never a warning. Accent only with `celebrate`.
 */
export function StreakMark({ count, week, todayDone, size = "lg", celebrate = false, note, className }: StreakMarkProps) {
  const unit = count === 1 ? "day in a row" : "days in a row";

  if (size === "sm") {
    return (
      <span
        className={cx(
          "font-mono text-[15px] font-medium",
          count ? (celebrate ? "text-(--accent)" : "text-(--ink)") : "text-(--ink-muted)",
          className
        )}
      >
        {count}
        <span className="sr-only"> {unit}</span>
      </span>
    );
  }

  const defaultNote =
    count === 0 ? "Finish one lesson to start a streak." : todayDone ? undefined : "Today still counts until midnight.";

  return (
    <div className={className}>
      <div className="flex items-end gap-3">
        <p
          className={cx(
            "m-0 font-serif font-medium leading-[0.8] tracking-[-0.04em]",
            size === "lg" ? "text-[56px] md:text-[80px]" : "text-[40px]",
            !count ? "text-(--ink-muted)" : celebrate ? "text-(--accent)" : "text-(--ink)"
          )}
        >
          {count}
        </p>
        <p className="m-0 mb-1 font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)">{unit}</p>
      </div>
      {week && count > 0 && <WeekStrip week={week} className="mt-[18px]" />}
      {(note ?? defaultNote) && (
        <p className="m-0 mt-[14px] text-[16px] italic leading-[1.4] text-(--ink-muted)">{note ?? defaultNote}</p>
      )}
    </div>
  );
}
