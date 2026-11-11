"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/almanac/cx";
import { useReducedMotion } from "./useReducedMotion";

/** How long each step plays, in milliseconds. */
const STEP = 3400;
const TICK = 100;

const STEPS = [
  { name: "Recall", line: "One question from before" },
  { name: "Lesson", line: "Three short paragraphs" },
  { name: "Check", line: "A quick check" },
  { name: "Finish", line: "Your streak goes up" },
];

const KICKER = "m-0 font-mono text-[12px] uppercase tracking-[0.08em]";

/**
 * "Watch a whole session": the four steps play on their own, with a pause
 * button. With reduced motion it waits for a click and nothing slides.
 */
export function SessionPlayer() {
  const reduced = useReducedMotion();
  const [{ step, elapsed }, setClock] = useState({ step: 0, elapsed: 0 });
  // Null until the learner presses play or pause: then it follows reduced motion.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const playing = chosen ?? !reduced;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setClock((c) =>
        c.elapsed + TICK < STEP ? { step: c.step, elapsed: c.elapsed + TICK } : { step: (c.step + 1) % STEPS.length, elapsed: 0 }
      );
    }, TICK);
    return () => window.clearInterval(timer);
  }, [playing]);

  const go = (next: number) => setClock({ step: next, elapsed: 0 });

  // The streak flips half a second into the finish step.
  const flipped = step === 3 && (reduced || elapsed >= 500);
  const slide = cx("absolute bottom-0 left-0", !reduced && "transition-[transform,opacity] duration-(--duration-moment) ease-(--ease-enter)");

  return (
    <section aria-labelledby="player-heading" className="mt-[112px] md:mt-[200px]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h2 id="player-heading" className="m-0 text-[34px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[48px]">
          Watch a whole session.
        </h2>
        <p className={cx(KICKER, "text-(--ink-muted)")}>Step {step + 1} of 4 · about three minutes for real</p>
      </div>

      <div className="mt-6 flex flex-wrap border border-solid border-(--ink) bg-(--paper-raised)">
        <div
          role="group"
          aria-label="Session steps"
          className="flex min-w-0 flex-[1_1_280px] flex-col border-0 border-b border-solid border-(--ink) md:border-b-0 md:border-r"
        >
          {STEPS.map((s, i) => (
            <button
              key={s.name}
              type="button"
              aria-current={i === step ? "step" : undefined}
              onClick={() => go(i)}
              className={cx(
                "grid w-full cursor-pointer grid-cols-[34px_minmax(0,1fr)] gap-[10px] border-0 border-b border-solid border-(--rule) px-[18px] py-[14px] text-left font-serif text-(--ink) transition-colors duration-(--duration-step) md:px-[26px] md:py-[22px]",
                i === step ? "bg-(--paper)" : "bg-transparent"
              )}
            >
              <span className={cx("font-mono text-[13px] leading-7", i === step ? "text-(--accent)" : "text-(--ink-muted)")}>
                0{i + 1}
              </span>
              <span>
                <span className="block text-[22px] font-medium leading-[1.25]">{s.name}</span>
                <span className={cx("mt-[2px] block text-[16px] leading-[1.4]", i === step ? "text-(--ink-soft)" : "text-(--ink-muted)")}>
                  {s.line}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div
          aria-live="polite"
          className="box-border flex min-h-[340px] min-w-0 flex-[999_1_460px] items-center p-6 md:min-h-[440px] md:px-14 md:py-12"
        >
          <div key={step} className={cx("w-full", !reduced && "almanac-rise")}>
            {step === 0 && (
              <>
                <p className={cx(KICKER, "text-(--accent)")}>Recall · from Monday · Finance</p>
                <p className="m-0 mt-3 text-[22px] font-medium leading-[1.2] md:text-[30px]">
                  Interest compounds monthly instead of yearly. The total after a year is:
                </p>
                <div className="mt-[22px] grid grid-cols-1 gap-[10px] text-[19px] sm:grid-cols-2">
                  <span className="border-[1.5px] border-solid border-(--rule) px-[18px] py-4 text-(--ink-muted)">The same</span>
                  <span className="flex justify-between gap-3 border-[1.5px] border-solid border-(--correct) bg-(--correct-wash) px-[18px] py-4">
                    Slightly higher
                    <span className="font-mono text-[12px] text-(--correct)">✓ CORRECT</span>
                  </span>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <p className={cx(KICKER, "text-(--accent)")}>Science</p>
                <p className="m-0 mt-[10px] text-[34px] font-medium leading-[1.02] tracking-[-0.02em] md:text-[52px]">
                  Why leap years exist
                </p>
                <p className="m-0 mt-[18px] text-[19px] leading-[1.6] text-(--ink-soft)">
                  Earth takes about 365.2422 days to circle the Sun, not a neat 365. A calendar of exactly 365 days slips
                  behind the seasons by almost six hours a year.
                  <span aria-hidden="true" className="almanac-text-caret ml-1 inline-block h-[17px] w-[7px] bg-(--accent) align-[-2px]" />
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <p className={cx(KICKER, "text-(--accent)")}>Check</p>
                <p className="m-0 mt-3 text-[22px] font-medium leading-[1.2] md:text-[30px]">Which of these years got a leap day?</p>
                <div className="mt-[22px] grid grid-cols-2 gap-[10px]">
                  <span className="flex flex-wrap items-center justify-between gap-2 border-[1.5px] border-solid border-(--incorrect) bg-(--incorrect-wash) px-5 py-[18px] text-[28px] font-medium md:text-[34px]">
                    1900
                    <span className="font-mono text-[12px] font-normal text-(--incorrect)">✕ YOUR PICK</span>
                  </span>
                  <span className="flex flex-wrap items-center justify-between gap-2 border-[1.5px] border-solid border-(--correct) bg-(--correct-wash) px-5 py-[18px] text-[28px] font-medium md:text-[34px]">
                    2000
                    <span className="font-mono text-[12px] font-normal text-(--correct)">✓ ANSWER</span>
                  </span>
                </div>
                <p className="m-0 mt-[14px] text-[16px] italic text-(--ink-muted)">Wrong still counts. The lesson is finished.</p>
              </>
            )}
            {step === 3 && (
              <>
                <p className={cx(KICKER, "text-(--ink-muted)")}>Lesson finished</p>
                <div className="mt-3 flex items-end gap-4">
                  <div className="relative h-[120px] w-[170px] overflow-hidden text-[120px] font-medium leading-none tracking-[-0.05em] md:h-[200px] md:w-[280px] md:text-[200px]">
                    <span
                      aria-hidden="true"
                      className={cx(slide, "text-(--ink-muted)", flipped ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100")}
                    >
                      12
                    </span>
                    <span className={cx(slide, "text-(--accent)", flipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0")}>
                      13
                    </span>
                  </div>
                  <p className="m-0 mb-[14px] font-mono text-[13px] uppercase tracking-[0.06em] text-(--ink-muted)">days in a row</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-[14px] flex items-center gap-4">
        <button
          type="button"
          onClick={() => setChosen(!playing)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center border-0 bg-(--ink) text-(--on-ink) hover:bg-(--accent)"
        >
          {playing ? (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
            </svg>
          ) : (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <div aria-hidden="true" className="grid flex-auto grid-cols-4 gap-1">
          {STEPS.map((s, i) => (
            <span key={s.name} className="h-1 bg-(--rule)">
              <span
                className="block h-full bg-(--ink)"
                style={{ width: `${i < step ? 100 : i === step ? Math.round((elapsed / STEP) * 100) : 0}%` }}
              />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
