"use client";

import { useEffect, useState } from "react";

export type TypedSegment = { text: string; em?: boolean };

type TypedTextProps = {
  segments: TypedSegment[];
  /** Typing begins once this is true. */
  start: boolean;
  /** Waits this long after start, in milliseconds. */
  delay?: number;
  /** Milliseconds per letter. Commas and full stops hold a little longer. */
  speed?: number;
  /** For an italic segment, for example font-normal. */
  emClassName?: string;
};

/**
 * Text that types itself out behind the vermilion caret, the way lessons are written.
 * The untyped rest is laid out but hidden, so lines never move while it types.
 * Screen readers get the whole text once. With reduced motion it is all there at once.
 * Wrap it and its followers in `.typed-group`, and give the followers `.typed-after`
 * so they wait until it has finished.
 */
export function TypedText({ segments, start, delay = 0, speed = 38, emClassName }: TypedTextProps) {
  const full = segments.map((s) => s.text).join("");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!start) return;
    // With reduced motion the stylesheet shows the rest and hides the caret.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let typed = 0;
    let timer = 0;
    const tick = () => {
      typed += 1;
      setShown(typed);
      if (typed >= full.length) return;
      const hold = /[,.]/.test(full[typed - 1]) ? speed * 4 : speed;
      timer = window.setTimeout(tick, hold);
    };
    timer = window.setTimeout(tick, delay);
    return () => window.clearTimeout(timer);
  }, [start, full, delay, speed]);

  const typed: React.ReactNode[] = [];
  const rest: React.ReactNode[] = [];
  let offset = 0;
  segments.forEach((segment, i) => {
    const cut = Math.max(0, Math.min(segment.text.length, shown - offset));
    offset += segment.text.length;
    const before = segment.text.slice(0, cut);
    const after = segment.text.slice(cut);
    const wrap = (text: string, key: string) =>
      segment.em ? (
        <em key={key} className={emClassName}>
          {text}
        </em>
      ) : (
        <span key={key}>{text}</span>
      );
    if (before) typed.push(wrap(before, `t${i}`));
    if (after) rest.push(wrap(after, `r${i}`));
  });

  return (
    <span data-typed={shown >= full.length ? "done" : "typing"}>
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {typed}
        {/* An empty inline, so the caret never opens a line break inside a word. */}
        <span className="typed-caret-anchor">
          <span className="typed-caret" />
        </span>
        <span className="typed-rest">{rest}</span>
      </span>
    </span>
  );
}
