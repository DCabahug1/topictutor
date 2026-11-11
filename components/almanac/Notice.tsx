import type { ReactNode } from "react";
import { Button } from "./Button";
import { cx } from "./cx";
import { LeadActions } from "./LeadBlock";

type NoticeAction = { label: string; href?: string; onClick?: () => void; busy?: boolean };

type NoticeProps = {
  /** error: something went wrong. info: a limit, a missing page, an expired link. */
  tone: "error" | "info";
  /** The label line on top, for example "Didn’t finish writing". */
  kicker: string;
  /** What happened, in plain words. No error codes. */
  title: string;
  /** What to do next, in one or two sentences. */
  body?: ReactNode;
  /** Names what was kept, for example "Your streak is safe." It sits under a hairline. */
  kept?: string;
  /** The one next step, usually "Try again". */
  primary?: NoticeAction;
  /** The quiet way out. It reads as "or …". */
  secondary?: NoticeAction;
  /** h1 when the notice is the page, h2 inside a page that has its own title. */
  headingLevel?: 1 | 2;
  className?: string;
};

/** "Go to Library" becomes "or go to Library", so every way out reads as a quiet link. */
function quiet(label: string): string {
  return label.startsWith("or ") ? label : `or ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

/**
 * A screen or block for things that went wrong or ran out: a lead block with
 * one primary (usually "Try again") and a quiet way out. Every one offers a next step.
 */
export function Notice({ tone, kicker, title, body, kept, primary, secondary, headingLevel = 2, className }: NoticeProps) {
  const error = tone === "error";
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div role={error ? "alert" : "status"} className={cx("max-w-[720px]", className)}>
      <p className={cx("t-eyebrow m-0", error ? "text-(--incorrect)!" : "text-(--ink-muted)!")}>
        {error ? "✕ " : ""}
        {kicker}
      </p>
      <Heading
        className={cx(
          "after-eyebrow m-0 font-medium [overflow-wrap:anywhere]",
          headingLevel === 1 ? "t-lead-h1-sm" : "text-[28px] leading-[1.1] tracking-[-0.015em] md:text-[36px]"
        )}
      >
        {title}
      </Heading>
      {body && <p className={cx("m-0 mt-5 max-w-[560px]", headingLevel === 1 ? "t-lead" : "text-[18px] leading-normal text-(--ink-soft)")}>{body}</p>}
      {(primary || secondary) && (
        <LeadActions
          className={headingLevel === 1 ? undefined : "mt-7!"}
          primary={
            primary && (
              <Button icon href={primary.href} onClick={primary.onClick} busy={primary.busy}>
                {primary.label}
              </Button>
            )
          }
          quiet={
            secondary && (
              <Button variant="quiet" href={secondary.href} onClick={secondary.onClick} busy={secondary.busy}>
                {quiet(secondary.label)}
              </Button>
            )
          }
        />
      )}
      {kept && (
        <p className="m-0 mt-14 max-w-[560px] border-0 border-t border-solid border-(--rule) pt-6 text-[17px] italic text-(--ink-muted)">
          {kept}
        </p>
      )}
    </div>
  );
}
