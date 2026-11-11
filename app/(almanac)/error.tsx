"use client";

import { useEffect } from "react";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";

type ErrorPageProps = {
  error: Error & { digest?: string };
  /** Renders the page again. */
  reset: () => void;
};

// Catches anything an Almanac page throws while rendering. Data failures have
// their own notices in each page; this is the net under them.
export default function AlmanacErrorPage({ error, reset }: ErrorPageProps) {
  const user = useSession();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PaperPage>
      <div className="mt-(--lead-top)">
        <Notice
          tone="error"
          headingLevel={1}
          kicker="Couldn’t load"
          title="This page didn’t load."
          body="It’s probably the connection. Nothing was lost."
          primary={{ label: "Try again", onClick: reset }}
          secondary={user ? { label: "Go to Today", href: "/today" } : { label: "Back to the start", href: "/" }}
        />
      </div>
    </PaperPage>
  );
}
