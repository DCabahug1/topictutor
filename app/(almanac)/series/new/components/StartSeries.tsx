"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { BackIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { AlmanacError, almanac, useAlmanac } from "@/lib/almanac";
import { InlineAlert, LoadingLines } from "./parts";

type Limit = "used" | "daily";

const HOW_IT_WORKS = [
  { title: "Placement test", text: "Five questions, easy to hard. “Not sure” is a fine answer." },
  { title: "Your results", text: "See what you missed. That becomes the focus." },
  { title: "Five lessons", text: "Written around your gaps, at your own pace. Each has a tutor and a check." },
  { title: "Mastery Check", text: "Five questions from your lessons. 4 of 5 passes." },
];

const FIELD_LABEL = "t-label block";
const FIELD =
  "box-border block w-full border-[1.5px] border-solid border-(--ink) bg-(--paper-raised) font-serif text-(--ink)";

export function StartSeries() {
  // useSearchParams needs a boundary so the rest of the page can prerender.
  return (
    <Suspense fallback={null}>
      <StartSeriesInner />
    </Suspense>
  );
}

function StartSeriesInner() {
  const user = useSession();
  const router = useRouter();
  const fromUrl = useSearchParams().get("topic")?.trim() ?? "";
  const howId = useId();

  // What the form needs before it shows: a guest's limits, a test left unfinished,
  // and today's lesson when the topic arrived in the link.
  const { data: context, loading } = useAlmanac(
    async () => {
      const [guest, pending, daily] = await Promise.all([
        user ? null : almanac.getGuestState().catch(() => null),
        almanac.getPlacement().catch(() => null),
        fromUrl ? almanac.getDailySession().catch(() => null) : null,
      ]);
      return { guest, pending: pending && !pending.submitted ? pending : null, daily };
    },
    [user?.id, fromUrl]
  );

  // Null until the learner types, so the field can start from the link or the unfinished test.
  const [typedTopic, setTypedTopic] = useState<string | null>(null);
  const [typedFocus, setTypedFocus] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refused, setRefused] = useState<Limit | null>(null);

  const pending = context?.pending ?? null;
  const topic = typedTopic ?? (fromUrl || pending?.topic || "");
  const focus = typedFocus ?? (fromUrl ? "" : (pending?.focus ?? ""));

  const todaysLesson = context?.daily?.lesson ?? null;
  const fromToday = Boolean(todaysLesson && fromUrl && todaysLesson.deeperTopic.toLowerCase() === fromUrl.toLowerCase());
  const prefilled = Boolean(fromUrl) && typedTopic === null;

  const limit: Limit | null = context?.guest?.dailyLimitReached ? "daily" : context?.guest?.seriesUsed ? "used" : refused;

  const start = async (event: FormEvent) => {
    event.preventDefault();
    const wanted = topic.trim();
    if (!wanted || starting) return;
    setStarting(true);
    setFailed(false);
    try {
      // The same request as the unfinished test picks that test up, answers included.
      const resume = pending !== null && pending.topic === wanted && pending.focus === focus.trim();
      if (!resume) await almanac.startPlacement({ topic: wanted, focus: focus.trim() || undefined });
      router.push("/series/new/placement");
    } catch (cause) {
      setStarting(false);
      if (cause instanceof AlmanacError && cause.kind === "guestDailyLimit") setRefused("daily");
      else if (cause instanceof AlmanacError && cause.kind === "guestSeriesUsed") setRefused("used");
      else setFailed(true);
    }
  };

  if (loading && !context) {
    return (
      <PaperPage tabs={false}>
        <LoadingLines label="Loading" />
      </PaperPage>
    );
  }

  if (limit) {
    return (
      <PaperPage tabs={false}>
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          {limit === "daily" ? (
            <Notice
              tone="info"
              headingLevel={1}
              kicker="Daily limit reached"
              title="New series are paused for guests today."
              body="Guests share a daily limit, and it’s used up for today. The sample series is open to everyone, with working checks."
              primary={{ label: "Open the sample series", href: "/series/sample" }}
              secondary={{ label: "Create a free account", href: "/register" }}
            />
          ) : (
            <Notice
              tone="info"
              headingLevel={1}
              kicker="Guest limit"
              title="You’ve used your guest series."
              body="Guests can go deeper once. Your series is still yours in this browser. To start another, create a free account, or look around the sample series."
              primary={{ label: "Create a free account", href: "/register" }}
              secondary={{ label: "Open the sample series", href: "/series/sample" }}
            />
          )}
          <p className="t-note m-0 mt-[14px] px-5 text-(--ink-muted)">
            {limit === "daily"
              ? "Your daily lesson still works as usual."
              : "Free, no credit card. Your progress so far comes with you."}
          </p>
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage tabs={false}>
      {fromToday && (
        <Link
          href="/today/lesson"
          className="mt-5 hidden min-h-11 items-center gap-[6px] font-mono text-[13px] text-(--ink) no-underline hover:text-(--accent) md:inline-flex"
        >
          <BackIcon size={15} />
          Today’s lesson
        </Link>
      )}
      <div
        className={
          fromToday
            ? "flex flex-wrap items-start gap-x-24 gap-y-12 pb-36 pt-7 md:pb-0 md:pt-6"
            : "flex flex-wrap items-start gap-x-24 gap-y-12 pb-36 pt-7 md:pb-0 md:pt-14"
        }
      >
        <form onSubmit={start} className="min-w-0 max-w-[680px] flex-[999_1_520px]">
          <p className="t-label m-0 font-normal! text-(--accent)">Go deeper · new series</p>
          <h1 className="m-0 mt-3 text-[38px] font-medium leading-[1.04] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(42px,5vw,72px)] md:leading-[0.98] md:tracking-[-0.025em]">
            What do you want to learn?
          </h1>
          <p className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft) md:mt-4 md:text-[20px]">
            Five short questions find what you already know. Then we write five lessons around what you don’t.
          </p>

          <label htmlFor="series-topic" className={`${FIELD_LABEL} mt-[26px] md:mt-9`}>
            Topic
          </label>
          <input
            id="series-topic"
            type="text"
            value={topic}
            onChange={(event) => setTypedTopic(event.target.value)}
            placeholder="Basics of Web Development"
            autoComplete="off"
            aria-describedby={prefilled ? "series-topic-note" : undefined}
            className={`${FIELD} mt-2 h-[52px] px-[14px] text-[19px] md:mt-[10px] md:h-[58px] md:px-4 md:text-[24px]`}
          />
          {prefilled && (
            <p id="series-topic-note" className="m-0 mt-2 text-[15px] italic text-(--ink-muted) md:text-[16px]">
              {fromToday && todaysLesson
                ? `Filled in from today’s lesson, ${todaysLesson.title}. Change it if you like.`
                : "Filled in from your suggestion. Change it if you like."}
            </p>
          )}

          <label htmlFor="series-focus" className={`${FIELD_LABEL} mt-[22px] md:mt-7`}>
            Anything specific? <span className="font-normal text-(--ink-muted)">· optional</span>
          </label>
          <textarea
            id="series-focus"
            rows={3}
            value={focus}
            onChange={(event) => setTypedFocus(event.target.value)}
            placeholder="I never know why my CSS doesn’t apply"
            className={`${FIELD} mt-2 resize-y px-[14px] py-3 text-[18px] leading-[1.45] md:mt-[10px] md:px-4 md:py-[14px] md:text-[20px]`}
          />

          {failed && (
            <InlineAlert className="mt-4">
              The test didn’t start. Check your connection and try again.
            </InlineAlert>
          )}

          {/* Pinned to the bottom of the screen on phones, in the form from 768px. */}
          <div className="fixed inset-x-0 bottom-0 z-10 border-0 border-t border-solid border-(--rule) bg-(--paper) px-6 pb-5 pt-3 md:static md:mt-7 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-[14px] md:border-t-0 md:bg-transparent md:p-0">
            {topic.trim() ? (
              <Button type="submit" size="large" icon busy={starting} className="w-full md:min-h-[58px] md:w-auto md:px-7">
                {starting ? "Starting your test" : "Take the placement test"}
              </Button>
            ) : (
              <Button type="submit" size="large" disabled className="w-full md:min-h-[58px] md:w-auto md:px-7">
                Name a topic to start
              </Button>
            )}
            <p className="m-0 mt-2 text-center font-mono text-[12px] text-(--ink-muted) md:mt-0 md:text-left md:text-[13px]">
              5 questions · about 2 minutes
            </p>
          </div>
        </form>

        <aside aria-labelledby={howId} className="min-w-0 flex-[1_1_360px] border-0 border-t-[3px] border-solid border-(--ink) pt-4">
          <h2 id={howId} className="t-label m-0 text-(--ink-muted)">
            How a series works
          </h2>
          <ol className="m-0 mt-[10px] list-none p-0">
            {HOW_IT_WORKS.map((step, i) => (
              <li
                key={step.title}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-0 border-t border-solid border-(--rule) py-4"
              >
                <span aria-hidden="true" className="font-mono text-[13px] text-(--accent)">
                  0{i + 1}
                </span>
                <span>
                  <span className="block text-[19px] font-medium md:text-[21px]">{step.title}</span>
                  <span className="mt-[3px] block text-[16px] leading-[1.45] text-(--ink-soft) md:text-[17px]">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-4 text-[17px] text-(--ink-soft)">
            Want to see one first?{" "}
            <Link href="/series/sample" className="py-3 font-mono text-[14px] text-(--ink)">
              Open the sample series
            </Link>
          </p>
        </aside>
      </div>
    </PaperPage>
  );
}
