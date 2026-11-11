"use server";

import { adoptGuest, recordPendingAdoption } from "./almanac/server/adopt";
import { callbackPath } from "./next-path";
import { createAdminClient } from "@/utils/supabase/admin";
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
  origin?: string,
  /** Where to go once the confirmation link is opened, for example the series they asked for. */
  next?: string | null
): Promise<SignUpResult> {
  const supabase = await createClient();
  const { data: before } = await supabase.auth.getClaims();
  const guestId = before?.claims?.is_anonymous && typeof before.claims.sub === "string" ? before.claims.sub : null;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin ?? ""}${callbackPath({ name, next })}` },
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

const PHOTO_BUCKET = "profile_files";

/** Every file path under a folder in the photo bucket, including nested folders. */
async function listPhotoFiles(folder: string): Promise<string[]> {
  const storage = createAdminClient().storage.from(PHOTO_BUCKET);
  const paths: string[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await storage.list(folder, { limit: pageSize, offset });
    if (error) throw error;
    for (const item of data) {
      const path = `${folder}/${item.name}`;
      // Folders come back without an id.
      if (item.id === null) paths.push(...(await listPhotoFiles(path)));
      else paths.push(path);
    }
    if (data.length < pageSize) return paths;
  }
}

/**
 * Deletes the signed-in learner's account for good. Their photos go first, since
 * storage isn't cascaded; every table row goes with the auth user. If the photos
 * can't be removed, nothing else is touched.
 */
export async function deleteAccountAction(): Promise<{ success: true } | { success: false }> {
  const supabase = await createClient();
  // The verified user, not the cookie's claims.
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;
  if (error || !user || user.is_anonymous) return { success: false };

  try {
    const admin = createAdminClient();
    const files = await listPhotoFiles(user.id);
    if (files.length) {
      const { error: removeError } = await admin.storage.from(PHOTO_BUCKET).remove(files);
      if (removeError) throw removeError;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
  } catch (cause) {
    console.error("Couldn't delete account", cause);
    return { success: false };
  }

  // The user is gone already, so a failed sign-out only leaves stale cookies behind.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  return { success: true };
}
