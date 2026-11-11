// Subjects the learner names themselves ("Astronomy", "Chess openings"), next to
// the fixed ones. Shared by the screens and the server, so it holds only plain
// functions. Their lessons are stored under the "Other" subject, keyed by name.

import { SUBJECTS, type CustomSubject, type Subject, type SubjectChoice } from "./types";

/** Longest name kept for a custom subject. */
export const CUSTOM_NAME_LIMIT = 60;

/** How many custom subjects a learner can keep. */
export const CUSTOM_LIMIT = 5;

/** The fixed subjects, as the picker shows them. Other is where custom subjects' lessons live. */
export const FIXED_SUBJECTS = SUBJECTS.filter((s): s is Exclude<Subject, "Other"> => s !== "Other");

/** The name as the learner sees it: spaces tidied, cut to the limit. Empty when there's nothing to keep. */
export function cleanCustomName(name: string | null | undefined): string {
  return (name ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().slice(0, CUSTOM_NAME_LIMIT).trim();
}

/**
 * The key a custom subject's lessons are shared under: case, composed accents,
 * punctuation and spacing don't matter, so "Chess openings" and "chess
 * openings!" share one lesson. Empty for a name with no letters or digits.
 */
export function customKey(name: string | null | undefined): string {
  return cleanCustomName(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Clean names, no blanks, no two with the same key (the first is kept), at most CUSTOM_LIMIT. */
export function tidyCustom(list: ReadonlyArray<Partial<CustomSubject>> | null | undefined): CustomSubject[] {
  const seen = new Set<string>();
  const kept: CustomSubject[] = [];
  for (const item of list ?? []) {
    const name = cleanCustomName(typeof item?.name === "string" ? item.name : "");
    const key = customKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push({ name, on: item?.on !== false });
    if (kept.length === CUSTOM_LIMIT) break;
  }
  return kept;
}

/** Adds `name` turned on, or turns on the one with the same key. Unchanged at the limit. */
export function addCustom(list: CustomSubject[], name: string): CustomSubject[] {
  const key = customKey(name);
  if (!key) return list;
  if (list.some((c) => customKey(c.name) === key)) {
    return list.map((c) => (customKey(c.name) === key ? { ...c, on: true } : c));
  }
  return list.length >= CUSTOM_LIMIT ? list : [...list, { name: cleanCustomName(name), on: true }];
}

/** Two lists hold the same names, on and off alike, in the same order. */
export function sameCustom(a: CustomSubject[], b: CustomSubject[]): boolean {
  return a.length === b.length && a.every((c, i) => c.name === b[i].name && c.on === b[i].on);
}

/** One place in the rotation: a fixed subject, or a custom one stored under Other. */
export type RotationEntry = {
  subject: Subject;
  /** What to call it. */
  name: string;
  /** The custom key, or "" for a fixed subject. */
  key: string;
};

/** The learner's picks in rotation order: fixed subjects in the canonical order, then custom ones in theirs. */
export function pickedEntries(choice: SubjectChoice): RotationEntry[] {
  const fixed = FIXED_SUBJECTS.filter((s) => choice.subjects.includes(s)).map((s) => ({ subject: s, name: s, key: "" }));
  const custom = tidyCustom(choice.custom)
    .filter((c) => c.on)
    .map((c) => ({ subject: "Other" as const, name: c.name, key: customKey(c.name) }));
  return [...fixed, ...custom];
}

/** What the daily lesson rotates through: the picks, or every fixed subject when nothing is picked. */
export function rotationOf(choice: SubjectChoice): RotationEntry[] {
  const picked = pickedEntries(choice);
  return picked.length ? picked : FIXED_SUBJECTS.map((s) => ({ subject: s, name: s, key: "" }));
}

/** The picked subjects' names, custom ones included. */
export function subjectNames(choice: SubjectChoice): string[] {
  return pickedEntries(choice).map((e) => e.name);
}
