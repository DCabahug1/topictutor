"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { ArrowIcon, CheckIcon, CrossIcon } from "@/components/almanac/icons";
import { PaperPage } from "@/components/almanac/Page";
import { ProgressMeter, StatusLabel } from "@/components/almanac/StatusLabel";
import { LESSONS_PER_SERIES, type Mastery } from "@/lib/almanac";
import { lessonList, passHeadline, shortTitle, twoDigits } from "./copy";
import { BackLink, PhoneActions } from "./SeriesStates";

type MasteryResultProps = {
  /** Status passed or failed. */
  mastery: Mastery;
  /** True when the learner has just submitted: the headline then takes focus. */
  focusHeading?: boolean;
  onRetake: () => void;
  retaking: boolean;
  retakeFailed: boolean;
};

const SECTION_LABEL = "t-label m-0";
const TEXT_LINK = "inline-flex min-h-11 items-center font-mono text-[14px] text-(--ink) underline underline-offset-4";

/** The score after a Mastery Check: suggestions after a pass, a guided review after a miss. */
export function MasteryResult({ mastery, focusHeading = false, onRetake, retaking, retakeFailed }: MasteryResultProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusHeading) heading.current?.focus();
  }, [focusHeading]);

  const pass = mastery.status === "passed";
  const score = mastery.lastScore ?? 0;
  const best = mastery.best ?? score;
  const total = mastery.questions?.length ?? LESSONS_PER_SERIES;
  const seriesHref = `/series/${mastery.seriesId}`;
  const reviewNumbers = mastery.review.map((lesson) => lesson.number);

  const head = pass
    ? passHeadline(mastery.seriesTitle)
    : score === total - 2
      ? "Close. Passing is 4 of 5."
      : "Not yet. Passing is 4 of 5.";
  const body = pass
    ? "Series complete. Your best score is saved, and you can retake the check whenever you like."
    : `You got ${score}. The questions you missed point to ${
        mastery.review.length === 1 ? "one lesson" : `${mastery.review.length} lessons`
      } worth another look.`;

  const retakeAlert = retakeFailed && (
    <p role="alert" className="m-0 mt-3 text-[15px] text-(--incorrect)">
      The retake didn’t start. Try again.
    </p>
  );

  return (
    <PaperPage current="library" tabs={false}>
      <div className="pb-28 md:pb-0">
        <BackLink href={seriesHref}>{shortTitle(mastery.seriesTitle)}</BackLink>

        <div className="mt-3 flex flex-wrap items-end gap-x-20 gap-y-[18px] md:mt-7 md:gap-y-10">
          <div className="flex-none">
            <p className="t-label m-0 font-normal! text-(--ink-muted)">Mastery Check · attempt {mastery.attempts}</p>
            <div className="mt-[14px] flex items-center gap-[14px] md:gap-5">
              <p
                className={cx(
                  "m-0 font-mono text-[64px] font-medium leading-none tracking-[-0.03em] md:text-[120px] md:leading-[0.9] md:tracking-[-0.05em]",
                  pass ? "text-(--correct)" : "text-(--incorrect)"
                )}
              >
                <span aria-hidden="true">
                  {score}
                  <span className="text-(--ink-muted)">/{total}</span>
                </span>
                <span className="sr-only">
                  {score} out of {total}
                </span>
              </p>
              <p
                className={cx(
                  "m-0 inline-flex items-center gap-[6px] border-[1.5px] border-solid px-3 py-2 font-mono text-[13px] font-medium uppercase tracking-[0.08em] md:gap-2 md:px-[14px] md:py-[10px] md:text-[14px]",
                  pass
                    ? "border-(--correct) bg-(--correct-wash) text-(--correct)"
                    : "border-(--incorrect) bg-(--incorrect-wash) text-(--incorrect)"
                )}
              >
                {pass ? <CheckIcon size={13} strokeWidth={2.8} /> : <CrossIcon size={13} strokeWidth={2.8} />}
                {pass ? "Passed" : "Not yet"}
              </p>
            </div>
          </div>

          <div className="order-3 min-w-0 flex-[1_1_480px] md:order-none">
            <h1
              ref={heading}
              tabIndex={-1}
              className="m-0 text-[34px] font-medium leading-[1.05] tracking-[-0.02em] outline-none md:text-[clamp(40px,4.6vw,64px)] md:leading-none md:tracking-[-0.025em]"
            >
              {head}
            </h1>
            <p className="m-0 mt-[10px] text-[17px] leading-normal text-(--ink-soft) md:mt-[14px] md:text-[20px]">
              {body}
            </p>
          </div>

          {/* The double rule. After a pass it draws across; on phones it sits under the score. */}
          <div aria-hidden="true" className={cx("order-2 w-full md:order-none", !pass && "md:hidden")}>
            <div className={cx("h-[3px] bg-(--ink)", pass && "almanac-draw")} />
            <div className={cx("mt-[3px] h-px bg-(--ink)", pass && "almanac-draw")} />
          </div>
        </div>

        {pass ? (
          <>
            <div className="mt-8 hidden md:block">
              <div className="flex items-center justify-between font-mono text-[13px]">
                <StatusLabel status="completed" />
                <span className="font-medium">100%</span>
              </div>
              <ProgressMeter
                lessonsDone={LESSONS_PER_SERIES}
                passed
                showPercent={false}
                className="mt-2 md:[&_[role=img]>span]:h-[10px]"
              />
            </div>

            {mastery.suggestions.length > 0 && (
              <section className="mt-[18px] md:mt-14">
                <h2 className={cx(SECTION_LABEL, "text-(--accent)")}>What to learn next</h2>
                <ul className="m-0 mt-2 grid list-none grid-cols-1 border-0 border-t border-solid border-(--rule) p-0 md:mt-3 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:border-t-[3px] md:border-(--ink)">
                  {mastery.suggestions.map((suggestion, i) => (
                    <li
                      key={suggestion.title}
                      className={cx(
                        "border-0 border-b border-solid border-(--rule) md:border-b-0",
                        i < mastery.suggestions.length - 1 && "md:border-r"
                      )}
                    >
                      <Link
                        href={`/series/new?topic=${encodeURIComponent(suggestion.title)}`}
                        className={cx(
                          "group grid grid-cols-[minmax(0,1fr)_18px] gap-[10px] py-[14px] text-(--ink) no-underline md:flex md:min-h-[180px] md:flex-col md:gap-2 md:pb-[22px] md:pt-6",
                          i === 0 ? "md:pr-7" : "md:px-7"
                        )}
                      >
                        <span className="flex flex-col md:contents">
                          {/* An italic line under the title on phones, a label above it from 768px. */}
                          <span className="order-2 mt-[3px] text-[15px] italic text-(--ink-muted) md:order-none md:mt-0 md:font-mono md:text-[12px] md:uppercase md:not-italic md:tracking-[0.08em]">
                            {suggestion.why.replace(/\.$/, "")}
                            <span className="md:hidden">.</span>
                          </span>
                          <span className="text-[19px] leading-[1.25] md:text-[26px] md:font-medium md:leading-[1.15]">
                            {suggestion.title}
                          </span>
                        </span>
                        <span className="mt-[5px] inline-flex items-center gap-[10px] font-mono text-[14px] font-medium group-hover:text-(--accent) md:mt-auto md:pt-4">
                          <span className="hidden md:inline">Start this series</span>
                          <ArrowIcon size={16} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 md:mt-10 md:border-0 md:border-t md:border-solid md:border-(--rule) md:pt-[18px]">
              <a href="#answers" className={TEXT_LINK}>
                Review your answers · {score} of {total} correct
              </a>
              <Button variant="secondary" size="compact" busy={retaking} onClick={onRetake} className="md:min-h-12 md:px-[18px] md:text-[14px]">
                {best < total ? `Retake to beat ${best}/${total}` : "Retake the check"}
              </Button>
              {retakeAlert && <div className="w-full">{retakeAlert}</div>}
            </div>
          </>
        ) : (
          <div className="mt-[18px] flex flex-wrap items-start gap-x-14 gap-y-8 md:mt-12">
            <section className="min-w-0 flex-[999_1_560px] border-0 border-t-[3px] border-solid border-(--ink) bg-(--paper-raised) px-[18px] py-4 md:bg-transparent md:px-0 md:py-0">
              <h2 className={cx(SECTION_LABEL, "md:mt-[18px]")}>Review these first</h2>
              <ol className="m-0 mt-2 list-none p-0 md:mt-[10px] md:border-0 md:border-b md:border-solid md:border-(--rule)">
                {mastery.review.map((lesson) => (
                  <li
                    key={lesson.number}
                    className="group relative grid grid-cols-[30px_minmax(0,1fr)_18px] items-start gap-2 border-0 border-t border-solid border-(--rule) py-3 md:grid-cols-[48px_minmax(0,1fr)_auto] md:items-center md:gap-4 md:py-5"
                  >
                    <span className="font-mono text-[12px] leading-[22px] text-(--ink-muted) md:text-[14px]">
                      {twoDigits(lesson.number)}
                    </span>
                    <Link
                      href={`${seriesHref}/${lesson.number}`}
                      className="text-[17px] leading-[1.3] text-(--ink) no-underline after:absolute after:inset-0 md:text-[24px] md:font-medium md:leading-[1.2]"
                    >
                      {lesson.title}
                    </Link>
                    <ArrowIcon size={16} className="mt-[3px] md:hidden" />
                    {/* The row is the link. This is its desktop affordance. */}
                    <span
                      aria-hidden="true"
                      className="hidden min-h-11 items-center border-[1.5px] border-solid border-(--ink) px-[14px] font-mono text-[13px] group-hover:bg-(--paper-sunk) md:inline-flex"
                    >
                      Open lesson {lesson.number}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="t-note m-0 mt-[10px] text-(--ink-muted) md:hidden">
                Your retake leans toward these lessons, and toward the checks you got wrong along the way. You can
                retake right now if you prefer.
              </p>
              <p className="m-0 mt-[18px] hidden md:block">
                <a href="#answers" className={TEXT_LINK}>
                  See all five answers
                </a>
              </p>
            </section>

            <aside className="box-border hidden min-w-0 flex-[1_1_340px] border-0 border-t-[3px] border-solid border-(--ink) bg-(--paper-raised) px-[26px] py-6 md:block">
              <h2 className={SECTION_LABEL}>Retake</h2>
              <p className="m-0 mt-[10px] text-[19px] leading-[1.45]">
                Ready now, no review needed. The new check leans toward {lessonList(reviewNumbers)}, and toward the
                checks you got wrong along the way.
              </p>
              <Button size="large" icon fullWidth busy={retaking} onClick={onRetake} className="mt-5">
                Retake the Mastery Check
              </Button>
              <p className="t-note m-0 mt-3 text-(--ink-muted)">Your series stays at 83% until you pass.</p>
              {retakeAlert}
            </aside>
          </div>
        )}

        <Answers mastery={mastery} seriesHref={seriesHref} />
        {/* On phones the retake is in the pinned bar, so its failure shows here. */}
        {!pass && retakeAlert && <div className="md:hidden">{retakeAlert}</div>}
      </div>

      <PhoneActions>
        {pass ? (
          <Button size="large" href={seriesHref}>
            Back to the series
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="large" href={seriesHref} className="flex-none px-4! text-[14px]!">
              Series
            </Button>
            <Button size="large" icon busy={retaking} onClick={onRetake}>
              Retake now
            </Button>
          </>
        )}
      </PhoneActions>
    </PaperPage>
  );
}

/** Every question with the answer given, the right answer and why. */
function Answers({ mastery, seriesHref }: { mastery: Mastery; seriesHref: string }) {
  const questions = mastery.questions ?? [];
  if (questions.length === 0) return null;

  return (
    <section id="answers" className="mt-6 max-w-[760px] scroll-mt-4 md:mt-14">
      <h2 className={cx(SECTION_LABEL, "text-(--ink-muted)")}>Your answers</h2>
      <ol className="m-0 mt-[10px] list-none p-0">
        {questions.map((question, i) => {
          const given = mastery.answers[i];
          const correct = given === question.correctIndex;
          const verdict = correct ? "Correct" : given === "unsure" ? "Not sure" : "Missed";
          const chosen = given === "unsure" ? "Not sure" : given === null ? "No answer" : question.options[given];
          const lesson = question.lessonNumber ?? i + 1;
          return (
            <li key={question.prompt} className="border-0 border-t border-solid border-(--rule) py-[14px] md:py-[18px]">
              <p
                className={cx(
                  "m-0 flex items-center gap-[6px] font-mono text-[11px] font-medium uppercase tracking-[0.06em] md:text-[12px]",
                  correct ? "text-(--correct)" : "text-(--incorrect)"
                )}
              >
                {correct ? <CheckIcon size={12} strokeWidth={3} /> : <CrossIcon size={12} strokeWidth={3} />}
                {i + 1} · {verdict}
              </p>
              <p className="m-0 mt-[6px] text-[17px] leading-[1.35] md:text-[20px]">{question.prompt}</p>
              {!correct && <p className="m-0 mt-[6px] text-[15px] text-(--ink-muted) md:text-[17px]">You said: {chosen}</p>}
              <p className="m-0 mt-1 text-[15px] md:text-[17px]">
                <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.06em] text-(--correct)">Answer</span>{" "}
                {question.options[question.correctIndex]}
              </p>
              <p className="m-0 mt-1 text-[15px] italic text-(--ink-soft) md:text-[17px]">{question.explanation}</p>
              <Link
                href={`${seriesHref}/${lesson}`}
                className="mt-[6px] inline-flex min-h-11 items-center font-mono text-[12px] text-(--ink) underline underline-offset-4 md:text-[13px]"
              >
                Review lesson {lesson}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
