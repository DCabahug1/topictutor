"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { LeadActions } from "@/components/almanac/LeadBlock";
import { TopicReview } from "@/components/almanac/TopicReview";
import { InlineAlert } from "../../../series/new/components/parts";
import { useSeriesStart } from "../../../series/new/components/useSeriesStart";

const FIELD_ID = "own-topic";

type OwnTopicStartProps = {
  /** Quiet links beside the start button, like "or read today's lesson again". */
  quiet?: ReactNode;
  className?: string;
};

/**
 * The next step after today's lesson: a series on anything the learner names.
 * The topic is checked the way Start a series checks it (a likely typo, or
 * something it won't teach, gets a review here), then the placement test starts.
 */
export function OwnTopicStart({ quiet, className }: OwnTopicStartProps) {
  const [topic, setTopic] = useState("");
  const { checking, starting, failed, review, begin, submit, clearReview } = useSeriesStart({ onBegin: setTopic });
  const busy = checking || starting !== null;

  const start = (event: FormEvent) => {
    event.preventDefault();
    void submit(topic);
  };

  const editTopic = () => {
    clearReview();
    const field = document.getElementById(FIELD_ID) as HTMLInputElement | null;
    field?.focus();
    field?.select();
  };

  return (
    <form
      onSubmit={start}
      aria-labelledby="own-topic-heading"
      className={cx("min-w-0 border-0 border-t border-solid border-(--rule) pt-7", className)}
    >
      <p className="t-eyebrow m-0">Your next series · five lessons</p>
      <h2 id="own-topic-heading" className="t-title after-eyebrow m-0 max-w-[620px]">
        What do you want to learn next?
      </h2>
      <p className="m-0 mt-3 max-w-[540px] text-[17px] italic leading-normal text-(--ink-muted) md:text-[18px]">
        Name any topic. A short placement test finds where you are, then five lessons start there.
      </p>

      <label htmlFor={FIELD_ID} className="sr-only">
        Topic
      </label>
      <input
        id={FIELD_ID}
        type="text"
        value={topic}
        onChange={(event) => {
          setTopic(event.target.value);
          clearReview();
        }}
        placeholder="Basics of web development"
        autoComplete="off"
        maxLength={120}
        className="mt-6 box-border block h-14 w-full max-w-[620px] rounded-none border border-solid border-(--ink) bg-(--paper-raised) px-4 font-serif text-[20px] text-(--ink) md:h-16 md:text-[24px]"
      />

      {failed && <InlineAlert className="mt-4">The test didn’t start. Check your connection and try again.</InlineAlert>}

      {review ? (
        <TopicReview check={review.check} typed={review.typed} starting={starting} onUse={(t) => begin(t)} onEdit={editTopic} />
      ) : (
        <LeadActions
          className="mt-6!"
          primary={
            topic.trim() ? (
              <Button type="submit" icon busy={busy}>
                {checking ? "Checking the topic" : starting !== null ? "Starting your test" : "Start a series"}
              </Button>
            ) : (
              <Button type="submit" disabled>
                Name a topic to start
              </Button>
            )
          }
          quiet={quiet}
        />
      )}
    </form>
  );
}
