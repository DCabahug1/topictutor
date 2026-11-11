import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

export type LessonRowStatus = "done" | "upNext" | "notStarted";

type LessonRowProps = {
  /** 1 to 5, shown as 01 to 05. Pass `marker` instead for a row that isn't a lesson. */
  number?: number;
  /** Replaces the number, for example "◇" on the Mastery Check row. */
  marker?: ReactNode;
  title: ReactNode;
  /** Kept for callers; lists no longer show descriptions. */
  description?: string;
  /** Why this lesson is in the learner's series. Shown only on the next lesson. */
  why?: string;
  /** True when the lesson is here because its placement question was missed. */
  focus?: boolean;
  /** done: the check is answered, right or wrong. upNext: the lesson the main action opens. */
  status: LessonRowStatus;
  /** An italic line shown whatever the status, for rows like the Mastery Check. */
  sub?: ReactNode;
  /** Replaces the status glyph and word, for example "5 questions · pass with 4". */
  tag?: ReactNode;
  /** Muted title and tag, for a row that is closed for now. */
  muted?: boolean;
  /** Where the row opens. Without it the row is plain text. */
  href?: string;
  className?: string;
};

const TAGS: Record<LessonRowStatus, string> = {
  done: "✓ Done",
  upNext: "○ Up next",
  notStarted: "○ Not started",
};

/**
 * One lesson in a series overview, as a ruled row: number, title, and a glyph
 * plus word. The "why it's here" line shows only on the next lesson. Use inside an `ol`.
 */
export function LessonRow({ number, marker, title, why, status, sub, tag, muted = false, href, className }: LessonRowProps) {
  const upNext = status === "upNext";
  const done = status === "done";
  const line = sub ?? (upNext ? why : undefined);
  const titleClass = cx(
    "block text-[21px] font-medium leading-[1.2] md:text-[25px]",
    done || muted ? "text-(--ink-muted)" : "text-(--ink)"
  );

  return (
    <li
      className={cx(
        "group relative grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-x-5 gap-y-[6px] border-0 border-b border-solid border-(--rule) py-[22px] md:grid-cols-[48px_minmax(0,1fr)_auto]",
        className
      )}
    >
      <span className={cx("font-mono text-[13px]", upNext ? "text-(--accent)" : "text-(--ink-muted)")}>
        {marker ?? String(number ?? 0).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        {href ? (
          <Link
            href={href}
            className={cx(titleClass, "no-underline after:absolute after:inset-0 group-hover:text-(--accent)")}
          >
            {title}
          </Link>
        ) : (
          <span className={titleClass}>{title}</span>
        )}
        {line && <span className="mt-[6px] block max-w-[620px] text-[17px] italic leading-[1.45] text-(--ink-muted)">{line}</span>}
      </span>
      <span
        className={cx(
          "col-start-2 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.06em] md:col-start-auto",
          upNext && !tag ? "text-(--accent)" : "text-(--ink-muted)"
        )}
      >
        {tag ?? TAGS[status]}
      </span>
    </li>
  );
}
