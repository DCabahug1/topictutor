"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { almanac, type TopicCheck } from "@/lib/almanac";

export type TopicReviewState = { check: TopicCheck; typed: string };

/**
 * Starting a series from a typed topic: the topic check first (a likely typo,
 * something it can't read, or something it won't teach shows a review), then
 * the placement test. Shared by Start a series and Today's own-topic field.
 */
export function useSeriesStart({ onBegin }: { onBegin?: (topic: string) => void } = {}) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  // The topic whose test is being started, or null.
  const [starting, setStarting] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  // A topic that needs a second look, and what was typed when it was checked.
  const [review, setReview] = useState<TopicReviewState | null>(null);

  /** Starts the test on `chosen`. Only this counts toward the daily series limit. */
  const begin = async (chosen: string, focus?: string) => {
    setStarting(chosen);
    setFailed(false);
    setReview(null);
    onBegin?.(chosen);
    try {
      await almanac.startPlacement({ topic: chosen, focus: focus?.trim() || undefined });
      router.push("/series/new/placement");
    } catch {
      setStarting(null);
      setFailed(true);
    }
  };

  /** Checks `wanted`, then starts it, or shows the review when it needs a second look. */
  const submit = async (wanted: string, focus?: string) => {
    const topic = wanted.trim();
    if (!topic || starting !== null || checking) return;
    setFailed(false);
    setChecking(true);
    // If the check itself fails, the topic goes through as typed.
    const check = await almanac.checkTopic({ topic, focus: focus?.trim() || undefined }).catch(() => null);
    setChecking(false);
    if (check && check.verdict !== "clear") {
      setReview({ check, typed: topic });
      return;
    }
    await begin(check?.topic || topic, focus);
  };

  return {
    checking,
    starting,
    failed,
    review,
    begin,
    submit,
    /** Back to the field: the review goes away. */
    clearReview: () => setReview(null),
    /** For a start that skips the check (an unfinished test picked up as it is). */
    setStarting,
  };
}
