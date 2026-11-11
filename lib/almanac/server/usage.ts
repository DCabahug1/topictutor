import "server-only";
import { AlmanacError } from "../types";
import { db } from "./context";

/** Daily caps. Starting values: change them here. */
export const CAPS = {
  /** New series per signed-in learner, per day. */
  memberSeriesPerDay: 10,
  /** Tutor questions per guest, per day. */
  guestQuestionsPerDay: 30,
  /** Tutor questions per signed-in learner, per day. */
  memberQuestionsPerDay: 200,
  /** Topic checks before a series starts, per learner, per day. Past this, topics go through unchecked. */
  memberTopicChecksPerDay: 100,
  /** Checks of a custom subject's name, per learner (guests too), per day. Past this, names go through unchecked. */
  subjectChecksPerDay: 30,
  /**
   * New daily lessons a learner's custom subjects can cause to be planned, per
   * day. A name someone else already has today costs nothing. Past this, the
   * day falls back to one of the fixed subjects.
   */
  otherPlansPerDay: 3,
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
