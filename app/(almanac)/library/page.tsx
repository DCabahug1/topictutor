"use client";

import { Button } from "@/components/almanac/Button";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { almanac, localDate, useAlmanac } from "@/lib/almanac";
import { PastDailyList } from "./components/PastDailyList";
import { SeriesShelf } from "./components/SeriesShelf";

const COLUMNS = "mt-6 flex flex-wrap items-start gap-9 md:mt-10 md:gap-x-16 md:gap-y-10";
const COLUMN_RULE = "border-0 border-t-[3px] border-solid border-(--ink)";

// Every series the learner has started, and the daily lessons so far.
export default function LibraryPage() {
  const { data, error, reload, setData } = useAlmanac(async () => {
    const [series, daily] = await Promise.all([almanac.listSeries(), almanac.getPastDailyLessons()]);
    // Read in the browser, so "Updated today" follows the learner's own calendar.
    return { series, daily, today: localDate() };
  }, []);

  if (error) {
    return (
      <PaperPage current="library">
        <div className="mx-auto mt-8 max-w-[640px] md:mt-[72px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Your library didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "Go to Today", href: "/today" }}
          />
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage current="library">
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 md:mt-10">
        <h1 className="m-0 text-[44px] font-medium leading-none tracking-[-0.025em] md:text-[72px]">Library</h1>
        <Button href="/series/new" className="min-h-[50px]! gap-[10px]! px-5! text-[14px]!">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Start a new series
        </Button>
      </div>

      {data ? (
        <div className={COLUMNS}>
          <SeriesShelf
            series={data.series}
            today={data.today}
            onDeleted={(id) => setData({ ...data, series: data.series.filter((s) => s.id !== id) })}
          />
          <PastDailyList lessons={data.daily} today={data.today} />
        </div>
      ) : (
        // Reserved lines in the shape of the lists, so nothing jumps when they arrive.
        <div className={COLUMNS} aria-busy="true">
          <p className="sr-only" role="status">
            Loading your library
          </p>
          <section aria-labelledby="series-heading" className={`min-w-0 flex-[999_1_560px] ${COLUMN_RULE}`}>
            <h2 id="series-heading" className="t-label m-0 pt-[14px]">
              Your series
            </h2>
            <div aria-hidden="true" className="mt-[14px]">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex flex-col gap-[10px] border-0 border-t border-solid border-(--rule) py-[18px]">
                  <span className="h-3 w-[30%] bg-(--paper-sunk)" />
                  <span className="h-5 w-[82%] bg-(--paper-sunk)" />
                  <span className="h-[14px] w-[64%] bg-(--paper-sunk)" />
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="daily-heading" className={`min-w-0 flex-[1_1_340px] ${COLUMN_RULE}`}>
            <h2 id="daily-heading" className="t-label m-0 pt-[14px]">
              Past daily lessons
            </h2>
            <div aria-hidden="true" className="mt-4 flex flex-col gap-[14px]">
              <span className="h-10 bg-(--paper-sunk)" />
              <span className="h-10 bg-(--paper-sunk)" />
              <span className="h-10 bg-(--paper-sunk)" />
            </div>
          </section>
        </div>
      )}
    </PaperPage>
  );
}
