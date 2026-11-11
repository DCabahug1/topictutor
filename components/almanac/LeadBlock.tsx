import type { ReactNode } from "react";
import { cx } from "./cx";

type LeadBlockProps = {
  /** One label line in accent, for example "Science · about 3 minutes". */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** lg for the first screen of a section, sm for long titles and inner pages. */
  size?: "lg" | "sm";
  /** At most one supporting sentence. */
  line?: ReactNode;
  /** A hero number above the title, when the number is the point (streak, score). */
  numeral?: ReactNode;
  /** Sits between the line and the actions, for example a progress meter. */
  children?: ReactNode;
  /** The one primary button. */
  primary?: ReactNode;
  /**
   * One outline button for a real second path (go deeper, retake). Use it instead of
   * a second quiet link, so the two choices don't look alike.
   */
  secondary?: ReactNode;
  /** Quiet "or …" links beside the primary: leaving, going back, looking again. */
  quiet?: ReactNode;
  /** Id for the heading, so a section can be labelled by it. */
  headingId?: string;
  /** Lets the heading take focus when a step changes. */
  focusRef?: React.Ref<HTMLHeadingElement>;
  className?: string;
};

/**
 * The opening of every screen: eyebrow, the biggest heading on the page, one
 * sentence, then the one button. Space below it does the grouping.
 */
export function LeadBlock({
  eyebrow,
  title,
  size = "lg",
  line,
  numeral,
  children,
  primary,
  secondary,
  quiet,
  headingId,
  focusRef,
  className,
}: LeadBlockProps) {
  return (
    <div className={cx("lead-rise min-w-0", className)}>
      {eyebrow && <p className="t-eyebrow m-0">{eyebrow}</p>}
      {numeral && <div className={eyebrow ? "after-eyebrow" : undefined}>{numeral}</div>}
      <h1
        id={headingId}
        ref={focusRef}
        tabIndex={focusRef ? -1 : undefined}
        className={cx(
          size === "lg" ? "t-lead-h1" : "t-lead-h1-sm",
          "m-0 text-(--ink) [overflow-wrap:anywhere]",
          numeral ? "mt-6" : eyebrow ? "after-eyebrow" : undefined
        )}
      >
        {title}
      </h1>
      {line && <p className="t-lead m-0 mt-[22px] max-w-[560px]">{line}</p>}
      {children && <div className="mt-7">{children}</div>}
      {(primary || secondary || quiet) && <LeadActions primary={primary} secondary={secondary} quiet={quiet} />}
    </div>
  );
}

/**
 * The primary button, an optional outline button, then quiet links.
 * Buttons are full width on phones; a row from 768px.
 */
export function LeadActions({
  primary,
  secondary,
  quiet,
  className,
}: {
  primary?: ReactNode;
  secondary?: ReactNode;
  quiet?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mt-(--action-gap) flex flex-col items-stretch gap-x-7 gap-y-[14px] md:flex-row md:flex-wrap md:items-center",
        "max-md:[&>a]:w-full max-md:[&>button]:w-full",
        className
      )}
    >
      {primary}
      {secondary}
      {quiet && <div className="flex flex-wrap items-center gap-x-6 gap-y-1 max-md:justify-center">{quiet}</div>}
    </div>
  );
}
