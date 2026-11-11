import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Moving a guest's progress into an account. A guest is a Supabase anonymous
 * user, and an account is a different user, so the rows move across and the
 * guest is deleted. Where both have the same thing, the account's copy wins.
 *
 * Nothing here ever stops a sign-in: a failure is logged and the account
 * simply starts without the guest's progress.
 */

async function isGuest(id: string): Promise<boolean> {
  const { data, error } = await createAdminClient().auth.admin.getUserById(id);
  return !error && Boolean(data.user?.is_anonymous);
}

/**
 * The account already has lessons or series of its own. Errors read as true, so
 * a guest is never folded in when it can't be told.
 */
export async function hasOwnProgress(userId: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const [daily, finishes, series] = await Promise.all([
      admin.from("daily_progress").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("lesson_finishes").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("series").select("user_id", { count: "exact", head: true }).eq("user_id", userId).eq("is_sample", false),
    ]);
    if (daily.error || finishes.error || series.error) return true;
    return (daily.count ?? 0) + (finishes.count ?? 0) + (series.count ?? 0) > 0;
  } catch {
    return true;
  }
}

/** Moves `guestId`'s progress to `userId` and deletes the guest. */
export async function adoptGuest(guestId: string, userId: string): Promise<boolean> {
  if (!guestId || guestId === userId) return false;
  try {
    // Only an anonymous user is ever folded in and deleted, never a real account.
    if (!(await isGuest(guestId)) || (await isGuest(userId))) return false;
    const admin = createAdminClient();
    const { error } = await admin.rpc("adopt_guest", { p_from: guestId, p_to: userId });
    if (error) throw error;
    const removed = await admin.auth.admin.deleteUser(guestId);
    if (removed.error) console.error("[almanac] adopt: guest not deleted:", removed.error.message);
    return true;
  } catch (cause) {
    console.error("[almanac] adopt:", cause);
    return false;
  }
}

/**
 * Called when an email sign-up is made from a guest session. Recorded against
 * the new account's id, so a confirmation link opened on another device, or a
 * first log-in there, still brings the guest's progress along.
 */
export async function recordPendingAdoption(userId: string, guestId: string): Promise<void> {
  try {
    if (!(await isGuest(guestId))) return;
    const { error } = await createAdminClient()
      .from("pending_adoptions")
      .upsert({ user_id: userId, guest_id: guestId, created_at: new Date().toISOString() });
    // An email that already has an account comes back with a stand-in id that isn't a user: nothing to record.
    if (error && error.code !== "23503") console.error("[almanac] pending adoption:", error.message);
  } catch (cause) {
    console.error("[almanac] pending adoption:", cause);
  }
}

/** Adopts the guest recorded for this account at sign-up, if any. */
export async function adoptPending(userId: string): Promise<boolean> {
  try {
    const { data } = await createAdminClient()
      .from("pending_adoptions")
      .select("guest_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data?.guest_id) return false;
    return adoptGuest(data.guest_id, userId);
  } catch (cause) {
    console.error("[almanac] pending adoption:", cause);
    return false;
  }
}
