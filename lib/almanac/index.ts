// The one place screens get data from. NEXT_PUBLIC_ALMANAC_SOURCE=remote uses
// the real data layer; anything else uses the sample source. The /dev pages
// always use the sample source, so their forced failures keep working.

import { fixtureSource } from "./fixture-source";
import { remoteSource } from "./remote-source";
import type { AlmanacSource } from "./source";

const useRemote = process.env.NEXT_PUBLIC_ALMANAC_SOURCE === "remote";

function current(): AlmanacSource {
  if (!useRemote) return fixtureSource;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/dev/")) return fixtureSource;
  return remoteSource;
}

/** Picks the source on every call, so moving between /dev and the app switches cleanly. */
export const almanac: AlmanacSource = new Proxy({} as AlmanacSource, {
  get: (_, method: keyof AlmanacSource) => {
    const source = current();
    const value = source[method];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(source) : value;
  },
});

export type { AlmanacSource, TutorContext } from "./source";
export * from "./types";
export * from "./rules";
export { useAlmanac } from "./use-almanac";
export { useTextStream, prefersReducedMotion, type StreamStatus } from "./use-stream";
