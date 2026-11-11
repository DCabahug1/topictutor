"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { almanac } from "@/lib/almanac";
import { authService } from "@/lib/auth";
import { cx } from "./cx";
import { ChevronDownIcon } from "./icons";
import { useSession, type SessionUser } from "./SessionProvider";
import { ThemeButton } from "./ThemeButton";

export type MainSection = "today" | "library" | "stats";

const SECTIONS: Array<{ id: MainSection; label: string; href: string }> = [
  { id: "today", label: "Today", href: "/today" },
  { id: "library", label: "Library", href: "/library" },
  { id: "stats", label: "Stats", href: "/stats" },
];

/** "Tuesday, November 10 · Day 314 of 365", in the learner's own timezone. */
function todayLine() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - start.getTime()) / 86400000);
  const leap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `${date} · Day ${day} of ${leap ? 366 : 365}`;
}

const neverChanges = () => () => {};

export function Dateline({ className }: { className?: string }) {
  // Blank on the server, which doesn't know the learner's date.
  const line = useSyncExternalStore(neverChanges, todayLine, () => " ");
  return <p className={cx("t-label m-0 font-normal! text-(--ink-muted)", className)}>{line}</p>;
}

function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const display = user.name || user.email;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    await authService.signOut();
    window.location.assign("/");
  };

  const moveFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = (at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${display}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 cursor-pointer items-center gap-2 border-0 bg-transparent pl-2 pr-1 text-(--ink)"
      >
        {user.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-(--radius-full) object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-(--radius-full) bg-(--ink) font-serif text-[17px] font-medium text-(--on-ink)"
          >
            {display[0]?.toUpperCase()}
          </span>
        )}
        <ChevronDownIcon size={14} className="hidden md:block" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          onKeyDown={moveFocus}
          className="absolute right-0 top-[52px] z-20 w-60 border-[1.5px] border-solid border-(--ink) bg-(--paper-raised)"
        >
          <p
            title={display}
            className="m-0 truncate border-0 border-b border-solid border-(--rule) px-4 py-[14px] text-[16px]"
          >
            {display}
            {user.name && (
              <small title={user.email} className="block truncate font-mono text-[12px] text-(--ink-muted)">
                {user.email}
              </small>
            )}
          </p>
          <Link
            role="menuitem"
            href="/stats?view=profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 font-mono text-[14px] text-(--ink) no-underline hover:bg-(--paper-sunk)"
          >
            Profile
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            className="block w-full cursor-pointer border-0 bg-transparent px-4 py-3 text-left font-mono text-[14px] text-(--ink) hover:bg-(--paper-sunk)"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

type MastheadProps = {
  /** Underlines the current section for a signed-in learner. */
  current?: MainSection;
  /** Shows the date line under the double rule. */
  dateline?: boolean;
  /** Overrides the session, for the component gallery. Leave unset in pages. */
  user?: SessionUser | null;
  /** Overrides the guest's streak, for the component gallery. Leave unset in pages. */
  guestStreak?: number;
};

/**
 * The top of every page outside a session: the name, account navigation and
 * the theme button, closed by the double rule.
 */
export function Masthead({ current, dateline = false, user: userProp, guestStreak: guestStreakProp }: MastheadProps) {
  const session = useSession();
  const user = userProp === undefined ? session : userProp;
  const [storedStreak, setStoredStreak] = useState(0);

  useEffect(() => {
    if (user || guestStreakProp !== undefined) return;
    let current = true;
    almanac
      .getGuestState()
      .then((guest) => {
        if (current && guest.hasProgress) setStoredStreak(Math.max(guest.streak, 1));
      })
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [user, guestStreakProp]);

  const guestStreak = guestStreakProp ?? storedStreak;

  return (
    <div>
      <header className="flex items-center justify-between gap-3 pb-2 pt-[6px] md:pb-[14px] md:pt-[18px]">
        <Link
          href={user ? "/today" : "/"}
          className="text-[24px] font-semibold tracking-[-0.015em] text-(--ink) no-underline md:text-[28px]"
        >
          TopicTutor
        </Link>
        <nav aria-label="Main" className="flex items-center gap-[2px] font-mono text-[14px]">
          {user ? (
            <>
              {SECTIONS.map((section) => (
                <Link
                  key={section.id}
                  href={section.href}
                  aria-current={current === section.id ? "page" : undefined}
                  className={cx(
                    "hidden p-3 text-(--ink) md:block",
                    current === section.id
                      ? "underline decoration-(--accent) decoration-2 underline-offset-[6px]"
                      : "no-underline hover:underline hover:underline-offset-[6px]"
                  )}
                >
                  {section.label}
                </Link>
              ))}
              <ThemeButton />
              <AccountMenu user={user} />
            </>
          ) : guestStreak > 0 ? (
            <>
              <span className="t-note mr-3 hidden text-(--ink-muted) lg:inline">
                Your {guestStreak}-day streak lives in this browser.
              </span>
              <Link
                href="/welcome/account"
                className="border-[1.5px] border-solid border-(--ink) px-[10px] py-2 text-[12px] text-(--ink) no-underline hover:bg-(--paper-sunk) md:px-[14px] md:py-[10px] md:text-[14px]"
              >
                <span className="md:hidden">Keep streak</span>
                <span className="hidden md:inline">Keep it · create account</span>
              </Link>
              <ThemeButton />
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-3 text-[13px] text-(--ink) no-underline md:px-3 md:text-[14px]">
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden border-[1.5px] border-solid border-(--ink) px-[14px] py-[10px] text-(--ink) no-underline hover:bg-(--paper-sunk) sm:block"
              >
                Register
              </Link>
              <ThemeButton />
            </>
          )}
        </nav>
      </header>
      {/* The double rule: 3px ink, 3px gap, 1px ink. */}
      <div aria-hidden="true" className="h-[7px] border-0 border-b border-t-[3px] border-solid border-(--ink)" />
      {dateline && <Dateline className="mt-[10px]" />}
    </div>
  );
}

/** Today, Library, Stats along the bottom of the screen for signed-in learners on phones. */
export function BottomTabs({ current }: { current?: MainSection }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-0 border-t border-solid border-(--ink) bg-(--paper) font-mono text-[12px] uppercase tracking-[0.04em] md:hidden"
    >
      {SECTIONS.map((section) => {
        const isCurrent = current === section.id;
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={isCurrent ? "page" : undefined}
            className={cx(
              "flex min-h-14 items-center justify-center border-0 border-t-[3px] border-solid no-underline",
              isCurrent ? "border-(--accent) font-medium text-(--ink)" : "border-transparent text-(--ink-muted)"
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
