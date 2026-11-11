"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionProvider, type SessionUser } from "@/components/almanac/SessionProvider";
import LibraryPage from "../../library/page";
import { StatsScreen } from "../../stats/components/StatsScreen";
import TodayPage from "../../today/page";

const SAMPLE: SessionUser = {
  id: "dev-preview",
  email: "duane@example.com",
  name: "Duane Cabahug",
  imageUrl: null,
  profileId: null,
};

const SCREENS = { today: TodayPage, library: LibraryPage, stats: StatsScreen } as const;

/**
 * /dev/signed-in?screen=today|library|stats (add &view=profile for Profile).
 * Uses the sample data as a signed-in learner twelve days into a streak. Links
 * leave the preview, because the real pages need an account.
 */
export function SignedInPreview() {
  return (
    <Suspense fallback={null}>
      <Preview />
    </Suspense>
  );
}

function Preview() {
  const name = useSearchParams().get("screen");
  const Screen = SCREENS[(name ?? "today") as keyof typeof SCREENS] ?? TodayPage;
  return (
    <SessionProvider user={SAMPLE}>
      <Screen />
    </SessionProvider>
  );
}
