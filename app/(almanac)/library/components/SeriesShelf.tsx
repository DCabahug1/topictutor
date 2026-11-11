"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { ConfirmDialog } from "@/components/almanac/ConfirmDialog";
import { FilterTabs } from "@/components/almanac/FilterTabs";
import { CloseIcon, SearchIcon, TrashIcon } from "@/components/almanac/icons";
import { Notice } from "@/components/almanac/Notice";
import { Section } from "@/components/almanac/Section";
import { SeriesRow } from "@/components/almanac/SeriesRow";
import { almanac, type SeriesStatus, type SeriesSummary } from "@/lib/almanac";

type Filter = "all" | SeriesStatus;

type SeriesShelfProps = {
  /** Most recent first, as the data layer returns them. */
  series: SeriesSummary[];
  /** Called once a series is gone, so the page can drop it from its list. */
  onDeleted: (id: string) => void;
};

/** Every series as ruled rows: search as you type, filter by status, open one or delete it. */
export function SeriesShelf({ series, onDeleted }: SeriesShelfProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // The series stays in place while the dialog closes, so its title doesn't blank out.
  const [confirm, setConfirm] = useState<{ item: SeriesSummary; open: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState<SeriesSummary | null>(null);
  const [deletions, setDeletions] = useState(0);
  const search = useRef<HTMLInputElement>(null);

  // The row that held focus is gone after a delete, so reading resumes from the search field.
  useEffect(() => {
    if (deletions > 0) search.current?.focus();
  }, [deletions]);

  const needle = query.trim().toLowerCase();
  const matching = series.filter((s) => !needle || `${s.title} ${s.category}`.toLowerCase().includes(needle));
  const shown = matching.filter((s) => filter === "all" || s.status === filter);
  const count = (status: Filter) => (status === "all" ? matching.length : matching.filter((s) => s.status === status).length);

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

  const searchField = (
    <div className="flex w-full items-center gap-3 border-0 border-b border-solid border-(--ink) md:w-[448px]">
      <label htmlFor="library-search" className="sr-only">
        Search your series
      </label>
      <SearchIcon size={16} className="flex-none text-(--ink-muted)" />
      <input
        id="library-search"
        ref={search}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search titles and subjects"
        autoComplete="off"
        // The field has its own clear button, so the browser's is hidden.
        className="h-12 min-w-0 flex-auto rounded-none border-0 bg-transparent font-serif text-[18px] text-(--ink) [&::-webkit-search-cancel-button]:appearance-none"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            search.current?.focus();
          }}
          className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center border-0 bg-transparent text-(--ink) hover:text-(--accent)"
        >
          <CloseIcon size={16} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );

  return (
    <Section
      id="all-series"
      title="All series"
      aside={searchField}
      tools={
        <FilterTabs
          label="Show series"
          value={filter}
          onChange={setFilter}
          className="pb-2"
          tabs={[
            { value: "all", label: "All", count: count("all") },
            { value: "inProgress", label: "In progress", count: count("inProgress") },
            { value: "notStarted", label: "Not started", count: count("notStarted") },
            { value: "completed", label: "Done", count: count("completed") },
          ]}
        />
      }
    >
      <div>
        <p role="status" className="sr-only">
          {needle || filter !== "all" ? `${shown.length} series shown` : ""}
        </p>

        {failed && (
          <Notice
            className="mt-6"
            tone="error"
            kicker="Couldn’t delete"
            title={`“${failed.title}” wasn’t deleted.`}
            body="Nothing was removed. Try again, or leave it where it is."
            primary={{ label: "Try again", onClick: () => remove(failed), busy: deleting }}
            secondary={{ label: "or keep it", onClick: () => setFailed(null) }}
          />
        )}

        {shown.length === 0 ? (
          <div className="pt-8">
            <p className="m-0 text-[24px] font-medium leading-[1.2] md:text-[28px]">
              {needle ? `No series match “${query.trim()}”.` : "No series with this status."}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6">
              <Button variant="quiet" onClick={clearAll}>
                Clear search and filters
              </Button>
              <Button variant="quiet" href={needle ? `/series/new?topic=${encodeURIComponent(query.trim())}` : "/series/new"}>
                {needle ? `or start a series on “${query.trim()}”` : "or start a series"}
              </Button>
            </div>
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {shown.map((s) => (
              <li key={s.id} className="border-0 border-b border-solid border-(--rule)">
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
      </div>

      <ConfirmDialog
        open={confirm?.open ?? false}
        title={confirm ? `Delete “${confirm.item.title}”?` : ""}
        body="Its lessons, your progress and any Mastery Check score go with it. This can’t be undone."
        confirmLabel="Delete series"
        busy={deleting}
        onConfirm={() => confirm && remove(confirm.item)}
        onCancel={() => confirm && setConfirm({ item: confirm.item, open: false })}
      />
    </Section>
  );
}
