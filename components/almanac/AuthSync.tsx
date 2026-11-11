"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

/** The account a session belongs to. A guest's anonymous session counts as no account. */
const accountOf = (session: Session | null) =>
  session?.user && !session.user.is_anonymous ? session.user.id : null;

/**
 * Keeps the page in step with the real session. The layout reads the learner
 * once, and moving between pages doesn't read it again, so a sign-out in
 * another tab or on another device, or a session that ran out, would leave a
 * signed-in page behind (an avatar on Log in). When the session's account
 * stops matching the page's, the page is fetched again: the middleware then
 * sends a signed-out learner to log in, and a signed-in one away from it.
 */
export function AuthSync({ userId }: { userId: string | null }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const compare = (session: Session | null) => {
      if (accountOf(session) !== userId) router.refresh();
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION fires on mount with what the page already shows.
      if (event !== "INITIAL_SESSION") compare(session);
    });

    // Coming back to the tab: a session can end while it is hidden without an event here.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      supabase.auth
        .getSession()
        .then(({ data: current }) => compare(current.session))
        .catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, userId]);

  return null;
}
