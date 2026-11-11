import "server-only";
import { z } from "zod";
import type { RpcMethod, StreamMethod } from "../protocol";
import { SUBJECTS, type OutlineRow, type TutorChunk } from "../types";
import type { Learner } from "./context";
import * as daily from "./daily";
import * as mastery from "./mastery";
import * as placement from "./placement";
import * as series from "./series";
import * as stats from "./stats";
import { askTutor } from "./tutor";

// Every argument the browser sends is checked here before it reaches a query.

type Entry<R> = { bind: (args: unknown) => ((learner: Learner) => R) | null };

/** A method: the schema for its arguments, and what it runs with them. */
function def<S extends z.ZodType, R>(schema: S, run: (learner: Learner, args: z.output<S>) => R): Entry<R> {
  return {
    bind: (args) => {
      const parsed = schema.safeParse(args);
      return parsed.success ? (learner) => run(learner, parsed.data) : null;
    },
  };
}

const id = z.string().min(1).max(64);
const lessonNumber = z.number().int().min(1).max(5);
const option = z.number().int().min(0).max(7);
const answer = z.union([option, z.literal("unsure")]);
const index = z.number().int().min(0).max(4);
const none = z.tuple([]);

const RPC: Record<RpcMethod, Entry<Promise<unknown>>> = {
  getDailySession: def(none, (l) => daily.getDailySession(l)),
  answerRecall: def(z.tuple([option]), (l, [a]) => daily.answerRecall(l, a)),
  answerDailyCheck: def(z.tuple([z.number().int().min(0).max(1), option]), (l, [i, a]) => daily.answerDailyCheck(l, i, a)),
  getPastDailyLessons: def(none, (l) => daily.getPastDailyLessons(l)),
  getPastDailyLesson: def(z.tuple([id]), (l, [lessonId]) => daily.getPastDailyLesson(l, lessonId)),
  getSubjects: def(none, async (l) => (await daily.subjectsOf(l.userId)).subjects),
  saveSubjects: def(z.tuple([z.array(z.enum(SUBJECTS)).max(SUBJECTS.length)]), (l, [s]) => daily.saveSubjects(l, s)),
  getGuestState: def(none, (l) => stats.getGuestState(l)),
  listSeries: def(none, (l) => series.listSeries(l)),
  getSeries: def(z.tuple([id]), (l, [s]) => series.getSeries(l, s)),
  deleteSeries: def(z.tuple([id]), (l, [s]) => series.deleteSeries(l, s)),
  getSeriesLesson: def(z.tuple([id, lessonNumber]), (l, [s, n]) => series.getSeriesLesson(l, s, n)),
  answerSeriesCheck: def(z.tuple([id, lessonNumber, option]), (l, [s, n, a]) => series.answerSeriesCheck(l, s, n, a)),
  startPlacement: def(z.tuple([z.object({ topic: z.string().min(1).max(200), focus: z.string().max(500).optional() })]), (l, [r]) =>
    placement.startPlacement(l, r)
  ),
  getPlacement: def(none, (l) => placement.getPlacement(l)),
  writePlacementTest: def(none, (l) => placement.writePlacementTest(l)),
  savePlacementAnswer: def(z.tuple([index, answer]), (l, [i, a]) => placement.savePlacementAnswer(l, i, a)),
  submitPlacement: def(none, (l) => placement.submitPlacement(l)),
  getPlacementResult: def(none, (l) => placement.getPlacementResult(l)),
  getMastery: def(z.tuple([id]), (l, [s]) => mastery.getMastery(l, s)),
  writeMastery: def(z.tuple([id]), (l, [s]) => mastery.writeMastery(l, s)),
  saveMasteryAnswer: def(z.tuple([id, index, answer]), (l, [s, i, a]) => mastery.saveMasteryAnswer(l, s, i, a)),
  submitMastery: def(z.tuple([id]), (l, [s]) => mastery.submitMastery(l, s)),
  retakeMastery: def(z.tuple([id]), (l, [s]) => mastery.retakeMastery(l, s)),
  getStats: def(none, (l) => stats.getStats(l)),
};

export type StreamItem = { text: string } | TutorChunk | { row: OutlineRow };

const tutorContext = z.union([
  z.object({ kind: z.literal("daily") }),
  z.object({ kind: z.literal("series"), seriesId: id, number: lessonNumber }),
]);

async function* wrapText(source: AsyncIterable<string>): AsyncGenerator<StreamItem> {
  for await (const text of source) yield { text };
}

async function* wrapRows(source: AsyncIterable<OutlineRow>): AsyncGenerator<StreamItem> {
  for await (const row of source) yield { row };
}

const STREAM: Record<StreamMethod, Entry<AsyncIterable<StreamItem>>> = {
  streamDailyLesson: def(none, (l) => wrapText(daily.streamDailyLesson(l))),
  streamSeriesLesson: def(z.tuple([id, lessonNumber]), (l, [s, n]) => wrapText(series.streamSeriesLesson(l, s, n))),
  askTutor: def(z.tuple([tutorContext, z.string().max(2000).nullable()]), (l, [c, q]) => askTutor(l, c, q)),
  streamOutline: def(none, (l) => wrapRows(placement.streamOutline(l))),
};

/** Null when the method or its arguments aren't ones we answer. */
export function rpc(method: string, args: unknown) {
  return Object.hasOwn(RPC, method) ? RPC[method as RpcMethod].bind(args) : null;
}

export function stream(method: string, args: unknown) {
  return Object.hasOwn(STREAM, method) ? STREAM[method as StreamMethod].bind(args) : null;
}
