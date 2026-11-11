import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { shiftDate } from "@/lib/almanac/rules";
import { ensureDailyLesson } from "@/lib/almanac/server/daily";
import { SUBJECTS, type Subject } from "@/lib/almanac/types";

export const maxDuration = 300;

/** At a time, so a slow subject doesn't hold up the rest and the API isn't flooded. */
const AT_ONCE = 4;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(given);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Run by Vercel Cron each morning: plans tomorrow's lesson in every fixed
 * subject, so the first reader of the day doesn't wait for it. The prose is
 * still written on first open. A subject that fails here is planned on demand.
 * Other is left out: learners name it, and each name is planned on demand, so
 * no lesson is paid for that nobody reads.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  const date = shiftDate(new Date().toISOString().slice(0, 10), 1);
  const queue: Subject[] = SUBJECTS.filter((s) => s !== "Other");
  const total = queue.length;
  const failed: Subject[] = [];

  await Promise.all(
    Array.from({ length: AT_ONCE }, async () => {
      for (let subject = queue.shift(); subject; subject = queue.shift()) {
        try {
          await ensureDailyLesson(date, subject);
        } catch (cause) {
          console.error(`[almanac] cron ${date} ${subject}:`, cause);
          failed.push(subject);
        }
      }
    })
  );

  return NextResponse.json({ ok: failed.length === 0, date, planned: total - failed.length, failed });
}
