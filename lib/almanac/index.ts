// The one place screens get data from. Today it is the sample source; the real
// data layer replaces `almanac` here without the screens changing.

import { fixtureSource } from "./fixture-source";
import type { AlmanacSource } from "./source";

export const almanac: AlmanacSource = fixtureSource;

export type { AlmanacSource, TutorContext } from "./source";
export * from "./types";
export * from "./rules";
export { useAlmanac } from "./use-almanac";
export { useTextStream, prefersReducedMotion, type StreamStatus } from "./use-stream";
