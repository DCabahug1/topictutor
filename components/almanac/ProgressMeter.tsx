import type { ReactNode } from "react";
import { LESSONS_PER_SERIES } from "@/lib/almanac/rules";
import { cx } from "./cx";

type ProgressMeterProps = {
  /** 0 to 5. */
  lessonsDone: number;
  /** lg leads a series overview. sm sits at the end of a row. */
  size?: "lg" | "sm";
  /** The text beside the segments. Defaults to "2 of 5 done". Pass null for none. */
  label?: ReactNode;
  className?: string;
};

/**
 * Five small segments, one per lesson, plus the progress as text. The Mastery
 * Check is its own row in the lesson list, not a sixth segment.
 */
export function ProgressMeter({ lessonsDone, size = "lg", label, className }: ProgressMeterProps) {
  const text = label === undefined ? `${lessonsDone} of ${LESSONS_PER_SERIES} done` : label;
  return (
    <span
      className={cx(
        "inline-flex items-center font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)",
        size === "lg" ? "gap-[14px]" : "gap-3",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cx("grid flex-none", size === "lg" ? "gap-1" : "gap-[3px]")}
        style={{
          gridTemplateColumns: `repeat(${LESSONS_PER_SERIES}, ${size === "lg" ? "clamp(28px, 4vw, 48px)" : "14px"})`,
        }}
      >
        {Array.from({ length: LESSONS_PER_SERIES }, (_, i) => (
          <span
            key={i}
            className={cx(
              "h-[6px] outline-1 -outline-offset-1",
              i < lessonsDone ? "bg-(--ink) outline-(--ink)" : "bg-transparent outline-(--rule)"
            )}
            style={{ outlineStyle: "solid" }}
          />
        ))}
      </span>
      {text !== null && <span className="whitespace-nowrap">{text}</span>}
    </span>
  );
}
