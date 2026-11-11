"use client";

import { Button } from "@/components/almanac/Button";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { Notice } from "@/components/almanac/Notice";
import { PaperPage } from "@/components/almanac/Page";
import { ProgressMeter } from "@/components/almanac/ProgressMeter";
import { LESSONS_PER_SERIES, almanac, localDate, useAlmanac, type SeriesSummary } from "@/lib/almanac";
import { PastDailyList } from "./components/PastDailyList";
import { SeriesShelf } from "./components/SeriesShelf";

/** Leads with the most recent series under way; otherwise with starting one. */
function LibraryLead({ series }: { series: SeriesSummary[] }) {
  // Most recent first, as the data layer returns them.
  const latest = series.find((s) => s.status === "inProgress" && s.nextLesson);

  if (latest?.nextLesson) {
    return (
      <LeadBlock
        size="sm"
        eyebrow={`Pick up where you left off · ${latest.category}`}
        title={latest.title}
        line={`Lesson ${latest.nextLesson.number} of ${LESSONS_PER_SERIES}: ${latest.nextLesson.title}.`}
        className="max-w-[860px]"
        primary={
          <Button icon href={`/series/${latest.id}/${latest.nextLesson.number}`}>
            Continue with lesson {latest.nextLesson.number}
          </Button>
        }
        quiet={
          <Button variant="quiet" href="/series/new">
            or start a new series
          </Button>
        }
      >
        <ProgressMeter lessonsDone={latest.lessonsDone} />
      </LeadBlock>
    );
  }

  return (
    <LeadBlock
      size="sm"
      eyebrow="Library"
      title={series.length ? "Start your next series." : "Nothing here yet."}
      line={
        series.length
          ? "Nothing is under way right now. Name any topic and get five lessons that start where you are."
          : "A series is five lessons written around what you don’t know yet."
      }
      className="max-w-[860px]"
      primary={
        <Button icon href="/series/new">
          Start a new series
        </Button>
      }
      quiet={
        series.length ? undefined : (
          <Button variant="quiet" href="/series/sample">
            or open the sample series
          </Button>
        )
      }
    />
  );
}

// Every series the learner has started, and the daily lessons so far.
export default function LibraryPage() {
  const { data, error, reload, setData } = useAlmanac(async () => {
    const [series, daily] = await Promise.all([almanac.listSeries(), almanac.getPastDailyLessons()]);
    // Read in the browser, so today's lesson follows the learner's own calendar.
    return { series, daily, today: localDate() };
  }, []);

  if (error) {
    return (
      <PaperPage current="library">
        <div className="mt-(--lead-top) max-w-[780px]">
          <Notice
            tone="error"
            headingLevel={1}
            kicker="Couldn’t load"
            title="Your library didn’t load."
            body="It’s probably the connection. Nothing was lost."
            primary={{ label: "Try again", onClick: reload }}
            secondary={{ label: "or go to Today", href: "/today" }}
          />
        </div>
      </PaperPage>
    );
  }

  if (!data) {
    return (
      <PaperPage current="library">
        <div aria-busy="true" className="mt-(--lead-top)">
          <p className="sr-only" role="status">
            Loading your library
          </p>
          <div aria-hidden="true" className="flex flex-col gap-4">
            <span className="h-3 w-64 bg-(--paper-sunk)" />
            <span className="h-14 w-[70%] max-w-[640px] bg-(--paper-sunk)" />
            <span className="h-5 w-[50%] max-w-[480px] bg-(--paper-sunk)" />
          </div>
          <div aria-hidden="true" className="mt-(--section-gap) flex flex-col">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex flex-col gap-[10px] border-0 border-t border-solid border-(--rule) py-6">
                <span className="h-6 w-[60%] bg-(--paper-sunk)" />
                <span className="h-4 w-[20%] bg-(--paper-sunk)" />
              </div>
            ))}
          </div>
        </div>
      </PaperPage>
    );
  }

  return (
    <PaperPage current="library">
      <section className="mt-(--lead-top)">
        <LibraryLead series={data.series} />
      </section>
      {data.series.length > 0 && (
        <SeriesShelf
          series={data.series}
          onDeleted={(id) => setData({ ...data, series: data.series.filter((s) => s.id !== id) })}
        />
      )}
      <PastDailyList lessons={data.daily} today={data.today} />
    </PaperPage>
  );
}
