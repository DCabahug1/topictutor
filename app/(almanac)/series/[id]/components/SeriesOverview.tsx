"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { cx } from "@/components/almanac/cx";
import { TrashIcon } from "@/components/almanac/icons";
import { LessonRow, type LessonRowStatus } from "@/components/almanac/LessonRow";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { ProgressMeter, StatusLabel } from "@/components/almanac/StatusLabel";
import { LESSONS_PER_SERIES, almanac, useAlmanac, type Series } from "@/lib/almanac";
import { lessonList } from "./copy";
import { BackLink, PhoneActions, SeriesLoading, SeriesProblem } from "./SeriesStates";

/** Start, continue, take the Mastery Check, or nothing once the series is completed. */
function mainAction(series: Series): { label: string; href: string } | null {
  if (series.masteryPassed) return null;
  if (series.nextLesson) {
    return {
      label: `${series.lessonsDone ? "Continue" : "Start"} · Lesson ${series.nextLesson.number}`,
      href: `/series/${series.id}/${series.nextLesson.number}`,
    };
  }
  // The sample's Mastery Check never opens.
  if (series.isSample) return { label: "Make your own series", href: "/series/new" };
  return { label: "Take the Mastery Check", href: `/series/${series.id}/mastery` };
}

function masteryLine(series: Series): string {
  if (series.isSample) {
    return "The Mastery Check comes with your own series. It opens once every lesson’s check is answered.";
  }
  if (series.masteryPassed) return "Passed. Retake any time to beat your best score.";
  const remaining = series.lessons.filter((lesson) => !lesson.done).map((lesson) => lesson.number);
  if (remaining.length === 0) return "Every check is answered. Five questions from this series, and 4 of 5 passes.";
  return `Unlocks when every lesson’s check is answered. Still to do: ${lessonList(remaining)}.`;
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

  const action = mainAction(series);
  const masteryHref = `/series/${series.id}/mastery`;

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

  const statusOf = (number: number, done: boolean): LessonRowStatus => {
    if (done) return "done";
    // "Up next" only once the series is under way, as drawn.
    return series.lessonsDone > 0 && series.nextLesson?.number === number ? "upNext" : "notStarted";
  };

  return (
    // The phone tab bar gives way to the pinned main action.
    <PaperPage current="library" tabs={!action}>
      <div className={cx(action && "pb-28 md:pb-0")}>
        {series.isSample ? (
          <div
            role="note"
            className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-0 border-t-[3px] border-solid border-(--accent) bg-(--paper-raised) px-4 py-[14px] md:mt-6 md:px-5 md:py-4"
          >
            <p className="m-0 min-w-0 flex-[1_1_320px] text-[16px] leading-[1.45] md:text-[18px]">
              <span className="t-label mr-2 text-(--accent)">Sample series</span>
              Anyone can open it, and the checks work. Your own series is written around your placement test.
            </p>
            <Link
              href="/series/new"
              className="inline-flex min-h-[46px] items-center border-[1.5px] border-solid border-(--ink) px-4 font-mono text-[13px] text-(--ink) no-underline hover:bg-(--paper-sunk)"
            >
              Make your own series
            </Link>
          </div>
        ) : (
          user && <BackLink href="/library">Library</BackLink>
        )}

        <div
          className={cx(
            "flex flex-wrap items-end gap-x-[72px] gap-y-[18px] md:gap-y-8",
            series.isSample ? "mt-6 md:mt-9" : user ? "mt-2 md:mt-4" : "mt-6 md:mt-9"
          )}
        >
          <div className="min-w-0 flex-[999_1_560px]">
            <p className="t-label m-0 flex flex-wrap items-center gap-2">
              <span className="text-(--accent)">{series.category}</span>
              <span aria-hidden="true" className="text-(--ink-muted)">
                ·
              </span>
              <StatusLabel status={series.status} />
            </p>
            <h1 className="m-0 mt-3 max-w-[900px] text-[34px] font-medium leading-[1.05] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(36px,4.6vw,64px)] md:leading-none md:tracking-[-0.025em]">
              {series.title}
            </h1>
            <p className="m-0 mt-[10px] max-w-[680px] text-[17px] leading-normal text-(--ink-soft) md:mt-4 md:text-[20px]">
              {series.description}
            </p>
            {series.focusLine && (
              <p className="t-note m-0 mt-2 max-w-[680px] text-(--ink-muted) md:mt-[10px] md:text-[17px]">
                {series.focusLine}
              </p>
            )}
          </div>

          <div className="min-w-0 flex-[1_1_320px]">
            <div className="flex items-baseline justify-between gap-3 font-mono text-[13px]">
              <span className="text-(--ink-muted)">
                {series.lessonsDone} of {LESSONS_PER_SERIES} lessons · Mastery Check
              </span>
              <span className="font-medium md:text-[30px] md:leading-none">{series.percent}%</span>
            </div>
            <ProgressMeter
              lessonsDone={series.lessonsDone}
              passed={series.masteryPassed}
              showPercent={false}
              className="mt-2 md:mt-[10px] md:[&_[role=img]>span]:h-[10px]"
            />
            {action && (
              // On phones the same action is pinned to the bottom of the screen.
              <div className="mt-[18px] hidden md:block">
                <Button size="large" icon fullWidth href={action.href}>
                  {action.label}
                </Button>
              </div>
            )}
            {series.masteryPassed && (
              <div className="mt-[18px] border-[1.5px] border-solid border-(--correct) bg-(--correct-wash) px-4 py-[14px]">
                <StatusLabel
                  status="completed"
                  label={`Mastery Check passed · best ${series.masteryBest ?? LESSONS_PER_SERIES}/${LESSONS_PER_SERIES}`}
                />
                <div className="mt-[10px]">
                  <Button variant="secondary" size="compact" busy={retaking} onClick={retake}>
                    Retake the check
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <ol className="m-0 mt-[18px] list-none border-0 border-t border-solid border-(--rule) p-0 md:mt-12 md:border-t-[3px] md:border-(--ink)">
          {series.lessons.map((lesson) => (
            <LessonRow
              key={lesson.number}
              number={lesson.number}
              title={lesson.title}
              description={lesson.description}
              why={lesson.why}
              focus={lesson.focus}
              status={statusOf(lesson.number, lesson.done)}
              href={`/series/${series.id}/${lesson.number}`}
            />
          ))}
        </ol>

        {/* A ruled row on phones, a dashed box from 768px. */}
        <div className="-mt-px flex flex-wrap items-center justify-between gap-4 border-0 border-t-[3px] border-solid border-(--ink) pb-[6px] pt-4 md:mt-7 md:border-[1.5px] md:border-dashed md:border-(--ink-muted) md:px-6 md:py-[22px]">
          <div className="min-w-0">
            <h2 className="t-label m-0">Mastery Check</h2>
            <p className="m-0 mt-[6px] text-[16px] leading-[1.45] text-(--ink-soft) md:text-[18px]">
              {masteryLine(series)}
            </p>
          </div>
          <p className="m-0 hidden font-mono text-[13px] text-(--ink-muted) md:block">
            {series.isSample ? "Sample · checks work, no account needed" : "5 questions · pass with 4"}
          </p>
        </div>

        {(user || !series.isSample) && (
          <div className="mt-[22px] flex flex-wrap items-center justify-between gap-x-4 gap-y-1 md:mt-8 md:justify-end">
            {user ? (
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center font-mono text-[13px] text-(--ink) underline underline-offset-4 md:hidden"
              >
                Back to Library
              </Link>
            ) : (
              <span />
            )}
            {!series.isSample && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-mono text-[13px] text-(--incorrect) md:px-1"
              >
                <TrashIcon size={15} />
                Delete series
              </button>
            )}
            {deleteFailed && (
              <p role="alert" className="m-0 w-full text-[15px] text-(--incorrect) md:text-right">
                The series wasn’t deleted. Try again.
              </p>
            )}
          </div>
        )}
      </div>

      {action && (
        <PhoneActions>
          <Button size="large" icon href={action.href}>
            {action.label}
          </Button>
        </PhoneActions>
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
