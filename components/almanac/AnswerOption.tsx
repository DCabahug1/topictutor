import { forwardRef } from "react";
import { cx } from "./cx";
import { CheckIcon, CrossIcon } from "./icons";

export type AnswerResult = "none" | "correct" | "incorrect" | "dimmed";

type AnswerOptionProps = {
  /** A to D. Ignored for the Not sure option, which shows "?". */
  letter: string;
  text: string;
  selected?: boolean;
  /** Set after the answer is revealed. */
  result?: AnswerResult;
  /** The fifth option in tests: dashed, italic, counts as wrong. */
  unsure?: boolean;
  /** Locks the option once the answer is revealed. */
  locked?: boolean;
  tabIndex?: number;
  onSelect?: () => void;
};

/**
 * One choice in a question. Always rendered inside a `radiogroup` (see Question).
 * State is carried by a glyph and a word, never by colour alone.
 */
export const AnswerOption = forwardRef<HTMLButtonElement, AnswerOptionProps>(function AnswerOption(
  { letter, text, selected = false, result = "none", unsure = false, locked = false, tabIndex, onSelect },
  ref
) {
  const correct = result === "correct";
  const incorrect = result === "incorrect";
  const dimmed = result === "dimmed";

  let tag = "";
  if (correct) tag = selected ? "Your answer · correct" : "Correct answer";
  else if (incorrect) tag = "Your answer";
  else if (selected && !dimmed) tag = "Selected";

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={locked || undefined}
      tabIndex={tabIndex}
      onClick={locked ? undefined : onSelect}
      className={cx(
        "grid w-full grid-cols-[26px_minmax(0,1fr)] items-start gap-3 border-[1.5px] p-[14px] text-left font-serif text-[17px] leading-[1.4] text-(--ink) transition-colors duration-(--duration-instant) ease-out",
        unsure ? "border-dashed italic" : "border-solid",
        locked ? "cursor-default" : "cursor-pointer",
        correct && "border-(--correct) bg-(--correct-wash)",
        incorrect && "border-(--incorrect) bg-(--incorrect-wash)",
        !correct && !incorrect && "bg-(--paper-raised)",
        !correct && !incorrect && (selected && !dimmed ? "border-(--ink)" : "border-(--rule)"),
        !correct && !incorrect && !selected && !locked && "hover:border-(--ink-muted)"
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "mt-px flex h-[22px] w-[22px] items-center justify-center rounded-(--radius-hairline) border-[1.5px] font-mono text-[12px] not-italic",
          correct && "border-(--correct) bg-(--correct) text-(--paper)",
          incorrect && "border-(--incorrect) bg-(--incorrect) text-(--paper)",
          dimmed && "border-(--ink-muted) text-(--ink-muted)",
          !correct && !incorrect && !dimmed && selected && "border-(--ink) bg-(--ink) text-(--on-ink)",
          !correct && !incorrect && !dimmed && !selected && "border-(--ink) text-(--ink)"
        )}
      >
        {correct ? (
          <CheckIcon size={12} strokeWidth={3} />
        ) : incorrect ? (
          <CrossIcon size={12} strokeWidth={3} />
        ) : unsure ? (
          "?"
        ) : (
          letter
        )}
      </span>
      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={cx((dimmed || (unsure && !selected)) && "text-(--ink-muted)")}>{text}</span>
        {tag && (
          <span
            className={cx(
              "font-mono text-[11px] uppercase not-italic tracking-[0.06em]",
              correct ? "text-(--correct)" : incorrect ? "text-(--incorrect)" : "text-(--ink-muted)"
            )}
          >
            {tag}
          </span>
        )}
      </span>
    </button>
  );
});
