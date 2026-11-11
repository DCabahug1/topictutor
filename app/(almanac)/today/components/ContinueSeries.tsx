import Link from "next/link";
import { Button } from "@/components/almanac/Button";
import { SeriesRow } from "@/components/almanac/SeriesRow";
import type { SeriesSummary } from "@/lib/almanac";

const TEXT_LINK = "inline-flex min-h-12 items-center px-1 font-mono text-[14px] text-(--ink) underline underline-offset-4";
const OUTLINE = "min-h-12! px-[18px]! text-[14px]!";

/** Series still under way, each leading with the lesson to open next. */
export function ContinueSeries({ series }: { series: SeriesSummary[] }) {
  // In progress first. A series that was started but never opened still belongs here.
  const open = [
    ...series.filter((s) => s.status === "inProgress"),
    ...series.filter((s) => s.status === "notStarted"),
  ];

  return (
    <section
      aria-labelledby="series-heading"
      className="mt-7 border-0 border-t-[3px] border-solid border-(--ink) md:mt-12"
    >
      <div className="flex items-baseline justify-between gap-3 pt-4">
        <h2 id="series-heading" className="t-label m-0">
          Continue your series
        </h2>
        {series.length > 0 && (
          <Link
            href="/library"
            className="inline-flex min-h-11 items-center font-mono text-[13px] text-(--ink) underline underline-offset-4"
          >
            Library
          </Link>
        )}
      </div>

      {open.length > 0 ? (
        <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-8 p-0 md:grid-cols-2">
          {open.map((s) => (
            <li key={s.id} className="border-0 border-b border-solid border-(--rule)">
              <SeriesRow series={s} lead="nextLesson" />
            </li>
          ))}
        </ul>
      ) : series.length > 0 ? (
        <div className="pb-1 pt-4">
          <p className="m-0 max-w-[560px] text-[17px] leading-normal text-(--ink-soft) md:text-[19px]">
            Every series you started is finished. Start another whenever a lesson grabs you.
          </p>
          <div className="mt-4 flex flex-wrap gap-[10px]">
            <Button variant="secondary" href="/series/new" className={OUTLINE}>
              Start a series
            </Button>
          </div>
        </div>
      ) : (
        <div className="pb-1 pt-4">
          <p className="m-0 max-w-[560px] text-[17px] leading-normal text-(--ink-soft) md:text-[19px]">
            No series yet. When a lesson grabs you, Go Deeper turns its subject into five lessons built around what
            you don’t know yet.
          </p>
          <div className="mt-4 flex flex-wrap gap-[10px]">
            <Button variant="secondary" href="/series/new" className={OUTLINE}>
              Start a series
            </Button>
            <Link href="/series/sample" className={TEXT_LINK}>
              Look at a sample series
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
