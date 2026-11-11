"use client";

import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
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
import { runLength, spellOut } from "../../today/lesson/components/copy";

const MASTERY_QUESTIONS = 5;
const LABEL = "m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-(--ink-muted)";
const BIG = "after-eyebrow big-numeral m-0 font-serif text-[80px] font-medium leading-[0.9] tracking-[-0.04em] md:text-[112px]";

const lessons = (n: number) => `${n} ${n === 1 ? "lesson" : "lessons"}`;

/** "Almost two weeks without a miss." for 13. Same rule as the Finish screen (runLength). */
function streakHeadline(count: number): string {
  if (count === 0) return "No streak right now.";
  if (count === 1) return "Day one.";
  return `${runLength(count) ?? `${spellOut(count)} days in a row`}.`;
}

/** "Since September 24", the first day of the streak. */
function since(streak: Streak): string {
  // A streak that doesn't include today yet ends yesterday.
  const first = shiftDate(localDate(), -(streak.count - (streak.todayDone ? 1 : 0)));
  return parseLocalDate(first).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export function StatsView() {
  const { data: stats, error, reload } = useAlmanac(() => almanac.getStats(), []);
  // Extras for two lines of copy. The page stands without them if they fail.
  const { data: subjects } = useAlmanac(() => almanac.getSubjects(), []);
  const { data: series } = useAlmanac(() => almanac.listSeries(), []);

  if (error) {
    return (
      <Notice
        className="mt-(--lead-top) max-w-[780px]"
        tone="error"
        kicker="Couldn’t load"
        title="Your stats didn’t load."
        body="It’s probably the connection. Nothing was lost."
        primary={{ label: "Try again", onClick: reload }}
        secondary={{ label: "or go to Today", href: "/today" }}
      />
    );
  }

  if (!stats) {
    return (
      <div aria-busy="true" className="mt-(--lead-top)">
        <p role="status" className="sr-only">
          Loading your stats
        </p>
        <div aria-hidden="true" className="flex flex-col gap-4">
          <span className="h-3 w-48 bg-(--paper-sunk)" />
          <span className="h-28 w-40 bg-(--paper-sunk)" />
          <span className="h-14 w-[70%] max-w-[640px] bg-(--paper-sunk)" />
        </div>
      </div>
    );
  }

  const { streak } = stats;
  const started = series?.filter((s) => !s.isSample).length ?? 0;
  const week = stats.lastSevenDays.reduce((sum, day) => sum + day.count, 0);
  const recallPercent = stats.recall.total ? Math.round((stats.recall.correct / stats.recall.total) * 100) : 0;

  const line = streak.count
    ? `${streak.longest > streak.count ? `Your longest was ${streak.longest}.` : "This is your longest so far."}${
        streak.todayDone ? "" : " Today still counts until midnight."
      }`
    : "Finish today’s lesson and this becomes 1. Any lesson counts, daily or series.";

  return (
    <>
      <section className="mt-(--lead-top)">
        <LeadBlock
          eyebrow={streak.count ? `Streak · since ${since(streak)}` : "Streak"}
          numeral={
            <p
              className={`m-0 font-serif text-[120px] font-medium leading-[0.85] tracking-[-0.05em] md:text-[180px] ${
                streak.count ? "text-(--ink)" : "text-(--ink-muted)"
              }`}
            >
              {streak.count}
              <span className="sr-only"> day streak</span>
            </p>
          }
          title={streakHeadline(streak.count)}
          size="sm"
          line={line}
          className="max-w-[920px]"
          primary={
            streak.todayDone ? undefined : (
              <Button icon href="/today/lesson">
                Start today’s lesson
              </Button>
            )
          }
        />
      </section>

      <section aria-labelledby="st-week" className="mt-(--section-gap)">
        <h2 id="st-week" className="t-section m-0">
          {week === 0 ? "No lessons this week yet" : `${lessons(week)} this week`}
        </h2>
        <StatBars
          className="mt-10"
          layout="columns"
          title="Lessons finished"
          // One lesson a day shouldn't fill the chart.
          max={3}
          bars={stats.lastSevenDays.map((day) => ({
            label: day.isToday ? "Today" : day.short,
            spoken: day.isToday ? "Today" : day.name,
            value: day.count,
            current: day.isToday,
          }))}
        />
      </section>

      <div className="mt-(--section-gap) grid grid-cols-1 gap-x-[72px] gap-y-16 md:grid-cols-2">
        <section aria-labelledby="st-recall" className="min-w-0">
          <h2 id="st-recall" className={LABEL}>
            Recall accuracy
          </h2>
          {stats.recall.total > 0 ? (
            <>
              <p className={BIG}>{recallPercent}%</p>
              <div
                role="img"
                aria-label={`${stats.recall.correct} of ${stats.recall.total} recall questions right`}
                className="mt-7 h-[5px] bg-(--paper-sunk)"
              >
                <div className="h-full bg-(--ink)" style={{ width: `${recallPercent}%` }} />
              </div>
              <p className="m-0 mt-4 text-[17px] text-(--ink-soft)">
                {stats.recall.total === 1
                  ? `Your first recall question was ${stats.recall.correct ? "right" : "wrong"}.`
                  : `${stats.recall.correct} of your ${stats.recall.total} recall questions were right.`}
              </p>
            </>
          ) : (
            <>
              <p className={`${BIG} text-(--ink-muted)`}>Not yet</p>
              <p className="m-0 mt-4 text-[17px] text-(--ink-soft)">
                Starts with your second lesson, when there’s something to recall.
              </p>
            </>
          )}
        </section>

        <section aria-labelledby="st-series" className="min-w-0">
          <h2 id="st-series" className={LABEL}>
            Series completed
          </h2>
          <p className={`${BIG} ${stats.seriesCompleted ? "" : "text-(--ink-muted)"}`}>
            {stats.seriesCompleted}
            {started > 0 && (
              <span className="ml-3 text-[32px] tracking-[-0.01em] text-(--ink-muted) md:text-[40px]">of {started} started</span>
            )}
          </p>
          {stats.masteryScores.length > 0 ? (
            <ul className="m-0 mt-7 list-none border-0 border-t border-solid border-(--ink) p-0">
              {stats.masteryScores.map((score) => {
                const passed = masteryPassed(score.best);
                return (
                  <li
                    key={score.seriesId}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-0 border-b border-solid border-(--rule) py-3"
                  >
                    <span className="text-[17px] leading-[1.3]">{score.title}</span>
                    {passed ? (
                      <span className="font-mono text-[13px]">
                        {score.best}/{MASTERY_QUESTIONS}
                        <span className="sr-only">, passed</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[13px] text-(--accent)">
                        Retake ready<span className="sr-only">, best {score.best} of {MASTERY_QUESTIONS}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="m-0 mt-4 text-[17px] text-(--ink-soft)">
              Pass a series’ Mastery Check to complete it. Scores appear here.{" "}
              <Button variant="quiet" href="/series/new" className="min-h-0! text-[17px]!">
                Start a series
              </Button>
            </p>
          )}
        </section>
      </div>

      <SubjectSection stats={stats} picked={subjects ?? []} />
    </>
  );
}

function SubjectSection({ stats, picked }: { stats: Stats; picked: Subject[] }) {
  return (
    <section aria-labelledby="st-cat" className="mt-(--section-gap)">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="st-cat" className="t-section m-0">
          By subject
        </h2>
        <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-(--ink-muted)">
          {stats.totalLessons ? lessons(stats.totalLessons) : "No lessons yet"}
        </span>
      </div>
      {stats.bySubject.length > 0 ? (
        <StatBars
          className="mt-5"
          layout="rows"
          title="Lessons by subject"
          bars={stats.bySubject.map((row) => ({ label: row.subject, value: row.lessons }))}
        />
      ) : (
        <p className="m-0 mt-4 text-[17px] text-(--ink-soft)">
          Your lessons will add up here by subject.
          {picked.length > 0 &&
            ` You picked ${joinList(picked)}, so ${picked.length === 1 ? "that comes" : "those come"} first.`}
        </p>
      )}
    </section>
  );
}
