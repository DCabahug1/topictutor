"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";
import { BottomTabs, Masthead, type MainSection } from "./Masthead";
import { SessionBar } from "./SessionBar";
import { useSession } from "./SessionProvider";

type PaperPageProps = {
  /** The section to mark as current in the masthead and the phone tab bar. */
  current?: MainSection;
  /** Shows the date line under the masthead. */
  dateline?: boolean;
  /** False hides the phone tab bar, for pages that pin their own actions there. */
  tabs?: boolean;
  children: ReactNode;
};

/**
 * The frame for every page outside a session: gutters, the 1296px content
 * width, the masthead, and the bottom tabs for signed-in learners on phones.
 */
export function PaperPage({ current, dateline, tabs = true, children }: PaperPageProps) {
  const session = useSession();
  const user = tabs ? session : null;
  return (
    <div className={cx("min-h-dvh px-6 md:px-[clamp(24px,5vw,72px)]", user ? "pb-[88px] md:pb-[72px]" : "pb-12 md:pb-[72px]")}>
      <div className="mx-auto max-w-[1296px]">
        <Masthead current={current} dateline={dateline} />
        <main>{children}</main>
      </div>
      {user && <BottomTabs current={current} />}
    </div>
  );
}

/**
 * The actions that close a page. On phones they are pinned to the bottom of the
 * screen; from 768px they sit in the page under a 3px rule, with a note beside them.
 * Give the page enough bottom padding (pb-40 on phones) so nothing hides behind the bar.
 */
export function PinnedActions({ note, children }: { note?: ReactNode; children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-0 border-t border-solid border-(--rule) bg-(--paper) px-6 pb-[22px] pt-[14px] md:static md:mt-8 md:flex md:flex-wrap md:items-center md:justify-between md:gap-[14px] md:border-t-[3px] md:border-(--ink) md:bg-transparent md:px-0 md:pb-0 md:pt-[18px]">
      {note && <div className="t-note mb-2 text-(--ink-muted) md:mb-0 md:text-[17px]">{note}</div>}
      <div className="flex flex-col-reverse gap-[6px] md:flex-row md:flex-wrap md:gap-[10px] max-md:[&>*]:w-full">{children}</div>
    </div>
  );
}

type SessionPageProps = {
  leaveHref?: string;
  onLeave?: () => void;
  leaveLabel?: string;
  /** Sits under the bar, full width of the reading column: usually SessionProgress. */
  rail?: ReactNode;
  /**
   * The actions for this step. On phones they are pinned to the bottom of the
   * screen; from 768px they close the reading column under a 3px rule.
   */
  footer?: ReactNode;
  /** A line beside the actions on desktop, for example what comes next. */
  footerNote?: ReactNode;
  /** False keeps the actions to the phone footer, when the desktop page offers them another way. */
  footerDesktop?: boolean;
  /** Change it to replay the step transition, for example the step name. */
  stepKey?: string;
  /** wide drops the 680px reading column for two-column test layouts. */
  width?: "reading" | "wide";
  children: ReactNode;
};

/**
 * The frame for the daily session, series lessons and tests: the session bar,
 * a centred reading column and the step's actions.
 */
export function SessionPage({
  leaveHref,
  onLeave,
  leaveLabel,
  rail,
  footer,
  footerNote,
  footerDesktop = true,
  stepKey,
  width = "reading",
  children,
}: SessionPageProps) {
  const column = width === "reading" ? "mx-auto max-w-[680px]" : "mx-auto max-w-[1296px]";
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-2 md:px-[clamp(24px,5vw,72px)]">
        <SessionBar leaveHref={leaveHref} onLeave={onLeave} leaveLabel={leaveLabel} />
      </div>
      <div className="flex-auto px-6 pb-6 md:px-[clamp(24px,5vw,72px)] md:pb-[72px]">
        <div className={column}>
          {rail && <div className="mt-1 md:mt-6">{rail}</div>}
          <main key={stepKey} className="almanac-rise">
            {children}
          </main>
          {footer && footerDesktop && (
            <div className="mt-12 hidden flex-wrap items-center justify-between gap-4 border-0 border-t-[3px] border-solid border-(--ink) pt-5 md:flex">
              <div className="t-note min-w-0 flex-[1_1_240px] text-(--ink-muted)">{footerNote}</div>
              <div className="flex flex-wrap items-center gap-3">{footer}</div>
            </div>
          )}
        </div>
      </div>
      {footer && (
        <footer className="sticky bottom-0 z-10 flex flex-col gap-[6px] border-0 border-t border-solid border-(--rule) bg-(--paper) px-6 pb-[22px] pt-[14px] md:hidden [&>*]:w-full">
          {footer}
        </footer>
      )}
    </div>
  );
}
