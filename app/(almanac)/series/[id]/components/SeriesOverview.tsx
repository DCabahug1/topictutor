"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { LessonRow, type LessonRowStatus } from "@/components/almanac/LessonRow";
import { PaperPage } from "@/components/almanac/Page";
import { ProgressMeter } from "@/components/almanac/ProgressMeter";
import { Section } from "@/components/almanac/Section";
import { useSession } from "@/components/almanac/SessionProvider";
import { LESSONS_PER_SERIES, almanac, useAlmanac, type Series } from "@/lib/almanac";
import { BackLink, SeriesLoading, SeriesProblem } from "./SeriesStates";

const STATUS_WORD = { notStarted: "not started", inProgress: "in progress", completed: "✓ completed" } as const;

/** The one sentence under the title. */
function leadLine(series: Series): string {
  if (series.isSample) return `${series.description} Your own series is written around your placement test.`;
  if (series.masteryPassed) return `Passed with ${series.masteryBest ?? LESSONS_PER_SERIES} of 5. Retake any time to beat it.`;
  const next = series.nextLesson;
  if (!next) return "Every check is answered. The Mastery Check is open.";
  if (series.lessonsDone === 0) return series.description;
  const row = series.lessons.find((lesson) => lesson.number === next.number);
  return `Up next is lesson ${next.number}: ${next.title}.${row?.focus ? " It’s one your placement test flagged." : ""}`;
}

export function SeriesOverview() {
  const { id } = useParams<{ id: string }>();
  const user = useSession();
  const router = useRouter();
  const { data: series, error, reload } = useAlmanac(() => almanac.getSeries(id), [id]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [retaking, setRetaking] = useState(false);

  if (error) return <SeriesProblem notFound={error.kind === "notFound"} what="series" onRetry={reload} />;
  if (!series) return <SeriesLoading label="Loading the series" />;

  const masteryHref = `/series/${series.id}/mastery`;
  const next = series.nextLesson;
  const masteryOpen = !next;

  const remove = async () => {
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await almanac.deleteSeries(series.id);
      // The Library is for signed-in learners. A guest goes back to the start.
      router.push(user ? "/library" : "/");
    } catch {
      setDeleting(false);
      setConfirming(false);
      setDeleteFailed(true);
    }
  };

  const retake = async () => {
    setRetaking(true);
    // If the reset fails, the Mastery Check page still offers the retake.
    await almanac.retakeMastery(series.id).catch(() => {});
    router.push(masteryHref);
  };

  const primary = next ? (
    <Button icon href={`/series/${series.id}/${next.number}`}>
      {series.lessonsDone ? `Continue with lesson ${next.number}` : `Start lesson ${next.number}`}
    </Button>
  ) : series.isSample ? (
    <Button icon href="/series/new">
      Make your own series
    </Button>
  ) : series.masteryPassed ? (
    <Button icon href="/series/new">
      Start a new series
    </Button>
  ) : (
    <Button icon href={masteryHref}>
      Take the Mastery Check
    </Button>
  );

  const quiet = series.isSample ? (
    next ? (
      <Button variant="quiet" href="/series/new">
        or make your own series
      </Button>
    ) : undefined
  ) : series.masteryPassed ? (
    <Button variant="quiet" busy={retaking} onClick={retake}>
      or retake the Mastery Check
    </Button>
  ) : undefined;

  const statusOf = (number: number, done: boolean): LessonRowStatus => {
    if (done) return "done";
    return next?.number === number ? "upNext" : "notStarted";
  };

  const masterySub = series.isSample
    ? "Comes with your own series."
    : series.masteryPassed
      ? `✓ Passed · best ${series.masteryBest ?? LESSONS_PER_SERIES}/5`
      : masteryOpen
        ? "Open now. Five questions from your lessons."
        : "Opens when every lesson check is answered.";

  return (
    <PaperPage current="library">
      {user && !series.isSample && <BackLink href="/library">Library</BackLink>}

      <section className={user && !series.isSample ? "mt-10 md:mt-16" : "mt-(--lead-top)"}>
        <LeadBlock
          size="sm"
          eyebrow={
            series.isSample
              ? "Sample series · checks work, no account needed"
              : `${series.category} · ${STATUS_WORD[series.status]}`
          }
          title={series.title}
          line={leadLine(series)}
          className="max-w-[860px]"
          primary={primary}
          quiet={quiet}
        >
          <ProgressMeter lessonsDone={series.lessonsDone} />
        </LeadBlock>
      </section>

      <Section title="Lessons" className="mt-[72px]! md:mt-[120px]!">
        <ol className="m-0 list-none p-0">
          {series.lessons.map((lesson) => {
            const status = statusOf(lesson.number, lesson.done);
            const startHere = status === "upNext" && series.lessonsDone === 0;
            return (
              <LessonRow
                key={lesson.number}
                number={lesson.number}
                title={lesson.title}
                why={startHere ? undefined : lesson.why}
                focus={lesson.focus}
                status={status}
                tag={startHere ? <span className="text-(--accent)">○ Start here</span> : undefined}
                href={`/series/${series.id}/${lesson.number}`}
              />
            );
          })}
          <LessonRow
            marker="◇"
            title="Mastery Check"
            sub={masterySub}
            status="notStarted"
            tag="5 questions · pass with 4"
            muted={series.isSample || !masteryOpen}
            href={series.isSample ? undefined : masteryHref}
          />
        </ol>
      </Section>

      {!series.isSample && (
        <p className="m-0 mt-12">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] text-(--ink-muted) underline underline-offset-4 hover:text-(--incorrect)"
          >
            Delete series
          </button>
        </p>
      )}
      {deleteFailed && (
        <p role="alert" className="m-0 mt-2 text-[16px] text-(--incorrect)">
          The series wasn’t deleted. Try again.
        </p>
      )}

      {!series.isSample && (
        <ConfirmDialog
          open={confirming}
          title={`Delete “${series.title}”?`}
          body="Its lessons, your progress and any Mastery Check score go with it. This can’t be undone."
          confirmLabel="Delete series"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      )}
    </PaperPage>
  );
}
