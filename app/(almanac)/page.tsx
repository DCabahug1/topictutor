"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { DAILY } from "@/lib/almanac/fixtures/content";

// A first cut of the landing page, enough to start the guest flow.
// The full page in docs/design/reference/Landing.dc.html replaces it.
export default function LandingPage() {
  const user = useSession();
  return (
    <PaperPage dateline>
      <section className="max-w-[720px] pt-7 md:pt-12">
        <p className="t-label m-0 text-(--accent)">A new lesson every day · about 3 min</p>
        <h1 className="m-0 mt-4 text-[52px] font-medium leading-[0.96] tracking-[-0.025em] md:text-[96px]">
          Learn one thing <em className="font-normal">well</em>, every day.
        </h1>
        <p className="m-0 mt-[18px] text-[19px] leading-normal text-(--ink-soft) md:text-[21px]">
          A short lesson from the subjects you choose. Recall keeps yesterday from fading. Go Deeper writes a
          series around what you got wrong.
        </p>
        <div className="mt-6 border border-solid border-(--ink) bg-(--paper-raised) p-5">
          <p className="t-label m-0 text-(--accent)">Today in {DAILY.subject}</p>
          <h2 className="m-0 mt-2 text-[30px] font-medium leading-[1.05] tracking-[-0.015em]">{DAILY.title}</h2>
          <p className="m-0 mt-2 text-[16px] leading-[1.45] text-(--ink-muted)">
            Lesson, then a quick check. About three minutes.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Button size="large" icon href={user ? "/today" : "/today/lesson"}>
            {user ? "Go to Today" : "Start today’s lesson"}
          </Button>
          {!user && <p className="m-0 font-mono text-[12px] text-(--ink-muted)">Free · no account needed</p>}
        </div>
        <Link
          href="/series/new"
          className="mt-[18px] inline-block py-[10px] text-[17px] italic text-(--ink) underline-offset-4"
        >
          Or name something you want to learn
        </Link>
      </section>
    </PaperPage>
  );
}
