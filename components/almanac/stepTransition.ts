"use client";

import { flushSync } from "react-dom";

export type StepDirection = "forward" | "back";

let current = 0;

/**
 * Changes a session step with a slide: the old step drifts out one way while the
 * next comes in from the other (see the session-step rules in almanac.css).
 * Without View Transitions, or with reduced motion, the step just changes.
 */
export function changeStep(update: () => void, direction: StepDirection = "forward") {
  if (
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  const root = document.documentElement;
  const token = ++current;
  root.dataset.step = direction;
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.finally(() => {
    if (token === current) delete root.dataset.step;
  });
}
