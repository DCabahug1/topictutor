"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";

/** The link back, under the masthead: to the Library from a series, to the series from a lesson. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex min-h-11 items-center gap-2 font-mono text-[13px] text-(--ink) no-underline hover:text-(--accent) md:mt-5"
    >
      <BackIcon size={16} />
      {children}
    </Link>
  );
}

export function SeriesLoading({ label }: { label: string }) {
  return (
    <PaperPage current="library">
      <div aria-busy="true" className="mt-(--lead-top)">
        <p role="status" className="sr-only">
          {label}
        </p>
        <div aria-hidden="true" className="flex flex-col gap-3">
          <span className="h-3 w-40 bg-(--paper-sunk)" />
          <span className="mt-2 h-10 w-[70%] bg-(--paper-sunk)" />
          <span className="h-4 w-[52%] bg-(--paper-sunk)" />
        </div>
      </div>
    </PaperPage>
  );
}

type SeriesProblemProps = {
  /** True when the series or lesson does not exist. Otherwise it failed to load. */
  notFound: boolean;
  what: "series" | "lesson" | "check";
  /** Loads again. Needed when it failed to load. */
  onRetry?: () => void;
};

const DIDNT_LOAD = {
  series: "This series didn’t load.",
  lesson: "This lesson didn’t load.",
  check: "This Mastery Check didn’t load.",
};

/** Not found, or failed to load. Guests get ways out that don't need an account. */
export function SeriesProblem({ notFound, what, onRetry }: SeriesProblemProps) {
  const user = useSession();
  const sample = { label: "Open the sample series", href: "/series/sample" };
  const start = { label: "Back to the start", href: "/" };

  let notice: ReactNode;
  if (!notFound) {
    notice = (
      <Notice
        tone="error"
        headingLevel={1}
        kicker="Couldn’t load"
        title={DIDNT_LOAD[what]}
        body="It’s probably the connection. Nothing was lost."
        primary={{ label: "Try again", onClick: onRetry }}
        secondary={user ? { label: "Go to Library", href: "/library" } : start}
      />
    );
  } else if (what === "lesson") {
    notice = (
      <Notice
        tone="info"
        headingLevel={1}
        kicker="Not found"
        title="This lesson isn’t here."
        body="The link may be mistyped, or the lesson belongs to another account."
        primary={user ? { label: "Go to Today", href: "/today" } : start}
        secondary={user ? { label: "Go to your Library", href: "/library" } : sample}
      />
    );
  } else {
    notice = (
      <Notice
        tone="info"
        headingLevel={1}
        kicker="Not found"
        title="This series isn’t here."
        body="It may have been deleted, or the link is from another account."
        primary={user ? { label: "Go to Library", href: "/library" } : { label: "Start a series", href: "/series/new" }}
        secondary={user ? { label: "Start a series", href: "/series/new" } : sample}
      />
    );
  }

  return (
    <PaperPage current="library">
      <div className="mt-(--lead-top) max-w-[780px]">{notice}</div>
    </PaperPage>
  );
}
