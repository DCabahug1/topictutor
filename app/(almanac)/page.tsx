"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { ArrowIcon } from "@/components/almanac/icons";
import { Dateline } from "@/components/almanac/Masthead";
import { PaperPage } from "@/components/almanac/Page";
import { Reveal, RevealRule } from "@/components/almanac/Reveal";
import { TypedText } from "@/components/almanac/TypedText";
import { useInView } from "@/components/almanac/useInView";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac } from "@/lib/almanac";
import { DeeperStaircase } from "./components/DeeperStaircase";
import { LessonTeaser } from "./components/LessonTeaser";
import { SessionPlayer } from "./components/SessionPlayer";
import { TutorBand } from "./components/TutorBand";

const HEADLINE = [{ text: "Learn a new " }, { text: "topic", em: true }, { text: ", every day." }];

// The front page. A guest starts today's lesson from here; a signed-in learner goes to it too.
export default function LandingPage() {
  const user = useSession();
  const { data: session, error, reload } = useAlmanac(() => almanac.getDailySession(), []);
  const [closingRef, closingInView] = useInView<HTMLDivElement>({ threshold: 0.4 });

  const cta = user ? "Go to today’s lesson" : "Start today’s lesson";
  const ctaHref = user ? "/today" : "/today/lesson";

  const closing = (
    <section className="bg-(--ink) px-(--gutter) pb-8 pt-16 text-(--on-ink) md:pb-10 md:pt-28">
      <div ref={closingRef} className="typed-group mx-auto flex max-w-(--content-max) flex-wrap items-end justify-between gap-8">
        <div>
          <h2 className="m-0 text-[40px] font-medium leading-none tracking-[-0.025em] md:text-[64px]">
            <TypedText segments={[{ text: "Today’s lesson is ready." }]} start={closingInView} delay={150} />
          </h2>
          <p className="typed-after m-0 mt-4 text-[19px] text-(--on-ink)/70">Free. No account, no card.</p>
        </div>
        {/* The primary button the other way round, for the ink ground. */}
        <span className="typed-after max-md:w-full" style={{ ["--i" as string]: 1 }}>
        <Link
          href={ctaHref}
          className="inline-flex min-h-(--button-h) items-center gap-[14px] bg-(--on-ink) px-[30px] font-label text-[15px] text-(--ink) no-underline transition-colors duration-(--duration-instant) ease-out hover:bg-(--accent) hover:text-(--on-ink) max-md:w-full max-md:justify-center"
        >
          {cta}
          <ArrowIcon />
        </Link>
        </span>
      </div>
      <RevealRule className="mx-auto mt-16 h-px max-w-(--content-max) bg-(--on-ink)/25 md:mt-[120px]" />
      <footer className="mx-auto flex max-w-(--content-max) flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-5">
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
      <section className="typed-group pt-16 text-center md:pt-[140px]">
        <Dateline className="almanac-rise font-label! text-[12px]! tracking-[0.1em]!" />
        <h1 className="mx-auto mt-[22px] max-w-[900px] text-[54px] font-medium leading-[0.95] tracking-[-0.03em] md:text-[108px]">
          <TypedText segments={HEADLINE} start delay={350} emClassName="font-normal" />
        </h1>
        <p className="typed-after t-lead mx-auto mt-7 max-w-[460px]">A three-minute lesson from the subjects you choose.</p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <span className="typed-after max-md:w-full" style={{ ["--i" as string]: 1 }}>
            <Button icon href={ctaHref} className="max-md:w-full">
              {cta}
            </Button>
          </span>
          <span className="typed-after" style={{ ["--i" as string]: 2 }}>
            <Button variant="quiet" href="/series/new" className="text-[17px]!">
              or build a series on anything
            </Button>
          </span>
        </div>
      </section>

      <Reveal>
        <LessonTeaser session={session} error={error} onRetry={reload} />
      </Reveal>
      <SessionPlayer />
      <DeeperStaircase />
    </PaperPage>
  );
}
