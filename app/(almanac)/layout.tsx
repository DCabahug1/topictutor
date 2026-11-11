import { SessionProvider, type SessionUser } from "@/components/almanac/SessionProvider";
import { getProfileByEmailServer } from "@/lib/profiles";
import type { Profile } from "@/lib/models";
import { createClient } from "@/utils/supabase/server";

/** Reads the signed-in learner once, so no Almanac page fetches the profile itself. */
async function readUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user?.email) return null;

    const result = await getProfileByEmailServer(user.email, supabase);
    const profile: Profile | undefined = result.success ? result.data?.[0] : undefined;

    return {
      id: user.id,
      email: user.email,
      name: profile?.name ?? "",
      imageUrl: profile?.image_url ?? null,
      profileId: profile?.id ?? null,
    };
  } catch {
    // No session cookie, or Supabase is unreachable: the page still works for a guest.
    return null;
  }
}

export default async function AlmanacLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await readUser();
  return <SessionProvider user={user}>{children}</SessionProvider>;
}
