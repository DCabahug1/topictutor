"use client";

import { useRef, type KeyboardEvent } from "react";
import { AnswerOption, type AnswerResult } from "./AnswerOption";
import { cx } from "./cx";

/** An option index, or "unsure" for the Not sure option in tests. */
export type Answer = number | "unsure";

type QuestionProps = {
  /** Read by screen readers as the name of the radio group. Usually the prompt. */
  label: string;
  options: string[];
  value: Answer | null;
  onChange: (answer: Answer) => void;
  /**
   * instant: recall and lesson checks. The answer is revealed as soon as one is picked.
   * deferred: tests. Answers can change until the test is submitted, then `revealed` is set.
   */
  mode: "instant" | "deferred";
  /** Deferred mode only: show right and wrong. Instant mode reveals on its own. */
  revealed?: boolean;
  /** Needed to reveal. */
  correctIndex?: number;
  /** One line shown after reveal, led by the verdict. */
  explanation?: string;
  /** Adds the Not sure option (tests only). */
  allowUnsure?: boolean;
  className?: string;
};

const LETTERS = "ABCDEFGH";

/**
 * A multiple-choice question as a radio group.
 * Arrow keys move, Space or Enter selects, A to D pick directly and N picks Not sure.
 */
export function Question({
  label,
  options,
  value,
  onChange,
  mode,
  revealed: revealedProp = false,
  correctIndex,
  explanation,
  allowUnsure = false,
  className,
}: QuestionProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const revealed = mode === "instant" ? value !== null : revealedProp;
  const answers: Answer[] = [...options.map((_, i) => i), ...(allowUnsure ? (["unsure"] as const) : [])];

  const select = (answer: Answer) => {
    if (!revealed) onChange(answer);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const focused = refs.current.findIndex((el) => el === document.activeElement);

    if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      const from = focused === -1 ? (step === 1 ? -1 : 0) : focused;
      const next = (from + step + answers.length) % answers.length;
      refs.current[next]?.focus();
      return;
    }

    if (revealed) return;
    const key = event.key.toLowerCase();
    const letterIndex = LETTERS.toLowerCase().indexOf(key);
    if (key.length === 1 && letterIndex >= 0 && letterIndex < options.length) {
      event.preventDefault();
      select(letterIndex);
      refs.current[letterIndex]?.focus();
    } else if (key === "n" && allowUnsure) {
      event.preventDefault();
      select("unsure");
      refs.current[answers.length - 1]?.focus();
    }
  };

  const resultFor = (answer: Answer): AnswerResult => {
    if (!revealed || correctIndex === undefined) return "none";
    if (answer === correctIndex) return "correct";
    if (answer === value) return "incorrect";
    return "dimmed";
  };

  // Roving tabindex: the selected option is the tab stop, or the first one.
  const tabStop = value === null ? 0 : answers.indexOf(value);
  const isCorrect = value !== null && value === correctIndex;

  return (
    <div className={className}>
      <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className="flex flex-col gap-2">
        {answers.map((answer, i) => (
          <AnswerOption
            key={String(answer)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            letter={LETTERS[i]}
            text={answer === "unsure" ? "Not sure" : options[answer]}
            unsure={answer === "unsure"}
            selected={value === answer}
            result={resultFor(answer)}
            locked={revealed}
            tabIndex={i === tabStop ? 0 : -1}
            onSelect={() => select(answer)}
          />
        ))}
      </div>
      {revealed && correctIndex !== undefined && (
        <p
          role="status"
          className="almanac-rise mt-4 border-t border-(--rule) pt-[14px] text-[17px] leading-normal"
        >
          <span
            className={cx(
              "font-mono text-[12px] font-medium uppercase tracking-[0.06em]",
              isCorrect ? "text-(--correct)" : "text-(--incorrect)"
            )}
          >
            {isCorrect ? "Correct." : "Not quite."}
          </span>{" "}
          {explanation}
        </p>
      )}
    </div>
  );
}
