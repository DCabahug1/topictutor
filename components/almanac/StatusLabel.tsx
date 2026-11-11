import { LESSONS_PER_SERIES, percentComplete } from "@/lib/almanac/rules";
import { cx } from "./cx";
import { CheckIcon } from "./icons";

export type Status = "notStarted" | "inProgress" | "completed" | "done";

const WORDS: Record<Status, string> = {
  notStarted: "Not started",
  inProgress: "In progress",
  completed: "Completed",
  done: "Done",
};

type StatusLabelProps = {
  status: Status;
  /** Replaces the default word, for example "Lesson done" or "Done · Science". */
  label?: string;
  className?: string;
};

/** A glyph plus a word. The shape and the word carry the meaning; colour only reinforces it. */
export function StatusLabel({ status, label, className }: StatusLabelProps) {
  const finished = status === "completed" || status === "done";
  return (
    <span
      className={cx(
        "t-label inline-flex items-center gap-[6px]",
        status === "notStarted" && "text-(--ink-muted)",
        status === "inProgress" && "text-(--ink)",
        finished && "text-(--correct)",
        className
      )}
    >
      {finished ? (
        <CheckIcon size={13} strokeWidth={2.6} className="flex-none" />
      ) : (
        <span
          aria-hidden="true"
          className="box-border h-3 w-3 flex-none rounded-(--radius-full) border-[1.5px] border-solid border-current"
          style={
            status === "inProgress"
              ? { background: "linear-gradient(90deg, currentColor 50%, transparent 50%)" }
              : undefined
          }
        />
      )}
      {label ?? WORDS[status]}
    </span>
  );
}

type ProgressMeterProps = {
  /** 0 to 5. */
  lessonsDone: number;
  /** The Mastery Check is passed. */
  passed: boolean;
  /** Shows "2 of 5 lessons" and "Mastery Check" under the cells. */
  caption?: boolean;
  /** Hide the percent when the caller prints it elsewhere. */
  showPercent?: boolean;
  className?: string;
};

/** Six cells: five lessons plus the Mastery Check, which stays dashed until it is passed. */
export function ProgressMeter({ lessonsDone, passed, caption = false, showPercent = true, className }: ProgressMeterProps) {
  const percent = percentComplete(lessonsDone, passed);
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <div
          role="img"
          aria-label={`${lessonsDone} of ${LESSONS_PER_SERIES} lessons done, Mastery Check ${passed ? "passed" : "not passed"}, ${percent}% complete`}
          className="grid min-w-0 flex-auto grid-cols-6 gap-[3px]"
        >
          {Array.from({ length: LESSONS_PER_SERIES }, (_, i) => (
            <span
              key={i}
              className={cx("h-2 border border-solid border-(--ink)", i < lessonsDone && "bg-(--ink)")}
            />
          ))}
          <span className={cx("h-2 border border-(--ink)", passed ? "border-solid bg-(--ink)" : "border-dashed")} />
        </div>
        {showPercent && <span className="flex-none font-mono text-[14px] font-medium">{percent}%</span>}
      </div>
      {caption && (
        <div className="mt-[6px] flex justify-between font-mono text-[12px] text-(--ink-muted)">
          <span>
            {lessonsDone} of {LESSONS_PER_SERIES} lessons
          </span>
          <span>Mastery Check</span>
        </div>
      )}
    </div>
  );
}
