/** The link that starts a series from a daily lesson. Start a series reads `topic`. */
export function deeperHref(topic: string): string {
  const title = topic[0].toUpperCase() + topic.slice(1);
  return `/series/new?topic=${encodeURIComponent(title)}`;
}
