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
