"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { cx } from "@/components/almanac/cx";
import { CloseIcon, SearchIcon, TrashIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { SeriesRow } from "@/components/almanac/SeriesRow";
import { almanac, type SeriesStatus, type SeriesSummary } from "@/lib/almanac";

type Filter = "all" | SeriesStatus;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "notStarted", label: "Not started" },
  { id: "inProgress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

const TEXT_LINK = "inline-flex min-h-12 items-center px-1 font-mono text-[14px] text-(--ink) underline underline-offset-4";

type SeriesShelfProps = {
  /** Most recent first, as the data layer returns them. */
  series: SeriesSummary[];
  /** The learner's local date, for "Updated today". */
  today: string;
  /** Called once a series is gone, so the page can drop it from its list. */
  onDeleted: (id: string) => void;
};

/** The learner's series: search as you type, filter by status, open one or delete it. */
export function SeriesShelf({ series, today, onDeleted }: SeriesShelfProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // The series stays in place while the dialog closes, so its title doesn't blank out.
  const [confirm, setConfirm] = useState<{ item: SeriesSummary; open: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState<SeriesSummary | null>(null);
  const [deletions, setDeletions] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // The row that held focus is gone after a delete, so reading resumes from the heading.
  useEffect(() => {
    if (deletions > 0) heading.current?.focus();
  }, [deletions]);

  const needle = query.trim().toLowerCase();
  const matching = series.filter(
    (s) => !needle || `${s.title} ${s.category} ${s.description}`.toLowerCase().includes(needle)
  );
  const shown = matching.filter((s) => filter === "all" || s.status === filter);
  const narrowed = needle !== "" || filter !== "all";

  const clearAll = () => {
    setQuery("");
    setFilter("all");
    search.current?.focus();
  };

  const remove = async (item: SeriesSummary) => {
    setDeleting(true);
    try {
      await almanac.deleteSeries(item.id);
      setFailed(null);
      onDeleted(item.id);
      setDeletions((n) => n + 1);
    } catch {
      setFailed(item);
    } finally {
      setDeleting(false);
      setConfirm({ item, open: false });
    }
  };

  return (
    <section
      aria-labelledby="series-heading"
      className="min-w-0 flex-[999_1_560px] border-0 border-t-[3px] border-solid border-(--ink)"
    >
      <div className="flex items-baseline justify-between gap-3 pt-[14px]">
        <h2 id="series-heading" ref={heading} tabIndex={-1} className="t-label m-0 outline-none">
          Your series
        </h2>
        {series.length > 0 && <span className="font-mono text-[12px] text-(--ink-muted)">Most recent first</span>}
      </div>

      {failed && (
        <Notice
          className="mt-[14px]"
          tone="error"
          kicker="Couldn’t delete"
          title={`“${failed.title}” wasn’t deleted.`}
          body="Nothing was removed. Try again, or leave it where it is."
          primary={{ label: "Try again", onClick: () => remove(failed), busy: deleting }}
          secondary={{ label: "Keep it", onClick: () => setFailed(null) }}
        />
      )}

      {series.length === 0 ? (
        <div className="pb-2 pt-6">
          <p className="m-0 text-[26px] font-medium leading-[1.15] md:text-[32px]">Nothing here yet.</p>
          <p className="m-0 mt-[10px] max-w-[520px] text-[17px] leading-normal text-(--ink-soft)">
            A series is five lessons written around what you don’t know yet. Start one on anything, or look around
            the sample first.
          </p>
          <div className="mt-[18px] flex flex-wrap gap-[10px]">
            <Button variant="secondary" href="/series/new" className="min-h-12! px-[18px]! text-[14px]!">
              Start a series
            </Button>
            <Link href="/series/sample" className={TEXT_LINK}>
              Open the sample series
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-[14px]">
            <label htmlFor="library-search" className="sr-only">
              Search your series
            </label>
            <div className="flex items-center gap-[10px] border-[1.5px] border-solid border-(--ink) bg-(--paper-raised) px-3">
              <SearchIcon className="flex-none" />
              <input
                id="library-search"
                ref={search}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search titles, subjects and descriptions"
                autoComplete="off"
                // The field has its own clear button, so the browser's is hidden.
                className="h-12 min-w-0 flex-auto border-0 bg-transparent font-serif text-[18px] text-(--ink) [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    search.current?.focus();
                  }}
                  className="-mr-2 flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-0 bg-transparent text-(--ink) hover:text-(--accent)"
                >
                  <CloseIcon size={16} strokeWidth={1.8} />
                </button>
              )}
            </div>
            <div role="group" aria-label="Filter by status" className="mt-[10px] flex flex-wrap gap-[6px]">
              {FILTERS.map((option) => {
                const on = filter === option.id;
                const count =
                  option.id === "all" ? matching.length : matching.filter((s) => s.status === option.id).length;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(option.id)}
                    className={cx(
                      "min-h-11 cursor-pointer border-[1.5px] border-solid border-(--ink) px-3 font-mono text-[13px] transition-colors duration-(--duration-instant)",
                      on ? "bg-(--ink) text-(--on-ink)" : "bg-transparent text-(--ink) hover:bg-(--paper-sunk)"
                    )}
                  >
                    {option.label} <span className={cx(!on && "text-(--ink-muted)")}>{count}</span>
                  </button>
                );
              })}
            </div>
            <p role="status" className="m-0 mt-[10px] font-mono text-[12px] text-(--ink-muted)">
              {narrowed ? `${shown.length} series shown` : `${series.length} series`}
            </p>
          </div>

          {shown.length === 0 ? (
            <div className="mt-[14px] border-0 border-t border-solid border-(--rule) pb-2 pt-6">
              <p className="m-0 text-[24px] font-medium leading-[1.2]">
                {needle ? `No series match “${query.trim()}”.` : "No series with this status."}
              </p>
              <p className="m-0 mt-2 text-[17px] text-(--ink-soft)">
                {needle ? "Try a broader word, or start a series on it." : "Pick another status, or start a new series."}
              </p>
              <div className="mt-4 flex flex-wrap gap-[10px]">
                <Button variant="secondary" size="compact" onClick={clearAll} className="min-h-[46px]!">
                  Clear search and filters
                </Button>
                <Link
                  href={needle ? `/series/new?topic=${encodeURIComponent(query.trim())}` : "/series/new"}
                  className="inline-flex min-h-[46px] items-center px-1 font-mono text-[13px] text-(--ink) underline underline-offset-4"
                >
                  {needle ? `Start a series on “${query.trim()}”` : "Start a series"}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="m-0 mt-[14px] list-none p-0">
              {shown.map((s) => (
                <li key={s.id} className="border-0 border-t border-solid border-(--rule)">
                  <SeriesRow
                    series={s}
                    actions={
                      <button
                        type="button"
                        aria-label={`Delete series: ${s.title}`}
                        onClick={() => setConfirm({ item: s, open: true })}
                        className="flex h-11 w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-(--ink-muted) hover:text-(--incorrect)"
                      >
                        <TrashIcon size={17} />
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm?.open ?? false}
        title={confirm ? `Delete “${confirm.item.title}”?` : ""}
        body="Its lessons, your progress and any Mastery Check score go with it. This can’t be undone."
        confirmLabel="Delete series"
        busy={deleting}
        onConfirm={() => confirm && remove(confirm.item)}
        onCancel={() => confirm && setConfirm({ item: confirm.item, open: false })}
      />
    </section>
  );
}
