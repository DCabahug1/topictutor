// Copy more than one screen shares: numbers in words, streak lengths, lesson dates.

import { parseLocalDate } from "./rules";

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

/** Streak milestones in days, largest first. A month is 30 days and a year 365, plus leap days. */
const MILESTONES: Array<[days: number, name: string]> = [
  [3652, "ten years"],
  [1826, "five years"],
  [365, "a year"],
  [183, "six months"],
  [30, "a month"],
];

function capitalize(text: string): string {
  return text[0].toUpperCase() + text.slice(1);
}

/**
 * How long a streak of a week or more feels, without repeating the number:
 * "Almost two weeks without a miss" for 13, "Six months without a miss" on day 183,
 * "Over a year without a miss" after that. Past ten years it stays "Still going, years later".
 * No end punctuation, so each screen adds its own. Runs under a week return null.
 */
export function runLength(count: number): string | null {
  if (count < 7) return null;
  // Past the last milestone the count stops mattering, so the line stops naming one.
  if (count > MILESTONES[0][0]) return "Still going, years later";
  for (const [days, name] of MILESTONES) {
    if (count === days) return `${capitalize(name)} without a miss`;
    if (count > days) return `Over ${name} without a miss`;
  }
  const weeks = Math.floor(count / 7);
  const rest = count % 7;
  const word = (n: number) => (n === 1 ? "a week" : `${spellOut(n).toLowerCase()} weeks`);
  if (rest === 0) return `${spellOut(weeks)} ${weeks === 1 ? "week" : "weeks"} without a miss`;
  if (rest >= 5) return `Almost ${word(weeks + 1)} without a miss`;
  return `Over ${word(weeks)} without a miss`;
}

/** "Tuesday, November 10" or, short, "Tue, Nov 10". */
export function lessonDate(date: string, short = false): string {
  return parseLocalDate(date).toLocaleDateString(
    "en-US",
    short ? { weekday: "short", month: "short", day: "numeric" } : { weekday: "long", month: "long", day: "numeric" }
  );
}
