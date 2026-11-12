"use client";

import type { ReactNode } from "react";
import { BackLink } from "@/components/almanac/BackLink";
import { PaperPage } from "@/components/almanac/Page";

/**
 * The frame for log in, register and password reset: the masthead and a single
 * 480px column holding eyebrow, heading, an optional error, Google, the fields
 * and one full-width primary.
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <PaperPage tabs={false}>
      {/* Back to wherever sent them here (a lesson, the account offer), or the start. */}
      <BackLink href="/" history>
        Back
      </BackLink>
      <div className="mx-auto mt-8 max-w-[480px] md:mt-16">{children}</div>
    </PaperPage>
  );
}
