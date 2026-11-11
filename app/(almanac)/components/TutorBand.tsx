"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/almanac/cx";
import { useReducedMotion } from "./useReducedMotion";

const ASK = [
  {
    q: "Why skip 1900 but not 2000?",
    source: "paragraph 3",
    a: "Century years skip the leap day unless they divide evenly by 400. 1900 does not, 2000 does. That one rule keeps the calendar within a day of the seasons for thousands of years.",
  },
  {
    q: "What if we had no leap days?",
    source: "paragraph 1",
    a: "The calendar would drift about a day every four years. After roughly 750 years, July would land in the middle of winter.",
  },
  {
    q: "Who came up with this?",
    source: "paragraph 2",
    a: "Julius Caesar added a leap day every four years in 46 BC. That overshot a little, so in 1582 Pope Gregory XIII added the century rule we still use.",
  },
];

/** The tutor, full bleed on sunk paper: tap a question and the answer types out with its source. */
export function TutorBand() {
  const reduced = useReducedMotion();
  // The first answer starts written; a tapped question types out.
  const [{ index, shown }, setAsk] = useState({ index: 0, shown: Infinity });
  const current = ASK[index];
  const typing = shown < current.a.length;

  useEffect(() => {
    if (!typing) return;
    const timer = window.setInterval(() => {
      setAsk((s) => ({ index: s.index, shown: Math.min(ASK[s.index].a.length, s.shown + 2) }));
    }, 22);
    return () => window.clearInterval(timer);
  }, [typing, index]);

  return (
    <section aria-labelledby="tutor-heading" className="bg-(--paper-sunk) px-(--gutter) py-[72px] md:py-32">
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center gap-x-20 gap-y-10">
        <div className="min-w-0 flex-[1_1_320px]">
          <p className="t-eyebrow m-0">The tutor</p>
          <h2 id="tutor-heading" className="m-0 mt-[14px] text-[44px] font-medium leading-[0.98] tracking-[-0.03em] md:text-[76px]">
            Stuck on a line? <em className="font-normal">Ask.</em>
          </h2>
          <p className="m-0 mt-5 max-w-[380px] text-[19px] leading-normal text-(--ink-soft)">
            Every lesson has a tutor that answers from the lesson itself, and shows you where.
          </p>
        </div>

        <div className="min-w-0 flex-[1.5_1_440px] border border-solid border-(--ink) bg-(--paper-raised)">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-0 border-b border-solid border-(--rule) px-[18px] py-4 font-mono text-[12px] uppercase tracking-[0.08em] md:px-7">
            <span className="text-(--ink-muted)">Asking about</span>
            <span>Why leap years exist</span>
          </div>
          <div className="box-border min-h-[250px] px-[18px] py-[22px] md:min-h-[300px] md:px-7 md:py-8">
            <p className="m-0 text-[22px] font-medium leading-[1.25] md:text-[26px]">{current.q}</p>
            <p aria-hidden="true" className="m-0 mt-4 text-[19px] leading-[1.6] text-(--ink-soft)">
              {current.a.slice(0, shown)}
              {typing && <span className="almanac-text-caret ml-[3px] inline-block h-[17px] w-[7px] bg-(--accent) align-[-2px]" />}
            </p>
            {/* Read once, whole, rather than letter by letter. */}
            <p aria-live="polite" className="sr-only">
              {current.a}
            </p>
            <p
              className={cx(
                "m-0 mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-(--accent) transition-opacity duration-(--duration-step)",
                typing ? "opacity-0" : "opacity-100"
              )}
            >
              ↳ From {current.source}
            </p>
          </div>
          <div
            role="group"
            aria-label="Try a question"
            className="flex flex-wrap gap-2 border-0 border-t border-solid border-(--rule) px-[18px] pb-5 pt-4 md:px-7"
          >
            {ASK.map((a, i) => (
              <button
                key={a.q}
                type="button"
                aria-pressed={i === index}
                onClick={() => setAsk({ index: i, shown: reduced ? Infinity : 0 })}
                className={cx(
                  "min-h-11 cursor-pointer px-[14px] py-2 text-left font-serif text-[17px] italic transition-colors duration-(--duration-instant) ease-out",
                  i === index
                    ? "border-2 border-solid border-(--ink) bg-(--paper-raised) text-(--ink)"
                    : "border-[1.5px] border-solid border-(--rule) bg-transparent text-(--ink-soft) hover:text-(--ink)"
                )}
              >
                {a.q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
