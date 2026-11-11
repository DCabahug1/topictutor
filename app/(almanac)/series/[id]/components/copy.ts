import { joinList } from "@/lib/almanac";

/** "How a Web Page Gets Built: HTML, CSS and the Browser" becomes "How a Web Page Gets Built". */
export function shortTitle(title: string): string {
  return title.split(":")[0].trim();
}

/** "lesson 3" or "lessons 3, 4 and 5". */
export function lessonList(numbers: number[]): string {
  return `${numbers.length === 1 ? "lesson" : "lessons"} ${joinList(numbers)}`;
}

/** 3 becomes "03". */
export function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The headline after a pass. A title that already reads as a clause ("How a
 * Web Page Gets Built") becomes "You know how a web page gets built."
 * Anything else gets the plain line.
 */
export function passHeadline(seriesTitle: string): string {
  const short = shortTitle(seriesTitle);
  return /^(How|Why|What) /.test(short) ? `You know ${short.toLowerCase()}.` : "You passed the Mastery Check.";
}
