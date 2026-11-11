"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { plainText } from "@/lib/almanac/rules";
import { AnswerOption, type AnswerResult } from "./AnswerOption";
import { cx } from "./cx";
import { Markdown } from "./Markdown";

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
  /** 2 lays the options out in two columns from 768px, as the daily check does on desktop. */
  columns?: 1 | 2;
  /**
   * A to D (and N) answer from anywhere on the page, not only while the options have focus.
   * Turn it off when more than one unanswered question is on screen.
   */
  pageShortcuts?: boolean;
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
  columns = 1,
  pageShortcuts = true,
  className,
}: QuestionProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const revealed = mode === "instant" ? value !== null : revealedProp;
  const answers: Answer[] = [...options.map((_, i) => i), ...(allowUnsure ? (["unsure"] as const) : [])];

  const select = (answer: Answer) => {
    if (!revealed) onChange(answer);
  };

  /** A to D pick an option and N picks Not sure. Returns true if the key was used. */
  const pickByLetter = (pressed: string): boolean => {
    if (revealed) return false;
    const key = pressed.toLowerCase();
    const letterIndex = key.length === 1 ? LETTERS.toLowerCase().indexOf(key) : -1;
    if (letterIndex >= 0 && letterIndex < options.length) {
      select(letterIndex);
      refs.current[letterIndex]?.focus();
      return true;
    }
    if (key === "n" && allowUnsure) {
      select("unsure");
      refs.current[answers.length - 1]?.focus();
      return true;
    }
    return false;
  };

  const pick = useRef(pickByLetter);
  useEffect(() => {
    pick.current = pickByLetter;
  });
  useEffect(() => {
    if (!pageShortcuts) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (pick.current(event.key)) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageShortcuts]);

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

    if (!pageShortcuts && pickByLetter(event.key)) event.preventDefault();
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
      <div
        role="radiogroup"
        aria-label={plainText(label)}
        onKeyDown={onKeyDown}
        className={cx("almanac-stagger flex flex-col gap-[10px]", columns === 2 && "md:grid md:grid-cols-2")}
      >
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
            size={mode === "instant" ? "lg" : "md"}
            tabIndex={i === tabStop ? 0 : -1}
            onSelect={() => select(answer)}
          />
        ))}
      </div>
      {revealed && correctIndex !== undefined && (
        <p role="status" className="almanac-rise m-0 mt-6 text-[18px] leading-[1.55] md:mt-7 md:text-[20px]">
          <strong className={cx("font-semibold", isCorrect ? "text-(--correct)" : "text-(--incorrect)")}>
            {isCorrect ? "Right." : "Not quite."}
          </strong>{" "}
          <span className="text-(--ink-soft)">{explanation && <Markdown mode="inline">{explanation}</Markdown>}</span>
        </p>
      )}
    </div>
  );
}
