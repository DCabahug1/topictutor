"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { ArrowIcon } from "@/components/almanac/icons";
import { Dateline } from "@/components/almanac/Masthead";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac } from "@/lib/almanac";
import { DeeperStaircase } from "./components/DeeperStaircase";
import { LessonTeaser } from "./components/LessonTeaser";
import { SessionPlayer } from "./components/SessionPlayer";
import { TutorBand } from "./components/TutorBand";

// The front page. A guest starts today's lesson from here; a signed-in learner goes to it too.
export default function LandingPage() {
  const user = useSession();
  const { data: session, error, reload } = useAlmanac(() => almanac.getDailySession(), []);

  const cta = user ? "Go to today’s lesson" : "Start today’s lesson";
  const ctaHref = user ? "/today" : "/today/lesson";

  const closing = (
    <section className="bg-(--ink) px-(--gutter) pb-8 pt-16 text-(--on-ink) md:pb-10 md:pt-28">
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-end justify-between gap-8">
        <div>
          <h2 className="m-0 text-[40px] font-medium leading-none tracking-[-0.025em] md:text-[64px]">
            Today’s lesson is ready.
          </h2>
          <p className="m-0 mt-4 text-[19px] text-(--on-ink)/70">Free. No account, no card.</p>
        </div>
        {/* The primary button the other way round, for the ink ground. */}
        <Link
          href={ctaHref}
          className="inline-flex min-h-(--button-h) items-center gap-[14px] bg-(--on-ink) px-[30px] font-label text-[15px] text-(--ink) no-underline transition-colors duration-(--duration-instant) ease-out hover:bg-(--accent) hover:text-(--on-ink) max-md:w-full max-md:justify-center"
        >
          {cta}
          <ArrowIcon />
        </Link>
      </div>
      <footer className="mx-auto mt-16 flex max-w-(--content-max) flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-0 border-t border-solid border-(--on-ink)/25 pt-5 md:mt-[120px]">
        <p className="m-0 text-[20px] font-semibold tracking-[-0.015em]">TopicTutor</p>
        <p className="m-0 text-[16px] italic text-(--on-ink)/70">A small daily paper for learning one thing well.</p>
      </footer>
    </section>
  );

  return (
    // No tab bar here: the page's own actions lead to the lesson.
    <PaperPage
      tabs={false}
      after={
        <>
          <div className="h-[112px] md:h-[200px]" />
          <TutorBand />
          {closing}
        </>
      }
    >
      <section className="pt-16 text-center md:pt-[140px]">
        <Dateline className="font-label! text-[12px]! tracking-[0.1em]!" />
        <h1 className="mx-auto mt-[22px] max-w-[900px] text-[54px] font-medium leading-[0.95] tracking-[-0.03em] md:text-[108px]">
          Learn one thing <em className="font-normal">well</em>, every day.
        </h1>
        <p className="t-lead mx-auto mt-7 max-w-[460px]">A three-minute lesson from the subjects you choose.</p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <Button icon href={ctaHref} className="max-md:w-full">
            {cta}
          </Button>
          <Button variant="quiet" href="/series/new" className="text-[17px]!">
            or build a series on anything
          </Button>
        </div>
      </section>

      <LessonTeaser session={session} error={error} onRetry={reload} />
      <SessionPlayer />
      <DeeperStaircase />
    </PaperPage>
  );
}
