"use client";

import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";
import { useInView } from "./useInView";

type RevealProps = {
  /** Waits this long after coming into view, in milliseconds. */
  delay?: number;
  className?: string;
  children: ReactNode;
};

/** Fades in and rises once it scrolls into view. With reduced motion it is simply there. */
export function Reveal({ delay = 0, className, children }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={cx("almanac-reveal", inView && "is-in", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

type RevealRuleProps = {
  /** Draws once this is true. Leave it out to draw when the rule itself comes into view. */
  show?: boolean;
  delay?: number;
  className?: string;
};

/** A rule that draws across from left to right. Give it a height and a colour through className. */
export function RevealRule({ show, delay = 0, className }: RevealRuleProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.5 });
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx("almanac-rule-draw block", (show ?? inView) && "is-in", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    />
  );
}

