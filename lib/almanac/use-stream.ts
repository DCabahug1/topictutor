"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StreamStatus = "idle" | "streaming" | "done" | "failed";

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Index just past the last complete sentence in `text`, or 0. */
function lastSentenceEnd(text: string): number {
  const match = text.match(/^[\s\S]*[.!?…]["’”)]?(?=\s|$)/);
  return match ? match[0].length : 0;
}

/**
 * Shows text as it is written.
 *
 * Words are appended as they arrive. With reduced motion the text is revealed a
 * sentence at a time instead. Split `text` on a blank line to get paragraphs.
 */
export function useTextStream() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  // Bumped whenever a stream is started, shown or reset, so a stale one stops updating.
  const run = useRef(0);

  useEffect(
    () => () => {
      run.current += 1;
    },
    []
  );

  const start = useCallback(async (source: AsyncIterable<string>) => {
    const id = (run.current += 1);
    const reduced = prefersReducedMotion();
    let full = "";
    let shown = 0;
    setText("");
    setStatus("streaming");
    try {
      for await (const chunk of source) {
        if (run.current !== id) return;
        full += chunk;
        if (!reduced) {
          setText(full);
        } else {
          const end = lastSentenceEnd(full);
          if (end > shown) {
            shown = end;
            setText(full.slice(0, end));
          }
        }
      }
      if (run.current !== id) return;
      setText(full);
      setStatus("done");
    } catch {
      if (run.current === id) setStatus("failed");
    }
  }, []);

  /** Shows text that already exists, with no writing. */
  const show = useCallback((ready: string) => {
    run.current += 1;
    setText(ready);
    setStatus("done");
  }, []);

  const reset = useCallback(() => {
    run.current += 1;
    setText("");
    setStatus("idle");
  }, []);

  return { text, status, start, show, reset };
}
