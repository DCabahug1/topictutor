"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { LessonRow } from "@/components/almanac/LessonRow";
import { Markdown } from "@/components/almanac/Markdown";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { ScoreNumeral } from "@/components/almanac/ScoreNumeral";
import { Section } from "@/components/almanac/Section";
import { useSession } from "@/components/almanac/SessionProvider";
import {
  LESSONS_PER_SERIES,
  almanac,
  joinList,
  useAlmanac,
  type Answer,
  type ChoiceQuestion,
  type OutlineRow,
} from "@/lib/almanac";
import { LoadingLines } from "./parts";

type Verdict = "correct" | "missed" | "unsure";

function verdictOf(question: ChoiceQuestion, answer: Answer | null): Verdict {
  if (answer === question.correctIndex) return "correct";
  return answer === "unsure" ? "unsure" : "missed";
}

const TAG: Record<Verdict, React.ReactNode> = {
  missed: <span className="text-(--incorrect)">✕ Missed</span>,
  unsure: "? Not sure",
  correct: <span className="text-(--correct)">✓ Right</span>,
};

/** The heading under the score. */
function headline(score: number, total: number): string {
  if (score === total) return "Your series goes further.";
  if (score === 0) return "Your series starts from the ground up.";
  return "Your series starts with what you missed.";
}

export function PlacementResults() {
  const user = useSession();
  const router = useRouter();
  const { data: result, error, loading, reload, setData } = useAlmanac(() => almanac.getPlacementResult(), []);
  // Outline rows that arrived during this visit. Earlier ones are in `result.outline`.
  const [arrived, setArrived] = useState<OutlineRow[]>([]);
  const [outlineFailed, setOutlineFailed] = useState(false);
  const [outlineAttempt, setOutlineAttempt] = useState(0);
  const [finishedHere, setFinishedHere] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Tapped "Open your series" before the outline was done: open it as soon as it is.
  const [openWhenReady, setOpenWhenReady] = useState(false);

  // Nothing submitted yet: back to the test, which goes back to the start if there is none.
  const missing = !loading && !error && result === null;
  useEffect(() => {
    if (missing) router.replace("/series/new/placement");
  }, [missing, router]);

  // The outline starts writing on its own, and picks up where it stopped after a refresh.
  const needsOutline = Boolean(result && result.seriesId === null);
  useEffect(() => {
    if (!needsOutline) return;
    let current = true;
    (async () => {
      try {
        for await (const row of almanac.streamOutline()) {
          if (!current) return;
          setArrived((rows) => [...rows.filter((r) => r.number !== row.number), row]);
        }
        const done = await almanac.getPlacementResult();
        if (!current) return;
        if (!done?.seriesId) throw new Error("The outline finished without a series.");
        setFinishedHere(true);
        setData(done);
      } catch {
        if (current) setOutlineFailed(true);
      }
    })();
    return () => {
      current = false;
    };
  }, [needsOutline, outlineAttempt, setData]);

  const seriesId = result?.seriesId ?? null;
  useEffect(() => {
    if (openWhenReady && seriesId) router.push(`/series/${seriesId}`);
  }, [openWhenReady, seriesId, router]);

  const wayOut = user ? { label: "or go to your Library", href: "/library" } : { label: "or back to the start", href: "/" };

  if (error) {
    return (
      <PaperPage tabs={false}>
        <div className="mt-(--lead-top) max-w-[780px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Your results didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={wayOut}
          />
        </div>
      </PaperPage>
    );
  }

  if (!result) {
    return (
      <PaperPage tabs={false}>
        <div className="mt-(--lead-top)">
          <LoadingLines label="Loading your results" />
        </div>
      </PaperPage>
    );
  }

  const { placement, score, total } = result;
  const questions = placement.questions ?? [];
  const verdicts = questions.map((question, i) => verdictOf(question, placement.answers[i]));
  const correctTopics = questions
    .filter((_, i) => verdicts[i] === "correct")
    .map((question) => question.topic)
    .filter((topic): topic is string => Boolean(topic));
  const anyCorrect = verdicts.includes("correct");
  const anyMissed = verdicts.some((verdict) => verdict !== "correct");

  const written = new Set([...result.outline, ...arrived].map((row) => row.number)).size;
  const outlineDone = seriesId !== null;

  const line = placement.focus ? `${result.focusLine} You also said: ${placement.focus}.` : result.focusLine;
  const rows = questions
    .map((question, i) => ({ question, i, verdict: verdicts[i] }))
    .filter((row) => showAll || row.verdict !== "correct");

  const primary = outlineDone ? (
    <Button icon href={`/series/${seriesId}`}>
      Open your series
    </Button>
  ) : (
    <Button icon busy={openWhenReady} onClick={() => setOpenWhenReady(true)}>
      {openWhenReady ? "Opening when it’s ready" : "Open your series"}
    </Button>
  );

  const writingLine = (
    <span className="inline-flex items-center gap-3 text-[17px] italic text-(--ink-muted) md:text-[18px]">
      <span aria-hidden="true" className="relative block h-[3px] w-14 bg-(--rule)">
        <span
          className="absolute inset-y-0 left-0 bg-(--accent) transition-[width] duration-(--duration-step)"
          style={{ width: `${(written / LESSONS_PER_SERIES) * 100}%` }}
        />
      </span>
      Writing your outline, {written} of {LESSONS_PER_SERIES}
    </span>
  );

  return (
    <PaperPage tabs={false}>
      <section className="mt-(--lead-top)">
        <LeadBlock
          eyebrow={`Placement test · ${placement.topic}`}
          numeral={<ScoreNumeral score={score} total={total} />}
          title={headline(score, total)}
          size="sm"
          line={line}
          className="max-w-[860px]"
          primary={outlineFailed ? undefined : primary}
          quiet={outlineFailed ? undefined : outlineDone ? undefined : writingLine}
        />
        <p role="status" className="sr-only">
          {finishedHere ? "Your outline is ready." : ""}
        </p>
        {outlineFailed && (
          <Notice
            className="mt-10 max-w-[780px]"
            tone="error"
            kicker="Couldn’t write the outline"
            title="Your series outline didn’t come through."
            body="Your test results are kept, so you won’t take the test again. Try again to build the series from them."
            kept={`Placement test kept: ${score} of ${total}.`}
            primary={{
              label: "Try again",
              onClick: () => {
                setOutlineFailed(false);
                setOutlineAttempt((n) => n + 1);
              },
            }}
            secondary={wayOut}
          />
        )}
      </section>

      <Section id="answers" title={anyMissed ? "What you missed" : "Your answers"}>
        <ol className="m-0 list-none p-0">
          {rows.map(({ question, i, verdict }) => {
            const answer = placement.answers[i];
            const said = verdict === "missed" && typeof answer === "number" ? `You said: ${question.options[answer]}. ` : "";
            return (
              <LessonRow
                key={i}
                number={i + 1}
                title={<Markdown mode="inline">{question.prompt}</Markdown>}
                status="notStarted"
                sub={<Markdown mode="inline">{`${said}Answer: ${question.options[question.correctIndex]}.`}</Markdown>}
                tag={TAG[verdict]}
              />
            );
          })}
        </ol>
        {anyCorrect && !showAll && (
          <p className="m-0 mt-5 text-[17px] italic text-(--ink-muted)">
            ✓ Right: {correctTopics.length ? `${joinList(correctTopics)}.` : "the rest."}{" "}
            <Button variant="quiet" className="min-h-0! text-[17px]!" onClick={() => setShowAll(true)}>
              Show all five
            </Button>
          </p>
        )}
      </Section>
    </PaperPage>
  );
}
