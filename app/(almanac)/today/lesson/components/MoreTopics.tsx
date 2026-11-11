import Link from "next/link";
import { cx } from "@/components/almanac/cx";
import { deeperHref, deeperTitle } from "./copy";

type MoreTopicsProps = {
  /** Today's related topic, and today's title: the two series today's lesson points to. */
  topics: string[];
  className?: string;
};

/**
 * A quiet line under the lesson: "More on today's lesson:" and a small tag for
 * each series it points to. A tag opens Start a series with that topic filled in.
 */
export function MoreTopics({ topics, className }: MoreTopicsProps) {
  const seen = new Set<string>();
  const tags = topics
    .map((t) => deeperTitle(t.trim()))
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
  if (!tags.length) return null;

  return (
    <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-2", className)}>
      <p id="more-topics" className="m-0 mr-1 text-[17px] italic text-(--ink-muted)">
        More on today’s lesson:
      </p>
      <ul aria-labelledby="more-topics" className="m-0 flex list-none flex-wrap gap-2 p-0">
        {tags.map((topic) => (
          <li key={topic} className="min-w-0">
            <Link
              href={deeperHref(topic)}
              className="inline-flex min-h-9 max-w-full items-center gap-2 border border-solid border-(--rule) px-3 font-serif text-[16px] text-(--ink-soft) no-underline transition-colors duration-(--duration-instant) hover:border-(--ink) hover:text-(--ink)"
            >
              <span className="truncate">{topic}</span>
              <span aria-hidden="true" className="flex-none font-label text-[13px] text-(--ink-muted)">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
