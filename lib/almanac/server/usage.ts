import "server-only";
import { AlmanacError } from "../types";
import { db } from "./context";

/** Daily caps. Starting values: change them here. */
export const CAPS = {
  /** New series across all guests together, per UTC day. */
  guestSeriesPerDay: 50,
  /** New series per signed-in learner, per day. */
  memberSeriesPerDay: 10,
  /** Tutor questions per guest, per day. */
  guestQuestionsPerDay: 30,
  /** Tutor questions per signed-in learner, per day. */
  memberQuestionsPerDay: 200,
  /** Topic checks before a series starts, per guest and per learner, per day. Past these, topics go through unchecked. */
  guestTopicChecksPerDay: 20,
  memberTopicChecksPerDay: 100,
};

export const LIMITS = {
  question: 500,
  topic: 120,
  focus: 300,
};

const utcDay = () => new Date().toISOString().slice(0, 10);

/** Counts one use. False, with nothing counted, once the cap for today is reached. */
export async function countUse(scope: string, limit: number): Promise<boolean> {
  const { data, error } = await db().rpc("bump_usage", { p_scope: scope, p_day: utcDay(), p_limit: limit });
  if (error) {
    console.error("[almanac] usage:", error.message);
    throw new AlmanacError("loadFailed");
  }
  return Boolean(data);
}

/** How many uses `scope` has had today. */
export async function used(scope: string): Promise<number> {
  const { data } = await db().from("usage_counters").select("count").eq("scope", scope).eq("day", utcDay()).maybeSingle();
  return data?.count ?? 0;
}
