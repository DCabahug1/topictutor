"use client";

import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { LeadActions, LeadBlock } from "@/components/almanac/LeadBlock";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { Section } from "@/components/almanac/Section";
import { SeriesRow } from "@/components/almanac/SeriesRow";
import { useSession } from "@/components/almanac/SessionProvider";
import { StreakMark } from "@/components/almanac/StreakMark";
import { almanac, useAlmanac, type DailySession, type SeriesSummary } from "@/lib/almanac";
import { MoreTopics } from "./lesson/components/MoreTopics";
import { OwnTopicStart } from "./lesson/components/OwnTopicStart";

function timeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The sentence under today's title. */
function leadLine(session: DailySession, isNew: boolean, started: boolean): string {
  const { lesson, recall } = session;
  if (session.finishedAt) {
    const correct = lesson.check.filter((q, i) => session.checkAnswers[i] === q.correctIndex).length;
    return `You got ${correct} of ${lesson.check.length} on the check. Tomorrow’s lesson is ${session.tomorrowSubject}, at midnight.`;
  }
  if (started) return "You’ve started. Pick up where you left off.";
  if (isNew) return "Your first lesson. A short read, then a quick check. About three minutes.";
  if (recall) return `One question from ${recall.fromDay}, a short lesson, then a quick check. About three minutes.`;
  return "A short read, then a quick check. About three minutes.";
}

// The signed-in home: today's lesson as the lead, the streak set aside, then series to pick up.
export default function TodayPage() {
  const user = useSession();
  const { data, error, reload } = useAlmanac(async () => {
    const [session, series] = await Promise.all([almanac.getDailySession(), almanac.listSeries()]);
    // The hour is read here, in the browser, so the greeting follows the learner's own clock.
    return { session, series, hour: new Date().getHours() };
  }, []);

  if (error) {
    return (
      <PaperPage current="today">
        <div className="mt-(--lead-top) max-w-[780px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Today didn’t load."
            body="It’s probably the connection. Nothing was lost."
            kept="Your streak is safe. Today counts until midnight."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "or go to your Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  if (!data) {
    return (
      <PaperPage current="today">
        <div aria-busy="true" className="mt-(--lead-top)">
          <p className="sr-only" role="status">
            Loading today
          </p>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <span className="h-3 w-64 bg-(--paper-sunk)" />
            <span className="h-16 w-[70%] max-w-[640px] bg-(--paper-sunk)" />
            <span className="h-5 w-[50%] max-w-[480px] bg-(--paper-sunk)" />
          </div>
        </div>
      </PaperPage>
    );
  }

  const { session, series, hour } = data;
  const { lesson, streak } = session;
  const done = session.finishedAt !== null;
  // No recall means no lesson finished before today.
  const isNew = session.recall === null && !done && streak.count === 0;
  const started = !done && (session.recallAnswer !== null || session.checkAnswers.some((a) => a !== null));
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const greeting = `${isNew ? "Welcome" : timeOfDay(hour)}${firstName ? `, ${firstName}` : ""}`;
  const eyebrow = done ? `✓ Done · Today in ${lesson.subjectName}` : `${greeting} · Today in ${lesson.subjectName}`;

  // In progress first. A series that was started but never opened still belongs here.
  const open: SeriesSummary[] = [
    ...series.filter((s) => s.status === "inProgress"),
    ...series.filter((s) => s.status === "notStarted"),
  ];
  const continueTo = session.continueSeries?.nextLesson ? session.continueSeries : open.find((s) => s.nextLesson);

  const primary = !done ? (
    <Button icon href="/today/lesson">
      {started ? "Continue today’s lesson" : isNew ? "Start your first lesson" : "Start today’s lesson"}
    </Button>
  ) : continueTo?.nextLesson ? (
    <Button icon href={`/series/${continueTo.id}/${continueTo.nextLesson.number}`}>
      Continue your series
    </Button>
  ) : undefined;
  // Done with no series to continue: the next step is a series on a topic of the learner's own.
  const ownTopic = done && !continueTo?.nextLesson;
  const readAgain = done ? (
    <Button variant="quiet" href="/today/lesson?read=1">
      or read today’s lesson again
    </Button>
  ) : undefined;

  return (
    <PaperPage current="today">
      <section
        aria-labelledby="today-heading"
        className="@container/today mt-(--lead-top) flex flex-wrap items-start justify-between gap-x-20 gap-y-10"
      >
        <LeadBlock
          headingId="today-heading"
          eyebrow={eyebrow}
          title={done ? "Done for today." : lesson.title}
          line={leadLine(session, isNew, started)}
          className="max-w-[780px] flex-[1_1_620px]"
          primary={primary}
          // With the own-topic field below, "read again" sits beside its button instead.
          quiet={ownTopic ? undefined : readAgain}
        >
          {done ? (
            <>
              {/* Today's lesson points to two series: its related topic, and its own title. */}
              <MoreTopics topics={[lesson.deeperTopic, lesson.title]} />
              {ownTopic && <OwnTopicStart quiet={readAgain} className="mt-9" />}
            </>
          ) : undefined}
        </LeadBlock>
        {!isNew && (
          <StreakMark
            count={streak.count}
            days={streak.month}
            todayDone={streak.todayDone}
            longest={streak.longest}
            // Beside the lesson it is the 300px card, top right. The lesson (620px) + gap (80px)
            // + card (300px) fit from 1000px; below that the card moves above the lesson, and the
            // max-width lifts so it fills the row and lays itself out wide.
            className="min-w-0 flex-[1_1_300px] max-w-[max(300px,calc((1000px_-_100%)_*_999))] @max-[1000px]/today:order-first"
          />
        )}
      </section>

      {/* Only once there is a series. Starting one is offered by the own-topic field above. */}
      {series.length > 0 && (
        <Section
          id="series"
          title="Pick up your series"
          aside={
            <Link href="/library" className="py-2 font-label text-[13px] text-(--ink) underline-offset-4">
              All series
            </Link>
          }
        >
          {open.length > 0 ? (
            <ul className="almanac-stagger m-0 list-none p-0 [--stagger-base:120ms] [--stagger-step:50ms]">
              {open.map((s) => (
                <li key={s.id} className="border-0 border-b border-solid border-(--rule)">
                  <SeriesRow series={s} lead="nextLesson" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="pt-5">
              <p className="m-0 max-w-[540px] text-[18px] leading-normal text-(--ink-soft) md:text-[20px]">
                Every series you started is finished. Start another whenever a lesson grabs you.
              </p>
              <LeadActions
                className="mt-6!"
                primary={
                  <Button variant="outline" icon href="/series/new">
                    Start a series
                  </Button>
                }
              />
            </div>
          )}
        </Section>
      )}
    </PaperPage>
  );
}
