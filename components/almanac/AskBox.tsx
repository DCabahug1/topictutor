"use client";

import { useId, useState, type FormEvent } from "react";
import { useTextStream } from "@/lib/almanac/use-stream";
import { Caret } from "./Button";
import { SendIcon } from "./icons";

type AskBoxProps = {
  /** Changing lesson clears the conversation. */
  lessonId: string;
  /** Returns the answer as it is written. */
  onAsk: (question: string) => AsyncIterable<string>;
  onExplainDifferently: () => AsyncIterable<string>;
  /** An example question, shown as the placeholder. */
  hint?: string;
  className?: string;
};

const DIFFERENTLY = "Explain this differently";

/**
 * The tutor inside a lesson. Nothing is saved: the conversation lives in this
 * component and is gone when it unmounts.
 */
export function AskBox(props: AskBoxProps) {
  // Keyed by lesson, so moving to another lesson starts with an empty box.
  return <AskBoxForLesson key={props.lessonId} {...props} />;
}

function AskBoxForLesson({ onAsk, onExplainDifferently, hint, className }: AskBoxProps) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const { text, status, start } = useTextStream();
  const answering = status === "streaming";

  const ask = (question: string) => {
    setAsked(question);
    setDraft("");
    start(question === DIFFERENTLY ? onExplainDifferently() : onAsk(question));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (question && !answering) ask(question);
  };

  return (
    <section aria-labelledby={`${id}-label`} className={className}>
      <h2 id={`${id}-label`} className="t-label m-0 text-(--ink-muted)">
        Ask the tutor about this lesson
      </h2>

      {asked && (
        <>
          <p className="mt-3 font-mono text-[13px] text-(--ink-muted) md:mt-4">You asked: {asked}</p>
          {status === "failed" ? (
            <>
              <div
                role="alert"
                className="mt-2 border-[1.5px] border-solid border-(--incorrect) bg-(--incorrect-wash) px-4 py-[14px] text-[16px] leading-normal"
              >
                <b className="font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-(--incorrect)">
                  No answer.
                </b>{" "}
                The tutor didn’t finish. Your question is still here.
              </div>
              <button
                type="button"
                onClick={() => ask(asked)}
                className="mt-[10px] min-h-11 cursor-pointer border-[1.5px] border-solid border-(--ink) bg-transparent px-[14px] font-mono text-[13px] text-(--ink) hover:bg-(--paper-sunk)"
              >
                Try again
              </button>
            </>
          ) : (
            <>
              <div
                aria-busy={answering}
                className="mt-2 border border-solid border-(--rule) bg-(--paper-raised) px-4 py-[14px] text-[17px] leading-[1.55] md:px-5 md:py-[18px] md:text-[19px]"
              >
                {text}
                {answering && <Caret inText className="h-4" />}
              </div>
              {/* Announced once when the answer is complete, never word by word. */}
              <p role="status" className="sr-only">
                {status === "done" ? `Answer ready. ${text}` : ""}
              </p>
            </>
          )}
        </>
      )}

      <div className="mt-[10px] flex flex-wrap items-center gap-x-4 gap-y-3 md:mt-[14px]">
        <form onSubmit={submit} className="flex min-w-0 flex-[1_1_320px] gap-2">
          <label htmlFor={`${id}-input`} className="sr-only">
            {asked ? "Ask a follow-up" : "Your question"}
          </label>
          <input
            id={`${id}-input`}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={asked ? "Ask a follow-up" : hint}
            autoComplete="off"
            className="h-12 min-w-0 flex-auto rounded-none border-0 border-b-[1.5px] border-solid border-(--ink) bg-transparent px-[2px] font-serif text-[19px] text-(--ink)"
          />
          <button
            type="submit"
            aria-label="Ask"
            disabled={answering}
            className="flex h-12 w-12 flex-none cursor-pointer items-center justify-center border-0 bg-(--ink) text-(--on-ink) transition-colors duration-(--duration-instant) hover:bg-(--accent) disabled:cursor-progress disabled:bg-(--ink-muted)"
          >
            <SendIcon />
          </button>
        </form>
        <button
          type="button"
          onClick={() => ask(DIFFERENTLY)}
          disabled={answering}
          className="min-h-11 flex-none cursor-pointer border border-solid border-(--ink) bg-transparent px-4 font-mono text-[13px] text-(--ink) hover:bg-(--paper-sunk) disabled:cursor-progress md:min-h-12"
        >
          {DIFFERENTLY}
        </button>
      </div>
      <p className="t-note mt-3 text-(--ink-muted)">
        Answers come from this lesson. Nothing is saved when you leave.
      </p>
    </section>
  );
}
