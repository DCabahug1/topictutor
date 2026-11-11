"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Caret } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { CheckIcon, CrossIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage, PinnedActions } from "@/components/almanac/Page";
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

const VERDICT_WORD: Record<Verdict, string> = { correct: "Correct", missed: "Missed", unsure: "Not sure" };

function verdictOf(question: ChoiceQuestion, answer: Answer | null): Verdict {
  if (answer === question.correctIndex) return "correct";
  return answer === "unsure" ? "unsure" : "missed";
}

/** Check, cross or question mark. Always shown beside the word. */
function VerdictGlyph({ verdict, size }: { verdict: Verdict; size: number }) {
  if (verdict === "correct") return <CheckIcon size={size} strokeWidth={3} className="flex-none md:mt-[2px]" />;
  if (verdict === "missed") return <CrossIcon size={size} strokeWidth={3} className="flex-none md:mt-[2px]" />;
  return <span aria-hidden="true">?</span>;
}

// On desktop the outline sits beside the score and the answers. Below 1120px
// everything stacks, with the outline between them as on phones.
const SCORE = "min-[1120px]:col-start-1 min-[1120px]:row-start-1";
const ANSWERS = "min-[1120px]:col-start-1 min-[1120px]:row-start-2";
const RIGHT = "min-[1120px]:col-start-2 min-[1120px]:row-span-2 min-[1120px]:row-start-1 min-[1120px]:self-start";

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
  const answersHeading = useRef<HTMLHeadingElement>(null);

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

  const wayOut = user ? { label: "Back to Library", href: "/library" } : { label: "Back to the start", href: "/" };

  if (error) {
    return (
      <PaperPage tabs={false}>
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
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
        <LoadingLines label="Loading your results" />
      </PaperPage>
    );
  }

  const { placement, score, total, seriesId } = result;
  const questions = placement.questions ?? [];
  const verdicts = questions.map((question, i) => verdictOf(question, placement.answers[i]));
  const correct = verdicts.map((verdict, i) => (verdict === "correct" ? i : -1)).filter((i) => i >= 0);
  const correctTopics = correct.map((i) => questions[i].topic).filter((topic): topic is string => Boolean(topic));

  const outline = [...result.outline];
  for (const row of arrived) {
    if (!outline.some((written) => written.number === row.number)) outline.push(row);
  }
  outline.sort((a, b) => a.number - b.number);
  const outlineDone = seriesId !== null;
  const outlineWriting = !outlineDone && !outlineFailed;

  return (
    <PaperPage tabs={false}>
      <div className="pb-28 pt-[26px] md:pb-0 md:pt-14 min-[1120px]:grid min-[1120px]:grid-cols-[minmax(0,1fr)_380px] min-[1120px]:grid-rows-[auto_1fr] min-[1120px]:gap-x-[72px]">
        <section className={SCORE}>
          <p className="t-label m-0 font-normal! text-(--ink-muted)">Placement test · {placement.topic}</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3 md:mt-4">
            <p className="m-0 font-mono text-[56px] font-medium leading-none tracking-[-0.03em] md:text-[96px] md:leading-[0.9] md:tracking-[-0.04em]">
              <span aria-hidden="true">
                {score}
                <span className="text-(--ink-muted)">/{total}</span>
              </span>
              <span className="sr-only">
                {score} of {total} correct
              </span>
            </p>
            <ol
              aria-label="Results by question"
              className="m-0 mb-[6px] hidden list-none gap-[6px] p-0 font-mono text-[13px] md:flex"
            >
              {verdicts.map((verdict, i) => (
                <li
                  key={i}
                  className={cx(
                    "flex items-center gap-1 border-[1.5px] px-[9px] py-[6px]",
                    verdict === "unsure" ? "border-dashed" : "border-solid",
                    verdict === "correct"
                      ? "border-(--correct) bg-(--correct-wash) text-(--correct)"
                      : "border-(--incorrect) bg-(--incorrect-wash) text-(--incorrect)"
                  )}
                >
                  {verdict === "correct" && <CheckIcon size={11} strokeWidth={3} />}
                  {verdict === "missed" && <CrossIcon size={11} strokeWidth={3} />}
                  {verdict === "unsure" && <span aria-hidden="true">?</span>}
                  {i + 1}
                  <span className="sr-only"> {VERDICT_WORD[verdict].toLowerCase()}</span>
                </li>
              ))}
            </ol>
          </div>
          <h1 className="m-0 mt-[14px] text-[26px] font-medium leading-[1.2] md:mt-7 md:max-w-[720px] md:text-[clamp(32px,3.4vw,46px)] md:leading-[1.08] md:tracking-[-0.02em]">
            {result.focusLine}
          </h1>
          {placement.focus && (
            <p className="m-0 mt-[10px] max-w-[640px] text-[17px] leading-normal text-(--ink-soft) md:mt-[14px] md:text-[19px]">
              You also said: <span className="italic">{placement.focus}</span>
            </p>
          )}
        </section>

        {outlineFailed ? (
          <Notice
            className={cx("mt-[18px] md:mt-8 min-[1120px]:mt-0", RIGHT)}
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
        ) : (
          <aside
            aria-label="Your series outline"
            aria-busy={outlineWriting}
            className={cx(
              "mt-[18px] box-border border border-solid border-(--ink) bg-(--paper-raised) px-[18px] py-4 md:mt-8 md:px-[26px] md:pb-[26px] md:pt-6 min-[1120px]:mt-0",
              RIGHT
            )}
          >
            <p className={cx("t-label m-0 flex items-center gap-2", outlineDone ? "text-(--correct)" : "text-(--accent)")}>
              {outlineDone ? <CheckIcon size={13} strokeWidth={2.6} /> : <Caret className="h-[14px]" />}
              {outlineDone ? (
                "Outline ready"
              ) : (
                <span>
                  Writing your outline
                  <span className="hidden md:inline">
                    {" "}
                    · {outline.length} of {LESSONS_PER_SERIES}
                  </span>
                </span>
              )}
            </p>
            <h2 className="m-0 mt-3 hidden text-[28px] font-medium leading-[1.1] tracking-[-0.015em] md:block">
              {placement.topic}
            </h2>
            <ol className="m-0 mt-[10px] list-none border-0 border-solid border-(--rule) p-0 md:mt-[18px] md:border-b">
              {Array.from({ length: LESSONS_PER_SERIES }, (_, i) => {
                const row = outline.find((written) => written.number === i + 1);
                const newest = outlineWriting && row !== undefined && i + 1 === outline.length;
                return (
                  <li
                    key={i}
                    className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 border-0 border-t border-solid border-(--rule) py-2 md:grid-cols-[30px_minmax(0,1fr)] md:py-3"
                  >
                    <span className="font-mono text-[12px] leading-[22px] text-(--ink-muted) md:leading-6">0{i + 1}</span>
                    {row ? (
                      <span className="text-[17px] leading-[1.3] md:text-[18px]">
                        {row.title}
                        {newest && <Caret inText />}
                        {row.focus && (
                          <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-(--accent) md:mt-[2px]">
                            Focus · you missed question {row.number}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className={cx("mt-[5px] h-[14px] bg-(--paper-sunk)", i === LESSONS_PER_SERIES - 1 && "md:w-[70%]")}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            {outlineWriting && (
              <p className="m-0 mt-[14px] hidden text-[15px] italic text-(--ink-muted) md:block">
                This takes a few seconds. Read your answers while you wait.
              </p>
            )}
            <p role="status" className="sr-only">
              {finishedHere ? "Your outline is ready." : ""}
            </p>
            {/* From 768px the main action lives in the card. On phones it is pinned below. */}
            <div className="mt-[18px] hidden md:block">
              {seriesId ? (
                <Button fullWidth icon href={`/series/${seriesId}`}>
                  Open your series
                </Button>
              ) : (
                <Button fullWidth disabled>
                  Open your series · almost ready
                </Button>
              )}
            </div>
          </aside>
        )}

        <section className={cx("mt-[26px] md:mt-12", ANSWERS)}>
          <h2 ref={answersHeading} tabIndex={-1} className="t-label m-0 text-(--ink-muted) outline-none">
            Your answers
          </h2>
          <ol className="m-0 mt-[10px] list-none border-0 border-solid border-(--rule) p-0 md:border-b">
            {questions.map((question, i) => {
              const verdict = verdicts[i];
              const answer = placement.answers[i];
              return (
                <li
                  key={i}
                  className={cx(
                    "grid-cols-[120px_minmax(0,1fr)] gap-4 border-0 border-t border-solid border-(--rule) py-[14px] md:py-4",
                    // Desktop folds the correct answers into one line until asked for all five.
                    verdict === "correct" && !showAll ? "md:hidden" : "md:grid"
                  )}
                >
                  <p
                    className={cx(
                      "m-0 flex items-center gap-[6px] font-mono text-[11px] font-medium uppercase tracking-[0.06em] md:items-start md:text-[12px]",
                      verdict === "correct" ? "text-(--correct)" : "text-(--incorrect)"
                    )}
                  >
                    <VerdictGlyph verdict={verdict} size={12} />
                    {i + 1} · {VERDICT_WORD[verdict]}
                  </p>
                  <div>
                    <p className="m-0 mt-[6px] text-[17px] leading-[1.35] md:mt-0 md:text-[19px]">{question.prompt}</p>
                    <div className="mt-[6px] flex flex-col gap-1 text-[15px] md:mt-2 md:text-[16px]">
                      {verdict === "missed" && (
                        <p className="m-0 text-(--ink-muted)">
                          You said: {typeof answer === "number" ? question.options[answer] : "No answer"}
                        </p>
                      )}
                      <p className="m-0">
                        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-(--correct)">Answer</span>{" "}
                        {question.options[question.correctIndex]}
                      </p>
                      <p className="m-0 italic text-(--ink-soft)">{question.explanation}</p>
                    </div>
                  </div>
                </li>
              );
            })}
            {correct.length > 0 && !showAll && (
              <li className="hidden grid-cols-[120px_minmax(0,1fr)] gap-4 border-0 border-t border-solid border-(--rule) py-4 md:grid">
                <p className="m-0 flex items-start gap-[6px] font-mono text-[12px] font-medium uppercase tracking-[0.06em] text-(--correct)">
                  <CheckIcon size={12} strokeWidth={3} className="mt-[2px] flex-none" />
                  {correct.map((i) => i + 1).join(", ")}
                </p>
                <p className="m-0 text-[17px] leading-[1.45] text-(--ink-soft)">
                  {correctTopics.length === correct.length ? `Correct: ${joinList(correctTopics)}.` : "Correct."}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAll(true);
                      answersHeading.current?.focus();
                    }}
                    className="cursor-pointer border-0 bg-transparent px-0 py-2 font-mono text-[13px] text-(--ink) underline underline-offset-4 hover:text-(--accent)"
                  >
                    Show all five
                  </button>
                </p>
              </li>
            )}
          </ol>
        </section>
      </div>

      {!outlineFailed && (
        <div className="md:hidden">
          <PinnedActions>
            {seriesId ? (
              <Button size="large" icon href={`/series/${seriesId}`}>
                Open your series
              </Button>
            ) : (
              <Button size="large" disabled busy>
                Writing your outline
              </Button>
            )}
          </PinnedActions>
        </div>
      )}
    </PaperPage>
  );
}
