import { parseLocalDate } from "@/lib/almanac";

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 13 becomes "Thirteen". Past 99 the number stays as digits. */
export function spellOut(n: number): string {
  if (n < 0 || n > 99) return String(n);
  const word = n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return word[0].toUpperCase() + word.slice(1);
}

/** "Tuesday, November 10" or, short, "Tue, Nov 10". */
export function lessonDate(date: string, short = false): string {
  return parseLocalDate(date).toLocaleDateString(
    "en-US",
    short ? { weekday: "short", month: "short", day: "numeric" } : { weekday: "long", month: "long", day: "numeric" }
  );
}

/** The link that starts a series from a daily lesson. Start a series reads `topic`. */
export function deeperHref(topic: string): string {
  const title = topic[0].toUpperCase() + topic.slice(1);
  return `/series/new?topic=${encodeURIComponent(title)}`;
}
