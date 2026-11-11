"use server";

import { adoptGuest, recordPendingAdoption } from "./almanac/server/adopt";
import { createClient } from "@/utils/supabase/server";

export type SignUpResult = { success: true } | { success: false; error: { code: string; message: string } };

/**
 * Creates an account by email. When it's made from a guest session, the guest
 * is recorded against the new account, so their progress moves over once the
 * confirmation link is opened, or at the first log-in on any device.
 */
export async function signUpWithEmailAndPasswordAction(
  email: string,
  password: string,
  name?: string | null,
  origin?: string
): Promise<SignUpResult> {
  const supabase = await createClient();
  const { data: before } = await supabase.auth.getClaims();
  const guestId = before?.claims?.is_anonymous && typeof before.claims.sub === "string" ? before.claims.sub : null;

  const query = name ? `?name=${encodeURIComponent(name)}` : "";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin ?? ""}/auth/callback${query}` },
  });

  if (error || !data.user) {
    return { success: false, error: { code: error?.code ?? "", message: error?.message ?? "" } };
  }

  if (guestId) {
    // With email confirmation off the account is signed in already, so the progress moves now.
    if (data.session) await adoptGuest(guestId, data.user.id);
    else await recordPendingAdoption(data.user.id, guestId);
  }
  return { success: true };
}
