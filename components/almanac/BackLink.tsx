"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { cx } from "./cx";
import { entryPath } from "./entry";
import { BackIcon } from "./icons";

type BackLinkProps = {
  /** Where it goes, and where it falls back to when there's no page of ours to go back to. */
  href: string;
  children: ReactNode;
  /**
   * Go back in history instead, when the learner came here from another page of
   * ours, so it returns wherever they were. Opened straight from a link or a new
   * tab, it still goes to `href`.
   */
  history?: boolean;
  className?: string;
};

/**
 * Came here from a page of this site, in this tab: moved on from the page the tab
 * opened on, or opened this one from a link on the site. (The referrer alone
 * isn't enough: moving between pages in the app doesn't change it.)
 */
function cameFromHere(): boolean {
  if (window.history.length <= 1) return false;
  if (entryPath !== null && `${window.location.pathname}${window.location.search}` !== entryPath) return true;
  try {
    return document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** The link back, under the masthead: to the Library from a series, to the series from a lesson, and so on. */
export function BackLink({ href, children, history = false, className }: BackLinkProps) {
  const router = useRouter();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let a new tab or window open the plain link.
    if (!history || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    if (!cameFromHere()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "mt-4 inline-flex min-h-11 items-center gap-2 font-label text-[13px] text-(--ink) no-underline hover:text-(--accent) md:mt-5",
        className
      )}
    >
      <BackIcon size={16} />
      {children}
    </Link>
  );
}
