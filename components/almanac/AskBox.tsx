"use client";

import { useId, useState, type FormEvent } from "react";
import type { TutorChunk } from "@/lib/almanac/types";
import { useTextStream } from "@/lib/almanac/use-stream";
import { Caret } from "./Button";

type AskBoxProps = {
  /** Changing lesson clears the conversation. */
  lessonId: string;
  /** Returns the answer as it is written, with the paragraph it comes from first. */
  onAsk: (question: string) => AsyncIterable<TutorChunk>;
  onExplainDifferently: () => AsyncIterable<TutorChunk>;
  /** An example question, offered as a suggestion before anything is asked. */
  hint?: string;
  className?: string;
};

const DIFFERENTLY = "Explain this differently";

const chip =
  "min-h-11 cursor-pointer border-[1.5px] border-solid border-(--rule) bg-transparent px-3 py-2 text-left font-serif text-[16px] italic text-(--ink) transition-colors duration-(--duration-instant) ease-out hover:border-(--ink) disabled:cursor-progress disabled:text-(--ink-muted)";

/**
 * The tutor after a lesson: a recessed block, set apart from the reading.
 * Nothing is saved; the conversation lives here and is gone when it unmounts.
 */
export function AskBox(props: AskBoxProps) {
  // Keyed by lesson, so moving to another lesson starts with an empty box.
  return <AskBoxForLesson key={props.lessonId} {...props} />;
}

function AskBoxForLesson({ onAsk, onExplainDifferently, hint, className }: AskBoxProps) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [source, setSource] = useState<number | null>(null);
  const { text, status, start } = useTextStream();
  const answering = status === "streaming";

  const ask = (question: string) => {
    setAsked(question);
    setDraft("");
    setSource(null);
    const chunks = question === DIFFERENTLY ? onExplainDifferently() : onAsk(question);
    start(
      (async function* () {
        for await (const chunk of chunks) {
          if (chunk.kind === "source") setSource(chunk.paragraph);
          else yield chunk.text;
        }
      })()
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (question && !answering) ask(question);
  };

  const suggestions = [...(!asked && hint ? [hint] : []), ...(asked !== DIFFERENTLY ? [DIFFERENTLY] : [])];

  return (
    <section
      aria-labelledby={`${id}-label`}
      className={["bg-(--paper-sunk) px-5 py-[22px] md:px-9 md:py-8", className].filter(Boolean).join(" ")}
    >
      <h2
        id={`${id}-label`}
        className="m-0 font-mono text-[12px] font-medium uppercase tracking-[0.1em] text-(--ink-muted)"
      >
        Ask the tutor
      </h2>

      {asked && (
        <>
          <p className="after-eyebrow m-0 text-[17px] italic text-(--ink-muted) md:text-[19px]">You asked: {asked}</p>
          {status === "failed" ? (
            <div role="alert" className="mt-[10px] text-[17px] leading-normal md:text-[19px]">
              <strong className="font-semibold text-(--incorrect)">No answer.</strong>{" "}
              <span className="text-(--ink-soft)">The tutor didn’t finish. Your question is still here.</span>{" "}
              <button
                type="button"
                onClick={() => ask(asked)}
                className="cursor-pointer border-0 bg-transparent p-0 font-serif text-[inherit] italic text-(--ink-soft) underline underline-offset-[5px] hover:text-(--ink)"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <p aria-busy={answering} className="m-0 mt-[10px] text-[18px] leading-[1.6] md:text-[19px]">
                {text}
                {answering && <Caret inText className="h-4" />}
              </p>
              {status === "done" && source !== null && (
                <p className="m-0 mt-[14px] font-mono text-[12px] uppercase tracking-[0.08em] text-(--accent)">
                  ↳ From paragraph {source}
                </p>
              )}
              {/* Announced once when the answer is complete, never word by word. */}
              <p role="status" className="sr-only">
                {status === "done" ? `Answer ready. ${text}` : ""}
              </p>
            </>
          )}
        </>
      )}

      {suggestions.length > 0 && (
        <div className={`${asked ? "mt-4" : "mt-(--eyebrow-gap)"} flex flex-wrap gap-2`}>
          {suggestions.map((question) => (
            <button key={question} type="button" disabled={answering} onClick={() => ask(question)} className={chip}>
              {question}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-6 flex min-h-[52px] items-center gap-3 border border-solid border-(--rule) bg-(--paper-raised) px-4"
      >
        <label htmlFor={`${id}-input`} className="sr-only">
          {asked ? "Ask a follow-up" : "Ask a question about this lesson"}
        </label>
        <input
          id={`${id}-input`}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={asked ? "Ask a follow-up" : "Ask anything about this lesson"}
          autoComplete="off"
          maxLength={500}
          className="h-12 min-w-0 flex-auto rounded-none border-0 bg-transparent p-0 font-serif text-[18px] italic text-(--ink)"
        />
        <button
          type="submit"
          aria-label="Ask"
          disabled={answering}
          className="min-h-11 flex-none cursor-pointer border-0 bg-transparent px-1 font-mono text-[12px] uppercase text-(--ink-muted) hover:text-(--ink) disabled:cursor-progress"
        >
          Enter
        </button>
      </form>
    </section>
  );
}
