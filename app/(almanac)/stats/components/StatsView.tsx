"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { cx } from "@/components/almanac/cx";
import { CheckIcon, CrossIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { StatBars } from "@/components/almanac/StatBars";
import {
  almanac,
  joinList,
  localDate,
  masteryPassed,
  parseLocalDate,
  shiftDate,
  useAlmanac,
  type Stats,
  type Streak,
  type Subject,
} from "@/lib/almanac";

const SECTION = "min-w-0 border-0 border-t-[3px] border-solid border-(--ink) pt-4";
const HEADING = "t-label m-0 text-(--ink-muted)";
const NOTE = "m-0 text-[17px] leading-[1.45] text-(--ink-soft)";
const ROW = "flex flex-wrap gap-7 md:gap-x-14 md:gap-y-10";
const MASTERY_QUESTIONS = 5;

const lessons = (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`;
const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** "Since September 24. Your longest was 52 days. Today still counts until midnight." */
function streakLine(streak: Streak): string {
  // A streak that doesn't include today yet ends yesterday.
  const first = shiftDate(localDate(), -(streak.count - (streak.todayDone ? 1 : 0)));
  const since = parseLocalDate(first).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return [
    `Since ${since}.`,
    streak.longest > streak.count ? `Your longest was ${days(streak.longest)}.` : "This is your longest so far.",
    !streak.todayDone && "Today still counts until midnight.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function StatsView() {
  const { data: stats, error, reload } = useAlmanac(() => almanac.getStats(), []);
  // Extras for two lines of copy. The page stands without them if they fail.
  const { data: subjects } = useAlmanac(() => almanac.getSubjects(), []);
  const { data: series } = useAlmanac(() => almanac.listSeries(), []);

  if (error) {
    return (
      <Notice
        className="mt-6 max-w-[640px] md:mt-10"
        tone="error"
        kicker="Couldn’t load"
        title="Your stats didn’t load."
        body="It’s probably the connection. Nothing was lost."
        primary={{ label: "Try again", onClick: reload }}
        secondary={{ label: "Go to Today", href: "/today" }}
      />
    );
  }

  if (!stats) return <Loading />;

  const started = series?.filter((s) => !s.isSample).length ?? 0;

  return (
    <>
      <div className={cx(ROW, "mt-6 items-stretch md:mt-10")}>
        <StreakSection streak={stats.streak} everFinished={stats.totalLessons > 0} />
        <WeekSection days={stats.lastSevenDays} />
        <RecallSection recall={stats.recall} />
      </div>
      <div className={cx(ROW, "mt-6 items-start md:mt-10")}>
        <SeriesSection stats={stats} started={started} />
        <SubjectSection stats={stats} picked={subjects ?? []} />
      </div>
    </>
  );
}

function Loading() {
  return (
    <div aria-busy="true" className={cx(ROW, "mt-6 md:mt-10")}>
      <p role="status" className="sr-only">
        Loading your stats
      </p>
      {["380px", "380px", "300px"].map((basis, i) => (
        <div key={i} aria-hidden="true" className={SECTION} style={{ flex: `1 1 ${basis}` }}>
          <div className="h-3 w-28 bg-(--paper-sunk)" />
          <div className="mt-4 h-[120px] bg-(--paper-sunk)" />
        </div>
      ))}
    </div>
  );
}

function StreakSection({ streak, everFinished }: { streak: Streak; everFinished: boolean }) {
  return (
    <section aria-labelledby="st-streak" className={cx(SECTION, "flex-[1_1_380px]")}>
      <h2 id="st-streak" className={HEADING}>
        Streak
      </h2>
      {streak.count > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-x-[14px] gap-y-3">
            <p className="m-0 text-[120px] font-medium leading-[0.82] tracking-[-0.05em] text-(--accent) md:text-[200px]">
              {streak.count}
            </p>
            <p className="m-0 mb-[10px] font-mono text-[13px] uppercase tracking-[0.06em] text-(--ink-muted)">
              {streak.count === 1 ? "day in a row" : "days in a row"}
            </p>
          </div>
          <p className="m-0 mt-4 text-[18px] leading-[1.45] text-(--ink-soft)">{streakLine(streak)}</p>
        </>
      ) : (
        // Zero is muted, never a warning.
        <div className="mt-[14px] border-[1.5px] border-dashed border-(--ink-muted) p-6">
          <p className="m-0 text-[88px] font-medium leading-[0.85] tracking-[-0.04em] text-(--ink-muted) md:text-[120px]">
            0
          </p>
          <p className="m-0 mt-[14px] text-[22px] font-medium leading-tight">
            {everFinished ? "No streak right now." : "No streak yet."}
          </p>
          <p className={cx(NOTE, "mt-[6px]")}>
            Finish today’s lesson and this becomes 1. Any lesson counts, daily or series.
          </p>
          <Button href="/today/lesson" className="mt-4">
            Start today’s lesson
          </Button>
        </div>
      )}
    </section>
  );
}

function WeekSection({ days: week }: { days: Stats["lastSevenDays"] }) {
  const total = week.reduce((sum, day) => sum + day.count, 0);
  return (
    <section aria-labelledby="st-week" className={cx(SECTION, "flex-[1_1_380px]")}>
      <h2 id="st-week" className={HEADING}>
        Lessons finished · last 7 days
      </h2>
      <p className="m-0 mt-[10px] font-mono text-[30px] font-medium">{lessons(total)}</p>
      <StatBars
        className="mt-[10px]"
        layout="columns"
        title="Lessons finished"
        // One lesson a day shouldn't fill the chart.
        max={3}
        bars={week.map((day) => ({
          label: day.isToday ? "Today" : day.short,
          spoken: day.isToday ? "Today" : day.name,
          value: day.count,
          current: day.isToday,
        }))}
      />
    </section>
  );
}

function RecallSection({ recall }: { recall: Stats["recall"] }) {
  const percent = recall.total ? Math.round((recall.correct / recall.total) * 100) : 0;
  return (
    <section aria-labelledby="st-recall" className={cx(SECTION, "flex-[1_1_300px]")}>
      <h2 id="st-recall" className={HEADING}>
        Recall accuracy
      </h2>
      {recall.total > 0 ? (
        <>
          <p className="m-0 mt-[10px] font-mono text-[56px] font-medium leading-none tracking-[-0.03em]">{percent}%</p>
          <div
            role="img"
            aria-label={`${recall.correct} of ${recall.total} recall questions right`}
            className="mt-[14px] h-[10px] border border-solid border-(--ink)"
          >
            <div className="h-full bg-(--ink)" style={{ width: `${percent}%` }} />
          </div>
          <p className={cx(NOTE, "mt-3")}>
            {recall.total === 1
              ? `Your first recall question was ${recall.correct ? "right" : "wrong"}.`
              : `${recall.correct} of your ${recall.total} recall questions were right.`}{" "}
            That’s how much of earlier lessons is still with you.
          </p>
        </>
      ) : (
        <>
          <p className="m-0 mt-[10px] font-mono text-[40px] font-medium leading-[1.2] text-(--ink-muted)">Not yet</p>
          <p className={cx(NOTE, "mt-3")}>Starts with your second lesson, when there’s something to recall.</p>
        </>
      )}
    </section>
  );
}

function SeriesSection({ stats, started }: { stats: Stats; started: number }) {
  const scores = stats.masteryScores;
  return (
    <section aria-labelledby="st-series" className={cx(SECTION, "flex-[1_1_380px]")}>
      <h2 id="st-series" className={HEADING}>
        Series completed
      </h2>
      <p className={cx("m-0 mt-[10px] font-mono text-[30px] font-medium", scores.length === 0 && "text-(--ink-muted)")}>
        {stats.seriesCompleted}
        {started > 0 && <span className="text-[16px] text-(--ink-muted)"> of {started} started</span>}
      </p>
      {scores.length > 0 ? (
        <>
          <h3 className="m-0 mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-(--ink-muted)">
            Mastery Check scores
          </h3>
          <ul className="m-0 mt-2 list-none border-0 border-b border-solid border-(--rule) p-0">
            {scores.map((score) => {
              const passed = masteryPassed(score.best);
              return (
                <li
                  key={score.seriesId}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-0 border-t border-solid border-(--rule) py-3"
                >
                  <span className="text-[17px] leading-[1.3]">{score.title}</span>
                  <span
                    className={cx(
                      "inline-flex items-center gap-[5px] self-start font-mono text-[14px] font-medium",
                      passed ? "text-(--correct)" : "text-(--incorrect)"
                    )}
                  >
                    {passed ? <CheckIcon size={12} strokeWidth={2.8} /> : <CrossIcon size={12} strokeWidth={2.8} />}
                    {score.best}/{MASTERY_QUESTIONS}
                    {passed ? <span className="sr-only">, passed</span> : " · retake ready"}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <p className={cx(NOTE, "mt-2")}>
            Finish all five lessons of a series and pass its Mastery Check to complete it. Scores appear here.
          </p>
          <Link
            href="/series/new"
            className="mt-[10px] inline-flex min-h-11 items-center font-mono text-[13px] text-(--ink) underline underline-offset-4"
          >
            Start a series
          </Link>
        </>
      )}
    </section>
  );
}

function SubjectSection({ stats, picked }: { stats: Stats; picked: Subject[] }) {
  return (
    <section aria-labelledby="st-cat" className={cx(SECTION, "flex-[1_1_520px]")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="st-cat" className={HEADING}>
          By subject
        </h2>
        <span className="font-mono text-[12px] text-(--ink-muted)">
          {stats.totalLessons ? lessons(stats.totalLessons) : "No lessons yet"}
        </span>
      </div>
      {stats.bySubject.length > 0 ? (
        <StatBars
          className="mt-3"
          layout="rows"
          title="Lessons by subject"
          bars={stats.bySubject.map((row) => ({ label: row.subject, value: row.lessons }))}
        />
      ) : (
        <p className={cx(NOTE, "mt-3")}>
          Your lessons will add up here by subject.
          {picked.length > 0 &&
            ` You picked ${joinList(picked)}, so ${picked.length === 1 ? "that comes" : "those come"} first.`}
        </p>
      )}
    </section>
  );
}
