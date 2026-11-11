// What travels between the browser source and the /api/almanac routes.
// Shared by both sides, so it holds only types and plain constants.

import type { AlmanacError } from "./types";

export type ErrorKind = AlmanacError["kind"];

/** The header that carries the learner's own calendar date (YYYY-MM-DD). */
export const DATE_HEADER = "x-almanac-date";

/** Methods answered with one JSON body by /api/almanac/rpc. */
export const RPC_METHODS = [
  "getDailySession",
  "answerRecall",
  "answerDailyCheck",
  "retryDailyCheck",
  "getPastDailyLessons",
  "getPastDailyLesson",
  "getSubjects",
  "saveSubjects",
  "getGuestState",
  "listSeries",
  "getSeries",
  "deleteSeries",
  "getSeriesLesson",
  "answerSeriesCheck",
  "retrySeriesCheck",
  "checkTopic",
  "startPlacement",
  "getPlacement",
  "writePlacementTest",
  "savePlacementAnswer",
  "submitPlacement",
  "getPlacementResult",
  "getMastery",
  "writeMastery",
  "saveMasteryAnswer",
  "submitMastery",
  "retakeMastery",
  "getStats",
] as const;

export type RpcMethod = (typeof RPC_METHODS)[number];

/** Methods answered as newline-delimited JSON frames by /api/almanac/stream. */
export const STREAM_METHODS = ["streamDailyLesson", "askTutor", "streamSeriesLesson", "streamOutline"] as const;

export type StreamMethod = (typeof STREAM_METHODS)[number];

export type RpcReply<T = unknown> = { ok: true; data: T } | { ok: false; kind: ErrorKind };

/**
 * One line of a stream. A stream that ends without `done` failed on the way,
 * and the browser treats it as writeFailed.
 */
export type Frame =
  | { t: "text"; v: string }
  | { t: "source"; v: number }
  | { t: "row"; v: unknown }
  | { t: "done" }
  | { t: "error"; kind: ErrorKind };
