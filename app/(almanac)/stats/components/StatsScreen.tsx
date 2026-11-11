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
      <div role="tablist" aria-label="Stats and profile" onKeyDown={onKeyDown} className="mt-5 flex gap-7">
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
                "min-h-11 cursor-pointer border-0 border-b-2 border-solid bg-transparent px-0 font-mono text-[13px] text-(--ink) transition-colors duration-(--duration-instant) ease-out",
                selected ? "border-(--accent)" : "border-transparent hover:text-(--accent)"
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id="stats-panel" aria-labelledby={`stats-tab-${view}`}>
        {view === "stats" ? (
          <StatsView />
        ) : user ? (
          <ProfileView user={user} />
        ) : (
          // The middleware sends guests to log in first, so this is a fallback.
          <Notice
            className="mt-(--lead-top) max-w-[780px]"
            tone="info"
            kicker="Signed out"
            title="Log in to see your profile."
            body="Your name, photo and subjects live in your account."
            primary={{ label: "Log in", href: "/login" }}
            secondary={{ label: "or open today’s lesson", href: "/today/lesson" }}
          />
        )}
      </div>
    </PaperPage>
  );
}
