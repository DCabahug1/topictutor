"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/almanac/Button";
import { LeadActions } from "@/components/almanac/LeadBlock";
import type { TopicCheck } from "@/lib/almanac";

type TopicReviewProps = {
  /** Never "clear": a clear topic starts without stopping here. */
  check: TopicCheck;
  /** Exactly what the learner typed. */
  typed: string;
  /** The topic being started right now, so its button shows it's busy. */
  starting: string | null;
  onUse: (topic: string) => void;
  /** Back to the field, to type something else. */
  onEdit: () => void;
  /** Moves focus to the heading when it appears. Off in the component gallery. */
  autoFocus?: boolean;
};

const COPY = {
  suggest: { eyebrow: "Check the topic", tone: "" },
  unclear: { eyebrow: "Couldn’t read that", tone: "" },
  refused: { eyebrow: "Can’t teach this", tone: "text-(--ink-muted)!" },
} as const;

/**
 * Shown in place of the start button when the topic needs a second look: a
 * likely typo, something it couldn't make sense of, or something it won't
 * teach. Nothing has been charged yet.
 */
export function TopicReview({ check, typed, starting, onUse, onEdit, autoFocus = true }: TopicReviewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) heading.current?.focus();
  }, [check, autoFocus]);

  if (check.verdict === "clear") return null;
  const copy = COPY[check.verdict];
  const busy = starting !== null;

  const title =
    check.verdict === "suggest"
      ? `Did you mean “${check.topic}”?`
      : check.verdict === "unclear"
        ? "We couldn’t quite tell what to teach."
        : "We can’t build a series on that.";

  const others = (
    <ul className="m-0 flex list-none flex-col gap-2 p-0 md:flex-row md:flex-wrap">
      {check.suggestions.map((topic) => (
        <li key={topic}>
          <Button variant="outline" size="compact" icon className="justify-between gap-4 py-2 text-left max-md:w-full" busy={starting === topic} disabled={busy && starting !== topic} onClick={() => onUse(topic)}>
            {topic}
          </Button>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="topic-review" className="mt-8 bg-(--paper-sunk) px-5 py-6 md:px-8 md:py-7">
      <p className={`t-eyebrow m-0 ${copy.tone}`}>{copy.eyebrow}</p>
      <h2
        id="topic-review"
        ref={heading}
        tabIndex={-1}
        className="after-eyebrow m-0 text-[26px] font-medium leading-[1.15] tracking-[-0.015em] [overflow-wrap:anywhere] md:text-[32px]"
      >
        {title}
      </h2>
      {check.note && <p className="m-0 mt-3 text-[18px] leading-normal text-(--ink-soft)">{check.note}</p>}

      {check.verdict === "suggest" ? (
        <>
          <LeadActions
            className="mt-6!"
            primary={
              <Button icon busy={starting === check.topic} disabled={busy && starting !== check.topic} onClick={() => onUse(check.topic)}>
                Use “{check.topic}”
              </Button>
            }
            quiet={
              <Button variant="quiet" disabled={busy} onClick={() => onUse(typed)}>
                or keep “{typed}”
              </Button>
            }
          />
          {check.suggestions.length > 0 && (
            <div className="mt-6">
              <p className="t-label m-0 text-(--ink-muted)">Or one of these</p>
              <div className="mt-3">{others}</div>
            </div>
          )}
        </>
      ) : (
        <>
          {check.suggestions.length > 0 && (
            <div className="mt-6">
              <p className="t-label m-0 text-(--ink-muted)">
                {check.verdict === "refused" ? "We could teach one of these instead" : "Did you mean one of these?"}
              </p>
              <div className="mt-3">{others}</div>
            </div>
          )}
          <Button variant="quiet" className="mt-4" disabled={busy} onClick={onEdit}>
            {check.verdict === "refused" ? "or try another topic" : "or change the topic"}
          </Button>
        </>
      )}
    </section>
  );
}
