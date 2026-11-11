// The real data layer, as the browser sees it: every AlmanacSource call goes
// to /api/almanac, which reads and writes the database on the server.
// Browser only, like the sample source.

import { createClient } from "@/utils/supabase/client";
import { DATE_HEADER, type ErrorKind, type Frame, type RpcMethod, type RpcReply, type StreamMethod } from "./protocol";
import { localDate } from "./rules";
import type { AlmanacSource } from "./source";
import { AlmanacError, type OutlineRow, type TutorChunk } from "./types";

const KINDS: ErrorKind[] = ["writeFailed", "loadFailed", "notFound", "guestSeriesUsed", "guestDailyLimit"];

function toError(kind: unknown): AlmanacError {
  return new AlmanacError(KINDS.includes(kind as ErrorKind) ? (kind as ErrorKind) : "loadFailed");
}

let signingIn: Promise<void> | null = null;

/**
 * A visitor gets an anonymous session the first time they do something that
 * is saved. Reading never creates one, so crawlers never become users.
 */
function ensureSession(): Promise<void> {
  signingIn ??= (async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw new AlmanacError("loadFailed", "Couldn’t start a guest session");
  })().catch((cause) => {
    signingIn = null;
    throw cause;
  });
  return signingIn;
}

const headers = () => ({ "content-type": "application/json", [DATE_HEADER]: localDate() });

async function rpc<T>(method: RpcMethod, args: unknown[] = [], { session = false } = {}): Promise<T> {
  if (session) await ensureSession();
  let response: Response;
  try {
    response = await fetch("/api/almanac/rpc", { method: "POST", headers: headers(), body: JSON.stringify({ method, args }) });
  } catch {
    throw new AlmanacError("loadFailed");
  }
  let reply: RpcReply<T>;
  try {
    reply = await response.json();
  } catch {
    throw new AlmanacError("loadFailed");
  }
  if (!reply.ok) throw toError(reply.kind);
  return reply.data;
}

/** Answers are safe to send twice (the first one wins), so a dropped connection is retried. */
async function retried<T>(call: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await call();
    } catch (cause) {
      last = cause;
      if (!(cause instanceof AlmanacError) || cause.kind !== "loadFailed") throw cause;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw last;
}

/** Reads newline-delimited frames. A stream that ends without "done" failed on the way. */
async function* frames(method: StreamMethod, args: unknown[], { session = false } = {}): AsyncGenerator<Frame> {
  if (session) await ensureSession();
  let response: Response;
  try {
    response = await fetch("/api/almanac/stream", { method: "POST", headers: headers(), body: JSON.stringify({ method, args }) });
  } catch {
    throw new AlmanacError("writeFailed");
  }
  if (!response.ok || !response.body) throw new AlmanacError("writeFailed");

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const text = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
        if (!text) continue;
        const frame = JSON.parse(text) as Frame;
        if (frame.t === "error") throw toError(frame.kind);
        if (frame.t === "done") {
          finished = true;
          return;
        }
        yield frame;
      }
    }
  } finally {
    // Leaving early stops reading; the server finishes the writing on its own.
    reader.cancel().catch(() => {});
  }
  if (!finished) throw new AlmanacError("writeFailed");
}

async function* text(method: StreamMethod, args: unknown[], options?: { session?: boolean }): AsyncGenerator<string> {
  for await (const frame of frames(method, args, options)) if (frame.t === "text") yield frame.v;
}

export const remoteSource: AlmanacSource = {
  getDailySession: () => rpc("getDailySession"),
  streamDailyLesson: () => text("streamDailyLesson", []),
  answerRecall: (answer) => retried(() => rpc("answerRecall", [answer], { session: true })),
  answerDailyCheck: (index, answer) => retried(() => rpc("answerDailyCheck", [index, answer], { session: true })),
  getPastDailyLessons: () => rpc("getPastDailyLessons"),
  getPastDailyLesson: (id) => rpc("getPastDailyLesson", [id]),

  async *askTutor(context, question): AsyncGenerator<TutorChunk> {
    for await (const frame of frames("askTutor", [context, question], { session: true })) {
      if (frame.t === "source") yield { kind: "source", paragraph: frame.v };
      else if (frame.t === "text") yield { kind: "text", text: frame.v };
    }
  },

  getSubjects: () => rpc("getSubjects"),
  saveSubjects: (subjects) => rpc("saveSubjects", [subjects], { session: true }),
  getGuestState: () => rpc("getGuestState"),

  listSeries: () => rpc("listSeries"),
  getSeries: (id) => rpc("getSeries", [id]),
  deleteSeries: (id) => rpc("deleteSeries", [id], { session: true }),
  getSeriesLesson: (id, number) => rpc("getSeriesLesson", [id, number]),
  streamSeriesLesson: (id, number) => text("streamSeriesLesson", [id, number], { session: true }),
  answerSeriesCheck: (id, number, answer) => retried(() => rpc("answerSeriesCheck", [id, number, answer], { session: true })),

  checkTopic: (request) => rpc("checkTopic", [request], { session: true }),
  startPlacement: (request) => rpc("startPlacement", [request], { session: true }),
  getPlacement: () => rpc("getPlacement"),
  writePlacementTest: () => rpc("writePlacementTest", [], { session: true }),
  savePlacementAnswer: (index, answer) => retried(() => rpc("savePlacementAnswer", [index, answer], { session: true })),
  submitPlacement: () => retried(() => rpc("submitPlacement", [], { session: true })),
  getPlacementResult: () => rpc("getPlacementResult"),

  async *streamOutline(): AsyncGenerator<OutlineRow> {
    for await (const frame of frames("streamOutline", [], { session: true })) if (frame.t === "row") yield frame.v as OutlineRow;
  },

  getMastery: (seriesId) => rpc("getMastery", [seriesId]),
  writeMastery: (seriesId) => rpc("writeMastery", [seriesId], { session: true }),
  saveMasteryAnswer: (seriesId, index, answer) => retried(() => rpc("saveMasteryAnswer", [seriesId, index, answer], { session: true })),
  submitMastery: (seriesId) => retried(() => rpc("submitMastery", [seriesId], { session: true })),
  retakeMastery: (seriesId) => rpc("retakeMastery", [seriesId], { session: true }),

  getStats: () => rpc("getStats"),
};
