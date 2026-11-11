import { forwardRef } from "react";
import { cx } from "./cx";

export type AnswerResult = "none" | "correct" | "incorrect" | "dimmed";

type AnswerOptionProps = {
  /** A to D. The Not sure option shows N. */
  letter: string;
  text: string;
  selected?: boolean;
  /** Set after the answer is revealed. */
  result?: AnswerResult;
  /** The last option in tests: dashed, italic, counts as wrong. */
  unsure?: boolean;
  /** Locks the option once the answer is revealed. */
  locked?: boolean;
  /** lg for lesson checks, where options are short. md for tests. */
  size?: "lg" | "md";
  tabIndex?: number;
  onSelect?: () => void;
};

/**
 * One choice in a question. Always rendered inside a `radiogroup` (see Question).
 * Selected is a 2px ink border on raised paper, never the ink fill. Right and
 * wrong carry a glyph and a word, never colour alone.
 */
export const AnswerOption = forwardRef<HTMLButtonElement, AnswerOptionProps>(function AnswerOption(
  { letter, text, selected = false, result = "none", unsure = false, locked = false, size = "lg", tabIndex, onSelect },
  ref
) {
  const correct = result === "correct";
  const incorrect = result === "incorrect";
  const dimmed = result === "dimmed";
  const plain = !correct && !incorrect;

  const tag = correct ? (selected ? "✓ Your answer" : "✓ Correct") : incorrect ? "✕ Your answer" : "";

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
        "grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left font-serif leading-[1.3] md:grid-cols-[48px_minmax(0,1fr)_auto] md:px-5 transition-colors duration-(--duration-instant) ease-out",
        size === "lg" ? "min-h-16 text-[18px] font-medium md:text-[22px]" : "min-h-[58px] text-[17px] md:text-[19px]",
        "border-solid",
        selected && plain && !dimmed ? "border-2" : "border-[1.5px]",
        locked ? "cursor-default" : "cursor-pointer",
        correct && "border-(--correct) bg-(--correct-wash) text-(--ink)",
        incorrect && "border-(--incorrect) bg-(--incorrect-wash) text-(--ink)",
        plain && selected && !dimmed && "border-(--ink) bg-(--paper-raised) text-(--ink)",
        plain && !(selected && !dimmed) && "border-(--rule) bg-transparent",
        plain && !(selected && !dimmed) && (dimmed || locked ? "text-(--ink-muted)" : "text-(--ink-soft) hover:border-(--ink-muted)")
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "font-mono text-[13px] font-normal not-italic",
          selected && plain && !dimmed ? "text-(--accent)" : "text-(--ink-muted)"
        )}
      >
        {unsure ? "?" : letter}
      </span>
      <span>{text}</span>
      <span
        className={cx(
          "whitespace-nowrap font-mono text-[12px] font-normal uppercase not-italic tracking-[0.06em]",
          correct ? "text-(--correct)" : "text-(--incorrect)"
        )}
      >
        {tag}
      </span>
    </button>
  );
});
