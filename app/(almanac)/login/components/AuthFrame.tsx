"use client";

import type { ReactNode } from "react";
import { Dateline } from "@/components/almanac/Masthead";
import { PaperPage } from "@/components/almanac/Page";
import { almanac, useAlmanac } from "@/lib/almanac";

/**
 * The frame for log in, register and password reset: the masthead, a column
 * for the form, and on wide screens a few lines about what an account keeps.
 */
export function AuthFrame({ children }: { children: ReactNode }) {
  const { data: session } = useAlmanac(() => almanac.getDailySession(), []);

  return (
    <PaperPage tabs={false}>
      <div className="mt-8 flex flex-wrap items-start justify-center gap-x-24 gap-y-12 md:mt-20">
        {/* Decorative, so it stays out of the way of the form for screen readers. */}
        <aside aria-hidden="true" className="hidden max-w-[520px] flex-[1_1_420px] pt-3 lg:block">
          <Dateline className="text-(--accent)!" />
          <p className="m-0 mt-4 text-[56px] font-medium leading-[0.98] tracking-[-0.025em]">
            One thing, learned well, every day.
          </p>
          <p className="m-0 mt-5 text-[19px] leading-[1.55] text-(--ink-soft)">
            Your streak, your series and your past lessons live in your account, on every device. Free, and it stays
            free.
          </p>
          {session && (
            <p className="m-0 mt-7 border-0 border-t border-solid border-(--rule) pt-4 text-[17px] italic text-(--ink-muted)">
              Today in {session.lesson.subject}: {session.lesson.title}
            </p>
          )}
        </aside>
        <div className="min-w-0 max-w-[440px] flex-[1_1_340px]">{children}</div>
      </div>
    </PaperPage>
  );
}
