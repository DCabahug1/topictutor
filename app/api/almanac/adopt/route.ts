import { NextResponse } from "next/server";
import { adoptPending } from "@/lib/almanac/server/adopt";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 30;

/**
 * After a password log-in: moves in the guest recorded when this account was
 * made by email, if any. A guest who happens to be signed in on this device is
 * never folded into an account that already existed.
 */
export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || claims.is_anonymous || typeof claims.sub !== "string") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await adoptPending(claims.sub);
  return NextResponse.json({ ok: true });
}
