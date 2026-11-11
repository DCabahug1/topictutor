"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useRef, type KeyboardEvent } from "react";
import { cx } from "@/components/almanac/cx";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { ProfileView } from "./ProfileView";
import { StatsView } from "./StatsView";

type View = "stats" | "profile";

const VIEWS: Array<{ id: View; label: string; href: string }> = [
  { id: "stats", label: "Stats", href: "/stats" },
  { id: "profile", label: "Profile", href: "/stats?view=profile" },
];

export function StatsScreen() {
  // useSearchParams needs a boundary so the rest of the page can prerender.
  return (
    <Suspense fallback={<PaperPage current="stats">{null}</PaperPage>}>
      <StatsScreenInner />
    </Suspense>
  );
}

function StatsScreenInner() {
  const user = useSession();
  const view: View = useSearchParams().get("view") === "profile" ? "profile" : "stats";
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  // The address changes without a round trip, and useSearchParams follows it.
  const show = (next: View) => {
    const target = VIEWS.find((v) => v.id === next);
    if (target && next !== view) window.history.replaceState(null, "", target.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const at = VIEWS.findIndex((v) => v.id === view);
    const next = (at + (event.key === "ArrowRight" ? 1 : -1) + VIEWS.length) % VIEWS.length;
    show(VIEWS[next].id);
    tabs.current[next]?.focus();
  };

  return (
    <PaperPage current="stats">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 md:mt-9">
        <h1 className="m-0 text-[40px] font-medium leading-none tracking-[-0.025em] md:text-[64px]">
          {view === "stats" ? "Your stats" : "Profile"}
        </h1>
        <div
          role="tablist"
          aria-label="Stats and profile"
          onKeyDown={onKeyDown}
          className="flex border-[1.5px] border-solid border-(--ink)"
        >
          {VIEWS.map((v, i) => {
            const selected = v.id === view;
            return (
              <button
                key={v.id}
                ref={(node) => {
                  tabs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={`stats-tab-${v.id}`}
                aria-selected={selected}
                aria-controls="stats-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => show(v.id)}
                className={cx(
                  "min-h-11 cursor-pointer border-0 border-solid border-(--ink) px-[18px] font-mono text-[14px] transition-colors duration-(--duration-instant) ease-out",
                  i > 0 && "border-l-[1.5px]",
                  selected ? "bg-(--ink) text-(--on-ink)" : "bg-transparent text-(--ink) hover:bg-(--paper-sunk)"
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id="stats-panel" aria-labelledby={`stats-tab-${view}`}>
        {view === "stats" ? (
          <StatsView />
        ) : user ? (
          <ProfileView user={user} />
        ) : (
          // The middleware sends guests to log in first, so this is a fallback.
          <Notice
            className="mt-6 max-w-[720px] md:mt-10"
            tone="info"
            kicker="Signed out"
            title="Log in to see your profile."
            body="Your name, photo and subjects live in your account."
            primary={{ label: "Log in", href: "/login" }}
            secondary={{ label: "Today’s lesson", href: "/today/lesson" }}
          />
        )}
      </div>
    </PaperPage>
  );
}
