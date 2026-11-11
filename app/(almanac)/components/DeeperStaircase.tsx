"use client";

import { useState } from "react";
import { cx } from "@/components/almanac/cx";
import { RevealRule } from "@/components/almanac/Reveal";
import { useInView } from "@/components/almanac/useInView";

const TOPICS = [
  { name: "Bridges", start: 1, lessons: ["What holds a bridge up", "Beams and arches", "Why suspension works", "Wind and resonance", "Reading a real bridge"] },
  { name: "Jazz harmony", start: 0, lessons: ["What a chord is", "The ii V I", "Extensions and color", "Substitutions", "Hearing it in a standard"] },
  { name: "Black holes", start: 2, lessons: ["What gravity bends", "How stars collapse", "The event horizon", "Hawking radiation", "Reading the first image"] },
];

/** Go Deeper as a staircase: the placement test decides which step you start on. */
export function DeeperStaircase() {
  const [topic, setTopic] = useState(0);
  const current = TOPICS[topic];
  // The steps rise one after another, like a drawer opening upward, once the staircase is in view.
  const [stairsRef, inView] = useInView<HTMLOListElement>({ threshold: 0.35 });

  return (
    <section aria-labelledby="deeper-heading" className="mt-[112px] md:mt-[200px]">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-7">
        <div className="min-w-0 max-w-[600px] flex-[1_1_420px]">
          <p className="t-eyebrow m-0">Go deeper</p>
          <h2 id="deeper-heading" className="after-eyebrow m-0 text-[34px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[48px]">
            Five lessons on anything you name.
          </h2>
          <p className="m-0 mt-4 text-[19px] leading-normal text-(--ink-soft)">
            A short placement test finds your level, so the series starts where you are.
          </p>
        </div>
        <div role="group" aria-label="Example topics" className="flex flex-wrap gap-2">
          {TOPICS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-pressed={i === topic}
              onClick={() => setTopic(i)}
              className={cx(
                "min-h-11 cursor-pointer px-4 font-label text-[14px] transition-colors duration-(--duration-instant) ease-out",
                i === topic
                  ? "border-2 border-solid border-(--ink) bg-(--paper-raised) text-(--ink)"
                  : "border-[1.5px] border-solid border-(--rule) bg-transparent text-(--ink-soft) hover:text-(--ink)"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <ol
        ref={stairsRef}
        aria-label={`${current.name}: five lessons`}
        className="m-0 mt-10 flex list-none flex-col gap-[6px] p-0 md:mt-14 md:flex-row md:items-end md:gap-2 md:overflow-hidden"
      >
        {current.lessons.map((title, i) => {
          const skip = i < current.start;
          const here = i === current.start;
          return (
            <li
              key={`${current.name}-${i}`}
              style={{ ["--stair-h" as string]: `${210 + i * 56}px`, ["--stair-ml" as string]: `${i * 14}px`, ["--i" as string]: i }}
              className={cx(
                "stair box-border flex min-w-0 items-end justify-between gap-3 border-0 border-t-[3px] border-solid px-4 py-[14px] ml-(--stair-ml) md:ml-0 md:h-(--stair-h) md:flex-[1_1_0] md:flex-col md:items-stretch md:px-5 md:pb-[18px] md:pt-5",
                inView && "is-in",
                here && "border-(--accent) bg-(--ink) text-(--on-ink)",
                skip && "border-(--rule) bg-transparent text-(--ink-muted)",
                !here && !skip && "border-(--ink) bg-(--paper-sunk) text-(--ink)"
              )}
            >
              <div className="min-w-0">
                <p
                  className={cx(
                    "m-0 font-label text-[12px] uppercase tracking-[0.08em]",
                    here ? "text-(--on-ink)" : skip ? "text-(--ink-muted)" : "text-(--accent)"
                  )}
                >
                  {skip ? "Skipped" : here ? "You start here" : `Lesson ${i + 1}`}
                </p>
                <p className="m-0 mt-2 text-[19px] font-medium leading-[1.15] md:text-[21px]">{title}</p>
              </div>
              <span
                aria-hidden="true"
                className={cx(
                  "text-[44px] font-medium leading-[0.8] tracking-[-0.04em] md:text-[96px]",
                  here ? "text-(--on-ink)" : skip ? "text-(--rule)" : "text-(--ink)"
                )}
              >
                {i + 1}
              </span>
            </li>
          );
        })}
      </ol>
      <RevealRule show={inView} delay={5 * 110 + 200} className="mt-4 h-px bg-(--ink)" />
      <div
        className={cx("almanac-reveal flex flex-wrap justify-between gap-x-4 gap-y-2 pt-[14px] font-label text-[13px] uppercase tracking-[0.06em]", inView && "is-in")}
        style={{ ["--reveal-delay" as string]: `${5 * 110 + 360}ms` }}
      >
        <span className="text-(--accent)">↑ Placement starts you at lesson {current.start + 1}</span>
        <span className="text-(--ink-muted)">Then a Mastery Check</span>
      </div>
    </section>
  );
}
