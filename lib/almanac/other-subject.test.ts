import { describe, expect, it } from "vitest";
import {
  CUSTOM_LIMIT,
  CUSTOM_NAME_LIMIT,
  FIXED_SUBJECTS,
  addCustom,
  cleanCustomName,
  customKey,
  pickedEntries,
  rotationOf,
  sameCustom,
  subjectNames,
  tidyCustom,
} from "./other-subject";

describe("cleanCustomName", () => {
  it("tidies spaces and keeps the learner's capitals", () => {
    expect(cleanCustomName("  Chess   openings ")).toBe("Chess openings");
  });

  it("cuts long names to the limit", () => {
    expect(cleanCustomName("a".repeat(200))).toHaveLength(CUSTOM_NAME_LIMIT);
  });

  it("is empty for nothing", () => {
    expect(cleanCustomName(null)).toBe("");
    expect(cleanCustomName("   ")).toBe("");
  });
});

describe("customKey", () => {
  it("shares one key across case, punctuation and spacing", () => {
    expect(customKey("Chess openings")).toBe("chess openings");
    expect(customKey("chess  OPENINGS!")).toBe("chess openings");
    expect(customKey("Chess-openings")).toBe("chess openings");
  });

  it("keeps letters outside English", () => {
    expect(customKey("Café culture")).toBe("café culture");
    expect(customKey("Café culture")).toBe("café culture");
  });

  it("is empty when there are no letters or digits", () => {
    expect(customKey("?!")).toBe("");
  });
});

describe("tidyCustom", () => {
  it("drops blanks and same-key repeats, keeping the first", () => {
    expect(tidyCustom([{ name: "Astronomy", on: true }, { name: "  " }, { name: "astronomy!", on: false }])).toEqual([
      { name: "Astronomy", on: true },
    ]);
  });

  it("keeps at most the limit", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ name: `Subject ${i}`, on: true }));
    expect(tidyCustom(many)).toHaveLength(CUSTOM_LIMIT);
  });

  it("treats a missing on as on", () => {
    expect(tidyCustom([{ name: "Chess" }])).toEqual([{ name: "Chess", on: true }]);
  });
});

describe("addCustom", () => {
  it("adds a new name turned on", () => {
    expect(addCustom([], "Astronomy")).toEqual([{ name: "Astronomy", on: true }]);
  });

  it("turns on a name already there instead of adding it twice", () => {
    expect(addCustom([{ name: "Astronomy", on: false }], "astronomy")).toEqual([{ name: "Astronomy", on: true }]);
  });

  it("adds nothing past the limit", () => {
    const full = Array.from({ length: CUSTOM_LIMIT }, (_, i) => ({ name: `S${i}`, on: true }));
    expect(addCustom(full, "One more")).toBe(full);
  });
});

describe("sameCustom", () => {
  it("compares names, order and on", () => {
    const a = [{ name: "A", on: true }];
    expect(sameCustom(a, [{ name: "A", on: true }])).toBe(true);
    expect(sameCustom(a, [{ name: "A", on: false }])).toBe(false);
  });
});

describe("rotation", () => {
  const choice = {
    subjects: ["History" as const, "Math" as const, "Other" as const],
    custom: [
      { name: "Chess openings", on: true },
      { name: "Knitting", on: false },
      { name: "Astronomy", on: true },
    ],
  };

  it("puts fixed picks in the canonical order, then custom ones in theirs, skipping off ones and Other", () => {
    expect(pickedEntries(choice)).toEqual([
      { subject: "Math", name: "Math", key: "" },
      { subject: "History", name: "History", key: "" },
      { subject: "Other", name: "Chess openings", key: "chess openings" },
      { subject: "Other", name: "Astronomy", key: "astronomy" },
    ]);
    expect(subjectNames(choice)).toEqual(["Math", "History", "Chess openings", "Astronomy"]);
  });

  it("rotates through every fixed subject when nothing is picked", () => {
    expect(rotationOf({ subjects: [], custom: [{ name: "Knitting", on: false }] }).map((e) => e.name)).toEqual([
      ...FIXED_SUBJECTS,
    ]);
  });
});
