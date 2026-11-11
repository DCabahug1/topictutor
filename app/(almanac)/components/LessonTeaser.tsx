import Link from "next/link";
import { ArrowIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import type { AlmanacError, DailySession } from "@/lib/almanac";

const CARD =
  "mx-auto mt-16 box-border max-w-[760px] border border-solid border-(--ink) bg-(--paper-raised) px-6 py-6 md:mt-28 md:px-[52px] md:py-11";

/** The first sentences of a paragraph, enough to start reading. */
function opening(paragraph: string, sentences = 2): string {
  // A full stop inside a number ("365.2422") is not followed by a space, so it is skipped.
  const ends = /[.!?]["’”)]?(?=\s)/g;
  let end = 0;
  for (let i = 0; i < sentences; i += 1) {
    const match = ends.exec(paragraph);
    if (!match) return paragraph;
    end = match.index + match[0].length;
  }
  return paragraph.slice(0, end);
}

type LessonTeaserProps = {
  /** Null while it loads. */
  session: DailySession | null;
  error: AlmanacError | null;
  onRetry: () => void;
};

/** Today's lesson on the landing page: its subject, title and opening lines. */
export function LessonTeaser({ session, error, onRetry }: LessonTeaserProps) {
  if (error) {
    return (
      <Notice
        className="mx-auto mt-16 max-w-[760px] md:mt-28"
        tone="error"
        kicker="Couldn’t load"
        title="Today’s lesson didn’t load."
        body="It’s probably the connection. Nothing was lost."
        primary={{ label: "Try again", onClick: onRetry }}
        secondary={{ label: "or open the lesson", href: "/today/lesson" }}
      />
    );
  }

  if (!session) {
    return (
      <section aria-label="Today’s lesson" aria-busy="true" className={CARD}>
        <p className="sr-only" role="status">
          Loading today’s lesson
        </p>
        <div aria-hidden="true" className="flex flex-col gap-3">
          <span className="h-3 w-32 bg-(--paper-sunk)" />
          <span className="mt-2 h-10 w-[70%] bg-(--paper-sunk)" />
          <span className="mt-3 h-[14px] bg-(--paper-sunk)" />
          <span className="h-[14px] w-[62%] bg-(--paper-sunk)" />
        </div>
      </section>
    );
  }

  const { lesson } = session;
  const done = session.finishedAt !== null;
  const text = lesson.paragraphs?.[0] ? opening(lesson.paragraphs[0]) : null;

  return (
    <section aria-label="Today’s lesson" className={CARD}>
      <div className="flex justify-between gap-3 font-mono text-[12px] uppercase tracking-[0.08em]">
        <span className="text-(--accent)">Today in {lesson.subject}</span>
        <span className="text-(--ink-muted)">{lesson.minutes} min</span>
      </div>
      <h2 className="m-0 mt-4 text-[34px] font-medium leading-[1.02] tracking-[-0.02em] md:text-[52px]">{lesson.title}</h2>
      {text ? (
        <p className="m-0 mt-5 text-[18px] leading-[1.6] text-(--ink-soft) md:text-[21px]">
          <span aria-hidden="true" className="float-left pr-[10px] pt-[6px] text-[58px] font-medium leading-[0.82] text-(--ink) md:text-[72px]">
            {text[0]}
          </span>
          <span className="sr-only">{text[0]}</span>
          {text.slice(1)}
        </p>
      ) : (
        // Nobody has opened today's lesson yet, so there is no text to quote.
        <p className="m-0 mt-5 text-[18px] leading-[1.6] text-(--ink-soft) md:text-[21px]">
          Three short paragraphs and a quick check. About three minutes.
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid border-(--rule) pt-4">
        <span className="text-[16px] italic text-(--ink-muted)">
          {done ? "You finished this one today." : "Two more paragraphs, then a quick check."}
        </span>
        <Link
          href={done ? "/today/lesson?read=1" : "/today/lesson"}
          className="group inline-flex min-h-11 items-center gap-2 font-mono text-[14px] text-(--ink) underline-offset-4"
        >
          {done ? "Read it again" : "Keep reading"}
          <ArrowIcon size={16} className="group-hover:text-(--accent)" />
        </Link>
      </div>
    </section>
  );
}
