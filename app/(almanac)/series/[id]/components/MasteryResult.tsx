"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { LessonRow } from "@/components/almanac/LessonRow";
import { Markdown } from "@/components/almanac/Markdown";
import { PaperPage } from "@/components/almanac/Page";
import { ScoreNumeral } from "@/components/almanac/ScoreNumeral";
import { Section } from "@/components/almanac/Section";
import { LESSONS_PER_SERIES, percentComplete, prefersReducedMotion, type Mastery } from "@/lib/almanac";
import { lessonList, passHeadline, shortTitle } from "./copy";
import { BackLink } from "./SeriesStates";

type MasteryResultProps = {
  /** Status passed or failed. */
  mastery: Mastery;
  /** True when the learner has just submitted: the headline then takes focus. */
  focusHeading?: boolean;
  onRetake: () => void;
  retaking: boolean;
  retakeFailed: boolean;
};

const COUNT_WORDS = ["none", "one", "two", "three", "four", "five"];

/** The score after a Mastery Check: one next step, then the rows that back it up. */
export function MasteryResult({ mastery, focusHeading = false, onRetake, retaking, retakeFailed }: MasteryResultProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  useEffect(() => {
    if (focusHeading) heading.current?.focus();
  }, [focusHeading]);

  const pass = mastery.status === "passed";
  const score = mastery.lastScore ?? 0;
  const best = mastery.best ?? score;
  const questions = mastery.questions ?? [];
  const total = questions.length || LESSONS_PER_SERIES;
  const seriesHref = `/series/${mastery.seriesId}`;
  const missedCount = total - score;
  const reviewNumbers = mastery.review.map((lesson) => lesson.number);
  const [nextSeries, ...others] = mastery.suggestions;

  /** Opens the answers and takes the reader there, every time it's pressed. */
  const reviewAnswers = () => {
    flushSync(() => setShowAnswers(true));
    // Focus first: moving focus during a smooth scroll can cut the scroll short.
    const answersHeading = document.getElementById("answers-heading");
    if (answersHeading) {
      answersHeading.tabIndex = -1;
      answersHeading.focus({ preventScroll: true });
    }
    document
      .getElementById("answers")
      ?.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  const retakeAlert = retakeFailed && (
    <p role="alert" className="m-0 mt-4 text-[16px] text-(--incorrect)">
      The retake didn’t start. Try again.
    </p>
  );

  /** The italic line under a lesson in the review: what was picked, and what to look at. */
  const reviewLine = (lessonNumber: number): ReactNode => {
    const i = questions.findIndex((q, at) => (q.lessonNumber ?? at + 1) === lessonNumber && mastery.answers[at] !== q.correctIndex);
    if (i < 0) return undefined;
    const given = mastery.answers[i];
    const said =
      given === "unsure" ? "You weren’t sure." : given === null ? "No answer." : `You picked “${questions[i].options[given]}”.`;
    return <Markdown mode="inline">{`${said} ${questions[i].explanation}`}</Markdown>;
  };

  const eyebrow = pass ? (
    <span className="text-(--correct)">Mastery Check · attempt {mastery.attempts} · ✓ Passed</span>
  ) : (
    <span className="text-(--ink-muted)">Mastery Check · attempt {mastery.attempts} · ✕ Not yet</span>
  );

  const answersSection = showAnswers && (
    <Section id="answers" title="Your answers">
      <ol className="m-0 list-none p-0">
        {questions.map((question, i) => {
          const given = mastery.answers[i];
          const correct = given === question.correctIndex;
          const chosen = given === "unsure" ? "Not sure" : given === null ? "No answer" : question.options[given];
          return (
            <LessonRow
              key={question.prompt}
              number={i + 1}
              title={<Markdown mode="inline">{question.prompt}</Markdown>}
              status="notStarted"
              sub={<Markdown mode="inline">{`${correct ? "" : `You said: ${chosen}. `}Answer: ${question.options[question.correctIndex]}.`}</Markdown>}
              tag={
                correct ? (
                  <span className="text-(--correct)">✓ Right</span>
                ) : (
                  <span className="text-(--incorrect)">✕ Missed</span>
                )
              }
              href={`${seriesHref}/${question.lessonNumber ?? i + 1}`}
            />
          );
        })}
      </ol>
    </Section>
  );

  if (pass) {
    return (
      <PaperPage current="library">
        <BackLink href={seriesHref}>{shortTitle(mastery.seriesTitle)}</BackLink>
        <section className="mt-10 md:mt-16">
          <LeadBlock
            size="sm"
            eyebrow={eyebrow}
            numeral={<ScoreNumeral score={score} total={total} />}
            title={passHeadline(mastery.seriesTitle)}
            focusRef={heading}
            line={`Series complete${mastery.attempts === 1 ? ", on your first try" : ""}. Your best score is ${best} of ${total}.`}
            className="max-w-[860px]"
            primary={
              nextSeries ? (
                <Button icon href={`/series/new?topic=${encodeURIComponent(nextSeries.title)}`}>
                  Start the next series
                </Button>
              ) : (
                <Button icon href="/series/new">
                  Start a new series
                </Button>
              )
            }
            quiet={
              <>
                <Button variant="quiet" onClick={reviewAnswers}>
                  or review your answers
                </Button>
                {best < total && (
                  <Button variant="quiet" busy={retaking} onClick={onRetake}>
                    or retake to beat {best}/{total}
                  </Button>
                )}
              </>
            }
          >
            {nextSeries && (
              <p className="m-0 text-[17px] italic text-(--ink-muted)">
                Next: <span className="not-italic text-(--ink)">{nextSeries.title}</span>, {nextSeries.why.charAt(0).toLowerCase() + nextSeries.why.slice(1)}
              </p>
            )}
          </LeadBlock>
          {retakeAlert}
        </section>

        {others.length > 0 && (
          <Section title="Or try one of these" className="mt-[72px]! md:mt-[120px]!">
            <ol className="m-0 list-none p-0">
              {others.map((suggestion) => (
                <LessonRow
                  key={suggestion.title}
                  marker="→"
                  title={suggestion.title}
                  sub={suggestion.why}
                  status="notStarted"
                  tag=""
                  href={`/series/new?topic=${encodeURIComponent(suggestion.title)}`}
                />
              ))}
            </ol>
          </Section>
        )}
        {answersSection}
      </PaperPage>
    );
  }

  const firstReview = mastery.review[0];
  return (
    <PaperPage current="library">
      <BackLink href={seriesHref}>{shortTitle(mastery.seriesTitle)}</BackLink>
      <section className="mt-10 md:mt-16">
        <LeadBlock
          size="sm"
          eyebrow={eyebrow}
          numeral={<ScoreNumeral score={score} total={total} />}
          title={score === total - 2 ? "Close. Passing is 4 of 5." : "Not yet. Passing is 4 of 5."}
          focusRef={heading}
          line={
            reviewNumbers.length
              ? `The ${COUNT_WORDS[missedCount] ?? missedCount} you missed ${missedCount === 1 ? "comes" : "come"} from ${lessonList(reviewNumbers)}. A short look back usually does it.`
              : "A short look back usually does it."
          }
          className="max-w-[860px]"
          primary={
            firstReview ? (
              <Button icon href={`${seriesHref}/${firstReview.number}`}>
                Review lesson {firstReview.number}
              </Button>
            ) : (
              <Button icon busy={retaking} onClick={onRetake}>
                Retake the check
              </Button>
            )
          }
          quiet={
            firstReview ? (
              <Button variant="quiet" busy={retaking} onClick={onRetake}>
                or retake the check now
              </Button>
            ) : undefined
          }
        />
        {retakeAlert}
      </section>

      {mastery.review.length > 0 && (
        <Section title="Review these first" className="mt-[72px]! md:mt-[120px]!">
          <ol className="m-0 list-none p-0">
            {mastery.review.map((lesson) => (
              <LessonRow
                key={lesson.number}
                number={lesson.number}
                title={lesson.title}
                sub={reviewLine(lesson.number)}
                status="notStarted"
                tag={<span className="text-(--incorrect)">✕ Missed</span>}
                href={`${seriesHref}/${lesson.number}`}
              />
            ))}
          </ol>
          <p className="m-0 mt-5 text-[17px] italic text-(--ink-muted)">
            The retake leans toward {lessonList(reviewNumbers)}.{" "}
            {mastery.everPassed
              ? `Your series stays complete, and your best is still ${best} of ${total}.`
              : `Your series stays at ${percentComplete(LESSONS_PER_SERIES, false)}% until you pass.`}
          </p>
        </Section>
      )}
    </PaperPage>
  );
}
