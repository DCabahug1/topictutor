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
  /** Full-bleed bands after the content, outside the gutters: the landing page's tutor and closing bands. */
  after?: ReactNode;
  children: ReactNode;
};

/**
 * The frame for every page outside a session: gutters, the 1200px content
 * width, the masthead, and the bottom tabs for signed-in learners on phones.
 */
export function PaperPage({ current, dateline, tabs = true, after, children }: PaperPageProps) {
  const session = useSession();
  const user = tabs ? session : null;
  return (
    <div className={cx("min-h-dvh", user && "pb-[88px] md:pb-0")}>
      <div className={cx("px-(--gutter)", !after && "pb-16 md:pb-24")}>
        <div className="mx-auto max-w-(--content-max)">
          <Masthead current={current} dateline={dateline} />
          <main>{children}</main>
        </div>
      </div>
      {after}
      {user && <BottomTabs current={current} />}
    </div>
  );
}

type SessionPageProps = {
  leaveHref?: string;
  onLeave?: () => void;
  leaveLabel?: string;
  leaveIcon?: "close" | "back";
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
  leaveIcon,
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
      <SessionBar leaveHref={leaveHref} onLeave={onLeave} leaveLabel={leaveLabel} leaveIcon={leaveIcon} />
      {rail && <div className="mx-auto mt-2 w-full max-w-(--reading-col)">{rail}</div>}
      <div className={column}>
        <main key={stepKey} className="session-step almanac-rise mt-12 md:mt-[88px]">
          {children}
        </main>
        {(footer || footerNote) && (
          <div className="session-foot mt-14 border-0 border-t border-solid border-(--ink) pt-5 md:mt-16 md:pt-7">
            {footerNote && <div className="m-0 text-[17px] italic text-(--ink-muted) md:text-[18px]">{footerNote}</div>}
            {footer && <LeadActions primary={footer} quiet={footerQuiet} className={footerNote ? undefined : "mt-0!"} />}
          </div>
        )}
      </div>
    </div>
  );
}
