"use client";

import { useCallback, useState } from "react";

type InViewOptions = {
  /** How much of the element must show, from 0 to 1. */
  threshold?: number;
  /** Grows or shrinks the viewport, for example "0px 0px -10% 0px". */
  rootMargin?: string;
};

/**
 * True once the element has scrolled into view, and it stays true.
 * False on the server and before the first check, so on-view motion starts hidden.
 */
export function useInView<T extends Element>({ threshold = 0.2, rootMargin = "0px" }: InViewOptions = {}) {
  const [inView, setInView] = useState(false);
  const ref = useCallback(
    (node: T | null) => {
      if (!node) return;
      if (typeof IntersectionObserver === "undefined") {
        setInView(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setInView(true);
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [threshold, rootMargin]
  );
  return [ref, inView] as const;
}
