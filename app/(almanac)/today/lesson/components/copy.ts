import { shortTitle } from "@/components/almanac/SeriesRow";
import type { SeriesSummary } from "@/lib/almanac/types";

/** Today's related topic as a title: "The strange rules of zero and infinity". */
export function deeperTitle(topic: string): string {
  return topic ? topic[0].toUpperCase() + topic.slice(1) : topic;
}

/** The link that starts a series from a daily lesson. Start a series reads `topic`. */
export function deeperHref(topic: string): string {
  return `/series/new?topic=${encodeURIComponent(deeperTitle(topic))}`;
}

/** The one action under the Go deeper header. The header names the topic, so the button doesn't. */
export const DEEPER_ACTION = "Start this series";

/** The second path beside it: a series on a topic the learner names. */
export const OWN_TOPIC_ACTION = "Pick your own topic";
export const OWN_TOPIC_HREF = "/series/new";

/**
 * The button that picks a series back up names it, so the learner knows where it goes:
 * Continue “How a Web Page Gets Built”. Long names wrap; the button balances the lines.
 */
export function continueSeriesLabel(series: Pick<SeriesSummary, "title">): string {
  return `Continue “${shortTitle(series.title)}”`;
}

/** The lesson a series picks back up at. */
export function continueSeriesHref(seriesId: string, next: { number: number }): string {
  return `/series/${seriesId}/${next.number}`;
}

/**
 * Lets a long series name wrap to even, centred lines inside the button. The padding keeps
 * wrapped lines off the edges (one line still sits at the 58px height) and the arrow keeps its size.
 */
export const CONTINUE_SERIES_WRAP = "py-3 text-center [text-wrap:balance] [&>svg]:flex-none";
