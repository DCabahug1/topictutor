import type { Metadata } from "next";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { SessionProvider, type SessionUser } from "@/components/almanac/SessionProvider";
import type { Profile } from "@/lib/models";
import { getProfileByEmailServer } from "@/lib/profiles";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = { title: "Not found · TopicTutor" };

// This page renders outside the Almanac layout, so it reads the learner itself.
// Without it a signed-in learner would see the guest masthead here.
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
    return null;
  }
}

export default async function NotFound() {
  const user = await readUser();
  return (
    <SessionProvider user={user}>
      <PaperPage>
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          <Notice
            tone="info"
            headingLevel={1}
            kicker="Not found"
            title="This page isn’t here."
            body="The link may be mistyped, or the page belongs to another account."
            primary={user ? { label: "Go to Today", href: "/today" } : { label: "Today’s lesson", href: "/today/lesson" }}
            secondary={user ? { label: "Library", href: "/library" } : { label: "Log in", href: "/login" }}
          />
        </div>
      </PaperPage>
    </SessionProvider>
  );
}
