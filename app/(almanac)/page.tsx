"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { ArrowIcon } from "@/components/almanac/icons";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac } from "@/lib/almanac";
import { LessonTeaser } from "./components/LessonTeaser";
import { TopicForm } from "./components/TopicForm";

const SECTION = "mt-14 border-0 border-t-[3px] border-solid border-(--ink) md:mt-24";
const SECTION_LABEL = "t-label m-0 mt-[18px] text-(--ink-muted)";
const SAMPLE = "/series/sample";

const STEPS = [
  {
    number: "01",
    title: "A new lesson every day",
    text: "Three short paragraphs and a quick check. About three minutes, then you’re done for the day.",
  },
  {
    number: "02",
    title: "Recall, so it sticks",
    text: "Each session opens with one question from an earlier lesson. Remembering is how learning lasts.",
  },
  {
    number: "03",
    title: "Go deeper, on your gaps",
    text: "A five-question test finds what you don’t know. Your five-lesson series is written around exactly that.",
  },
];

const FEATURES = [
  {
    name: "Daily lessons",
    text: "From the subjects you pick: Math, Science, History, Literature, Finance and more. One a day, rotating.",
  },
  {
    name: "A tutor inside",
    text: "Ask about what you’re reading, or ask for it explained differently. Answers come from that lesson.",
  },
  {
    name: "Your own series",
    text: "Five lessons on anything, shaped by a short test, and finished with a Mastery Check.",
    sample: true,
  },
  {
    name: "Streak and stats",
    text: "A streak that counts real learning, plus how much you still remember from earlier lessons.",
  },
];

// The front page. A guest starts today's lesson from here; a signed-in learner is pointed to Today.
export default function LandingPage() {
  const user = useSession();
  const { data: session, error, reload } = useAlmanac(() => almanac.getDailySession(), []);

  const cta = user ? "Go to Today" : "Start today’s lesson";
  const ctaHref = user ? "/today" : "/today/lesson";
  const streak = session?.streak.count ?? null;
  // Blank until the streak is known, so the line doesn't change under the reader.
  const meta = !user
    ? "Free · no account needed"
    : streak === null
      ? " "
      : streak > 0
        ? `Day ${streak} of your streak`
        : "Your streak starts today";

  return (
    // No tab bar here: the page's own actions lead to Today.
    <PaperPage dateline tabs={false}>
      <section className="flex flex-wrap items-start gap-x-20 gap-y-12 pt-8 md:pt-[72px]">
        <div className="min-w-0 flex-[999_1_520px]">
          <p className="m-0 font-mono text-[13px] uppercase tracking-[0.08em] text-(--accent)">
            A new lesson every day · about three minutes
          </p>
          <h1 className="m-0 mt-6 text-[52px] font-medium leading-[0.96] tracking-[-0.025em] md:text-[clamp(64px,7vw,100px)]">
            Learn one thing <em className="font-normal">well</em>, every day.
          </h1>
          <p className="m-0 mt-7 max-w-[600px] text-[19px] leading-normal text-(--ink-soft) md:text-[22px]">
            A short lesson from the subjects you choose. A recall question keeps yesterday from fading. When
            something grabs you, Go Deeper writes a five-lesson series around what you got wrong.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-[14px]">
            <Button size="large" icon href={ctaHref} className="min-h-[58px]! px-7!">
              {cta}
            </Button>
            <p className="m-0 min-h-5 whitespace-pre font-mono text-[13px] leading-5 text-(--ink-muted)">{meta}</p>
          </div>
          <TopicForm />
        </div>
        <LessonTeaser session={session} error={error} onRetry={reload} />
      </section>

      <section aria-labelledby="how-heading" className={SECTION}>
        <h2 id="how-heading" className={SECTION_LABEL}>
          How it works
        </h2>
        <ol className="m-0 mt-2 grid list-none grid-cols-1 gap-x-12 p-0 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="border-0 border-b border-solid border-(--rule) py-[22px]">
              <p aria-hidden="true" className="m-0 font-mono text-[40px] font-medium leading-none text-(--accent)">
                {step.number}
              </p>
              <h3 className="m-0 mt-3 text-[28px] font-medium leading-[1.12]">{step.title}</h3>
              <p className="m-0 mt-2 text-[18px] leading-normal text-(--ink-soft)">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="inside-heading" className={SECTION}>
        <h2 id="inside-heading" className={SECTION_LABEL}>
          What’s inside
        </h2>
        <dl className="m-0 mt-2 grid grid-cols-1 gap-x-12 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 border-0 border-b border-solid border-(--rule) py-[22px] min-[390px]:grid-cols-[140px_minmax(0,1fr)]"
            >
              <dt className="t-label leading-[1.6]!">{feature.name}</dt>
              <dd className="m-0 text-[18px] leading-normal">
                {feature.text}
                {feature.sample && (
                  <>
                    {" "}
                    <Link href={SAMPLE} className="font-mono text-[14px] text-(--ink) underline underline-offset-4">
                      See a sample
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 bg-(--ink) px-6 py-8 text-(--on-ink) md:mt-24 md:px-14 md:py-16">
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-(--on-ink)/70">
          Free · no credit card · no account to start
        </p>
        <h2 className="m-0 mt-4 max-w-[900px] text-[36px] font-medium leading-none tracking-[-0.025em] md:text-[clamp(44px,5vw,64px)]">
          Today’s lesson is ready. It takes about three minutes.
        </h2>
        <div className="mt-[30px] flex flex-wrap items-center gap-x-6 gap-y-[14px]">
          {/* The primary button the other way round, for the ink ground. */}
          <Link
            href={ctaHref}
            className="inline-flex min-h-[58px] items-center gap-[14px] bg-(--on-ink) px-7 font-mono text-[15px] font-medium text-(--ink) no-underline transition-colors duration-(--duration-instant) ease-out hover:bg-(--accent) hover:text-(--on-ink)"
          >
            {cta}
            <ArrowIcon />
          </Link>
          <Link
            href={SAMPLE}
            className="inline-flex min-h-11 items-center font-mono text-[14px] text-(--on-ink) underline underline-offset-4"
          >
            Look around a sample series
          </Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-7">
        <p className="m-0 text-[22px] font-semibold tracking-[-0.015em]">TopicTutor</p>
        <p className="m-0 text-[17px] italic text-(--ink-muted)">A small daily paper for learning one thing well.</p>
      </footer>
    </PaperPage>
  );
}
