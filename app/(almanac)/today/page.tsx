"use client";

import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, useAlmanac } from "@/lib/almanac";
import { ContinueSeries } from "./components/ContinueSeries";
import { LessonCard } from "./components/LessonCard";
import { StreakPanel } from "./components/StreakPanel";

const HEADING = "m-0 mt-[22px] text-[40px] font-medium leading-none tracking-[-0.025em] md:mt-9 md:text-[64px]";

function timeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

// The signed-in home: today's lesson, the streak, and series to continue.
export default function TodayPage() {
  const user = useSession();
  const { data, error, reload } = useAlmanac(async () => {
    const [session, series] = await Promise.all([almanac.getDailySession(), almanac.listSeries()]);
    // The hour is read here, in the browser, so the greeting follows the learner's own clock.
    return { session, series, hour: new Date().getHours() };
  }, []);
  // The two figures under the streak are a bonus: the page stands without them.
  const { data: stats } = useAlmanac(() => almanac.getStats(), []);

  if (error) {
    return (
      <PaperPage current="today" dateline>
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Today didn’t load."
            body="It’s probably the connection. Nothing was lost."
            kept="Your streak is safe. Today counts until midnight."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "Go to Library", href: "/library" }}
          />
        </div>
      </PaperPage>
    );
  }

  if (!data) {
    return (
      <PaperPage current="today" dateline>
        <div aria-busy="true">
          <p className="sr-only" role="status">
            Loading today
          </p>
          <div aria-hidden="true">
            <span className="mt-[22px] block h-10 w-[70%] max-w-[520px] bg-(--paper-sunk) md:mt-9 md:h-16" />
            <div className="mt-7 flex flex-wrap items-start gap-8 md:mt-12 md:gap-x-20 md:gap-y-10">
              <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3">
                <span className="h-3 w-32 bg-(--paper-sunk)" />
                <span className="h-[220px] bg-(--paper-sunk) md:h-[260px]" />
              </div>
              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3">
                <span className="h-3 w-20 bg-(--paper-sunk)" />
                <span className="h-[62px] w-24 bg-(--paper-sunk) md:h-[102px] md:w-36" />
                <span className="h-[14px] w-[70%] bg-(--paper-sunk)" />
              </div>
            </div>
          </div>
        </div>
      </PaperPage>
    );
  }

  const { session, series, hour } = data;
  const { streak } = session;
  const done = session.finishedAt !== null;
  // No recall means no lesson finished before today.
  const isNew = session.recall === null && !done && streak.count === 0;
  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const opener = done ? "Done for today" : isNew ? "Welcome" : timeOfDay(hour);

  return (
    <PaperPage current="today" dateline>
      <h1 className={HEADING}>
        {opener}
        {firstName && `, ${firstName}`}.
      </h1>

      <div className="mt-7 flex flex-wrap items-start gap-8 md:mt-12 md:gap-x-20 md:gap-y-10">
        <LessonCard session={session} isNew={isNew} />
        <StreakPanel streak={streak} showWeek={!isNew} stats={stats && stats.totalLessons > 0 ? stats : null} />
      </div>

      <ContinueSeries series={series} />
    </PaperPage>
  );
}
