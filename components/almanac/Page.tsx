"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";
import { LeadActions } from "./LeadBlock";
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
 * The frame for every page outside a session: gutters, the 1200px content
 * width, the masthead, and the bottom tabs for signed-in learners on phones.
 */
export function PaperPage({ current, dateline, tabs = true, children }: PaperPageProps) {
  const session = useSession();
  const user = tabs ? session : null;
  return (
    <div className={cx("min-h-dvh px-(--gutter)", user ? "pb-[120px] md:pb-24" : "pb-16 md:pb-24")}>
      <div className="mx-auto max-w-(--content-max)">
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
  /** Sits under the bar, the width of the reading column: usually a StepMeter. */
  rail?: ReactNode;
  /** The step's one primary button. It closes the column under a hairline. */
  footer?: ReactNode;
  /** Quiet "or …" links beside the primary. */
  footerQuiet?: ReactNode;
  /** One italic line above the button, for example what comes next. */
  footerNote?: ReactNode;
  /** Kept for callers; the actions now sit in the page at every width. */
  footerDesktop?: boolean;
  /** Change it to replay the step transition, for example the step name. */
  stepKey?: string;
  /** reading is the 720px column for lessons, checks and tests. wide is 960px, for the finish. */
  width?: "reading" | "wide";
  children: ReactNode;
};

/**
 * The frame for the daily session, series lessons and tests: the session bar,
 * a centred reading column and the step's one next action.
 */
export function SessionPage({
  leaveHref,
  onLeave,
  leaveLabel,
  rail,
  footer,
  footerQuiet,
  footerNote,
  stepKey,
  width = "reading",
  children,
}: SessionPageProps) {
  const column = cx("mx-auto w-full", width === "reading" ? "max-w-(--reading-col)" : "max-w-[960px]");
  return (
    <div className="flex min-h-dvh flex-col px-(--gutter) pb-16 md:pb-24">
      <SessionBar leaveHref={leaveHref} onLeave={onLeave} leaveLabel={leaveLabel} />
      {rail && <div className="mx-auto mt-2 w-full max-w-(--reading-col)">{rail}</div>}
      <div className={column}>
        <main key={stepKey} className="almanac-rise mt-12 md:mt-[88px]">
          {children}
        </main>
        {footer && (
          <div className="mt-14 border-0 border-t border-solid border-(--ink) pt-5 md:mt-16 md:pt-7">
            {footerNote && <div className="m-0 text-[17px] italic text-(--ink-muted) md:text-[18px]">{footerNote}</div>}
            <LeadActions primary={footer} quiet={footerQuiet} className={footerNote ? undefined : "mt-0!"} />
          </div>
        )}
      </div>
    </div>
  );
}
