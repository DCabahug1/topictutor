import Link from "next/link";
import { ArrowIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import type { AlmanacError, DailySession } from "@/lib/almanac";

const CARD = "box-border min-w-0 flex-[1_1_320px] border border-solid border-(--ink) bg-(--paper-raised) p-[26px]";
const KICKER = "m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-(--accent)";

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
        className="box-border min-w-0 flex-[1_1_320px]"
        tone="error"
        kicker="Couldn’t load"
        title="Today’s lesson didn’t load."
        body="It’s probably the connection. Nothing was lost."
        primary={{ label: "Try again", onClick: onRetry }}
        secondary={{ label: "Open the lesson", href: "/today/lesson" }}
      />
    );
  }

  if (!session) {
    return (
      <aside aria-label="Today’s lesson" aria-busy="true" className={CARD}>
        <p className={KICKER}>Today’s lesson</p>
        <p className="sr-only" role="status">
          Loading today’s lesson
        </p>
        <div aria-hidden="true" className="mt-4 flex flex-col gap-[10px]">
          <span className="h-8 w-[78%] bg-(--paper-sunk)" />
          <span className="mt-2 h-[14px] bg-(--paper-sunk)" />
          <span className="h-[14px] bg-(--paper-sunk)" />
          <span className="h-[14px] w-[62%] bg-(--paper-sunk)" />
        </div>
      </aside>
    );
  }

  const { lesson } = session;
  const done = session.finishedAt !== null;
  const text = lesson.paragraphs?.[0] ? opening(lesson.paragraphs[0]) : null;

  return (
    <aside aria-label="Today’s lesson" className={CARD}>
      <p className={KICKER}>Today in {lesson.subject}</p>
      <h2 className="m-0 mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.015em]">{lesson.title}</h2>
      {text ? (
        <p className="m-0 mt-[14px] text-[18px] leading-[1.55] text-(--ink-soft)">
          <span
            aria-hidden="true"
            className="float-left pr-[7px] pt-[5px] text-[56px] font-medium leading-[0.82] text-(--ink)"
          >
            {text[0]}
          </span>
          <span className="sr-only">{text[0]}</span>
          {text.slice(1)}
        </p>
      ) : (
        // Nobody has opened today's lesson yet, so there is no text to quote.
        <p className="m-0 mt-[14px] text-[18px] leading-[1.55] text-(--ink-soft)">
          Three short paragraphs and a quick check. About three minutes.
        </p>
      )}
      <Link
        href={done ? "/today/lesson?read=1" : "/today/lesson"}
        className="group mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[14px] text-(--ink) underline underline-offset-4"
      >
        {done ? "Read it again" : text ? "Keep reading" : "Start reading"}
        <ArrowIcon size={16} className="group-hover:text-(--accent)" />
      </Link>
    </aside>
  );
}
