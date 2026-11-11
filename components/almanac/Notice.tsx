import type { ReactNode } from "react";
import { Button } from "./Button";
import { cx } from "./cx";
import { CrossIcon } from "./icons";

type NoticeAction = { label: string; href?: string; onClick?: () => void; busy?: boolean };

type NoticeProps = {
  /** error: something went wrong. info: a limit, a missing page, an expired link. */
  tone: "error" | "info";
  /** The mono line on top, for example "Didn’t finish writing". */
  kicker: string;
  /** What happened, in plain words. No error codes. */
  title: string;
  /** What to do next. */
  body?: ReactNode;
  /** Names what was saved, for example "Your answers are saved." */
  kept?: string;
  /** Errors always offer a retry here. */
  primary?: NoticeAction;
  /** A way to leave. */
  secondary?: NoticeAction;
  /** h2 inside a page that has its own title, h1 when the notice is the page. */
  headingLevel?: 1 | 2;
  className?: string;
};

/** A block for things that went wrong or ran out. Every one offers a next step. */
export function Notice({ tone, kicker, title, body, kept, primary, secondary, headingLevel = 2, className }: NoticeProps) {
  const error = tone === "error";
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div
      role={error ? "alert" : "status"}
      className={cx(
        "border-0 border-t-[3px] border-solid p-5",
        error ? "border-(--incorrect) bg-(--incorrect-wash)" : "border-(--ink) bg-(--paper-raised)",
        className
      )}
    >
      <p className={cx("t-label m-0 flex items-center gap-[6px]", error && "text-(--incorrect)")}>
        {error && <CrossIcon size={13} strokeWidth={2.6} />}
        {kicker}
      </p>
      <Heading className="m-0 mt-[10px] text-[24px] font-medium leading-[1.15]">{title}</Heading>
      {(body || kept) && (
        <p className="m-0 mt-2 text-[16px] leading-normal text-(--ink-soft)">
          {kept && <>{kept} </>}
          {body}
        </p>
      )}
      {(primary || secondary) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primary && (
            <Button size="compact" href={primary.href} onClick={primary.onClick} busy={primary.busy}>
              {primary.label}
            </Button>
          )}
          {secondary && (
            <Button size="compact" variant="secondary" href={secondary.href} onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
