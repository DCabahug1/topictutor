"use client";

import { createContext, useContext, type ReactNode } from "react";
import { setFixtureScope } from "@/lib/almanac/fixture-source";

export type SessionUser = {
  id: string;
  email: string;
  /** May be empty: fall back to the email. */
  name: string;
  imageUrl: string | null;
  /** The profiles row id, needed to save the name or photo. Null if the row is missing. */
  profileId: string | null;
};

const SessionContext = createContext<SessionUser | null>(null);

/** Set once by the (almanac) layout from the server, so pages never fetch the profile themselves. */
export function SessionProvider({ user, children }: { user: SessionUser | null; children: ReactNode }) {
  // Guests and each signed-in learner keep separate sample progress.
  setFixtureScope(user?.id ?? null);
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** The signed-in learner, or null for a guest. */
export function useSession(): SessionUser | null {
  return useContext(SessionContext);
}
