import { NextResponse } from "next/server";
import { z } from "zod";
import { adoptAfterSignIn } from "@/lib/almanac/server/adopt";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 30;

const body = z.object({ guestToken: z.string().max(4096).nullable().optional() });

/**
 * After a password log-in: moves the guest who was signed in on this device
 * into the account. The browser proves it held the guest by sending the
 * guest's access token, which is checked with Supabase, never just read.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims || claims.is_anonymous || typeof claims.sub !== "string") {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = body.safeParse(await request.json().catch(() => ({})));
  const token = parsed.success ? parsed.data.guestToken : null;

  let guestId: string | null = null;
  if (token) {
    const { data: guest } = await createAdminClient().auth.getUser(token);
    if (guest.user?.is_anonymous) guestId = guest.user.id;
  }

  await adoptAfterSignIn(claims.sub, guestId);
  return NextResponse.json({ ok: true });
}
