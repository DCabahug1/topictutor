"use client";

import type { ReactNode } from "react";
import { PaperPage } from "@/components/almanac/Page";

/**
 * The frame for log in, register and password reset: the masthead and a single
 * 480px column holding eyebrow, heading, an optional error, Google, the fields
 * and one full-width primary.
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <PaperPage tabs={false}>
      <div className="mx-auto mt-14 max-w-[480px] md:mt-[100px]">{children}</div>
    </PaperPage>
  );
}
