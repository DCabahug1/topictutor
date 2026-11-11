import "server-only";
import { randomUUID } from "node:crypto";
import { AlmanacError } from "../types";
import { db } from "./context";

/** A lease outlives the two-minute SDK deadline, so a stuck writer can't hold a claim forever. */
const LEASE_SECONDS = 150;

export type Claim = { key: string; token: string };

/** Tries to become the one writer for `key`. Null when someone else is already writing. */
export async function claim(key: string): Promise<Claim | null> {
  const token = randomUUID();
  const { data, error } = await db().rpc("claim_generation", { p_key: key, p_token: token, p_seconds: LEASE_SECONDS });
  if (error) {
    console.error("[almanac] claim:", error.message);
    throw new AlmanacError("writeFailed");
  }
  return data ? { key, token } : null;
}

export async function release(held: Claim): Promise<void> {
  await db().rpc("release_generation", { p_key: held.key, p_token: held.token });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for another writer to finish: calls `read` every second until it
 * returns something, or the lease would have run out.
 */
export async function waitFor<T>(read: () => Promise<T | null>, seconds = LEASE_SECONDS): Promise<T> {
  for (let i = 0; i < seconds; i += 1) {
    const value = await read();
    if (value !== null) return value;
    await sleep(1000);
  }
  throw new AlmanacError("writeFailed");
}

/**
 * Runs `write` as the one writer for `key`, or waits for whoever is writing.
 * `read` returns the finished value, or null while it isn't there yet.
 */
export async function once<T>(key: string, read: () => Promise<T | null>, write: () => Promise<T>): Promise<T> {
  const existing = await read();
  if (existing !== null) return existing;
  const held = await claim(key);
  if (!held) return waitFor(read);
  try {
    // Someone may have finished between the first read and the claim.
    return (await read()) ?? (await write());
  } finally {
    await release(held);
  }
}
