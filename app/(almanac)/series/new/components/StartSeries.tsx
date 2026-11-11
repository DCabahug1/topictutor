"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { LeadActions, LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac, type TopicCheck } from "@/lib/almanac";
import { BackLink } from "../../[id]/components/SeriesStates";
import { InlineAlert, LoadingLines } from "./parts";
import { TopicReview } from "@/components/almanac/TopicReview";

const HOW_IT_WORKS = [
  { title: "Placement test", text: "Five questions, easy to hard." },
  { title: "Your results", text: "What you missed becomes the focus." },
  { title: "Five lessons", text: "Each with a tutor and a check." },
  { title: "Mastery Check", text: "Pass with 4 of 5." },
];

const FIELD =
  "box-border block w-full rounded-none border border-solid border-(--ink) bg-(--paper-raised) font-serif text-(--ink)";

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

  // What the form needs before it shows: a test left unfinished, and today's lesson
  // when the topic arrived in the link. Only learners with an account get here.
  const { data: context, loading } = useAlmanac(
    async () => {
      const [pending, daily] = await Promise.all([
        almanac.getPlacement().catch(() => null),
        fromUrl ? almanac.getDailySession().catch(() => null) : null,
      ]);
      return { pending: pending && !pending.submitted ? pending : null, daily };
    },
    [user?.id, fromUrl]
  );

  // Null until the learner types, so the field can start from the link or the unfinished test.
  const [typedTopic, setTypedTopic] = useState<string | null>(null);
  const [typedFocus, setTypedFocus] = useState<string | null>(null);
  const [focusOpen, setFocusOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  // The topic whose test is being started, or null.
  const [starting, setStarting] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // A topic that needs a second look, and what was typed when it was checked.
  const [review, setReview] = useState<{ check: TopicCheck; typed: string } | null>(null);

  const pending = context?.pending ?? null;
  const topic = typedTopic ?? (fromUrl || pending?.topic || "");
  const focus = typedFocus ?? (fromUrl ? "" : (pending?.focus ?? ""));
  const showFocus = focusOpen || focus.length > 0;

  const todaysLesson = context?.daily?.lesson ?? null;
  const fromToday = Boolean(todaysLesson && fromUrl && todaysLesson.deeperTopic.toLowerCase() === fromUrl.toLowerCase());
  const prefilled = Boolean(fromUrl) && typedTopic === null;

  /** Starts the test on `chosen`. Only this counts toward the daily series limit. */
  const begin = async (chosen: string) => {
    setStarting(chosen);
    setFailed(false);
    setTypedTopic(chosen);
    try {
      await almanac.startPlacement({ topic: chosen, focus: focus.trim() || undefined });
      router.push("/series/new/placement");
    } catch {
      setStarting(null);
      setFailed(true);
    }
  };

  const start = async (event: FormEvent) => {
    event.preventDefault();
    const wanted = topic.trim();
    if (!wanted || starting !== null || checking) return;
    setFailed(false);

    // The same request as the unfinished test picks that test up, answers included.
    if (pending !== null && pending.topic === wanted && pending.focus === focus.trim()) {
      setStarting(wanted);
      router.push("/series/new/placement");
      return;
    }

    setChecking(true);
    // If the check itself fails, the topic goes through as typed.
    const check = await almanac.checkTopic({ topic: wanted, focus: focus.trim() || undefined }).catch(() => null);
    setChecking(false);
    if (check && check.verdict !== "clear") {
      setReview({ check, typed: wanted });
      return;
    }
    await begin(check?.topic || wanted);
  };

  const editTopic = () => {
    setReview(null);
    const field = document.getElementById("series-topic") as HTMLInputElement | null;
    field?.focus();
    field?.select();
  };

  if (loading && !context) {
    return (
      <PaperPage tabs={false}>
        <div className="mt-(--lead-top)">
          <LoadingLines label="Loading" />
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage tabs={false}>
      {fromToday && <BackLink href="/today/lesson">Today’s lesson</BackLink>}
      <form onSubmit={start} className={fromToday ? "mt-10 md:mt-16" : "mt-(--lead-top)"}>
        <LeadBlock
          eyebrow="Go deeper · new series"
          title="What do you want to learn?"
          line="Five quick questions find what you already know. Then you get five lessons built around the rest."
          className="max-w-[860px]"
        />

        <div className="mt-10 max-w-[860px] md:mt-12">
          <label htmlFor="series-topic" className="t-label block text-(--ink-muted)">
            Topic
          </label>
          <input
            id="series-topic"
            type="text"
            value={topic}
            onChange={(event) => {
              setTypedTopic(event.target.value);
              setReview(null);
            }}
            placeholder="Basics of web development"
            autoComplete="off"
            maxLength={120}
            className={`${FIELD} mt-[10px] h-16 px-4 text-[22px] md:h-[72px] md:px-5 md:text-[30px]`}
          />
          <p className="m-0 mt-2 text-[16px] italic text-(--ink-muted)">
            {prefilled && (fromToday ? "Filled in from today’s lesson. " : "Filled in from your suggestion. ")}
            {!showFocus && (
              <button
                type="button"
                onClick={() => setFocusOpen(true)}
                className="cursor-pointer border-0 bg-transparent p-0 font-serif text-[16px] italic text-(--ink-soft) underline underline-offset-[5px] hover:text-(--ink)"
              >
                Add anything specific
              </button>
            )}
          </p>

          {showFocus && (
            <div className="mt-6">
              <label htmlFor="series-focus" className="t-label block text-(--ink-muted)">
                Anything specific · optional
              </label>
              <textarea
                id="series-focus"
                rows={3}
                value={focus}
                autoFocus={focusOpen && typedFocus === null}
                onChange={(event) => setTypedFocus(event.target.value)}
                placeholder="I never know why my CSS doesn’t apply"
                maxLength={300}
                className={`${FIELD} mt-[10px] resize-y px-4 py-3 text-[18px] leading-[1.45] md:px-5 md:text-[20px]`}
              />
            </div>
          )}

          {failed && <InlineAlert className="mt-4">The test didn’t start. Check your connection and try again.</InlineAlert>}

          {review ? (
            <TopicReview check={review.check} typed={review.typed} starting={starting} onUse={begin} onEdit={editTopic} />
          ) : (
            <LeadActions
              primary={
                topic.trim() ? (
                  <Button type="submit" icon busy={checking || starting !== null}>
                    {checking ? "Checking the topic" : starting !== null ? "Starting your test" : "Take the placement test"}
                  </Button>
                ) : (
                  <Button type="submit" disabled>
                    Name a topic to start
                  </Button>
                )
              }
              quiet={<span className="text-[18px] italic text-(--ink-muted)">5 questions · about 2 minutes</span>}
            />
          )}
        </div>
      </form>

      <section aria-labelledby={howId} className="mt-(--section-gap)">
        <h2 id={howId} className="t-label m-0 text-(--ink-muted)">
          How a series works
        </h2>
        <ol className="m-0 mt-4 grid list-none grid-cols-1 gap-x-8 gap-y-6 border-0 border-t border-solid border-(--rule) p-0 pt-6 sm:grid-cols-2 md:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title}>
              <span aria-hidden="true" className="font-label text-[13px] text-(--ink-muted)">
                0{i + 1}
              </span>
              <span className="mt-1 block text-[21px] font-medium">{step.title}</span>
              <span className="mt-1 block text-[17px] leading-[1.45] text-(--ink-soft)">{step.text}</span>
            </li>
          ))}
        </ol>
        <Button variant="quiet" href="/series/sample" className="mt-6">
          or open the sample series first
        </Button>
      </section>
    </PaperPage>
  );
}
