import { describe, expect, it } from "vitest";
import { sectionSlots } from "./rules";

describe("sectionSlots", () => {
  it("holds the reserved places while the lesson is being written", () => {
    expect(sectionSlots(1, 3, true)).toBe(3);
    expect(sectionSlots(2, 3, true)).toBe(3);
  });

  it("drops leftover places once a two-section lesson is written", () => {
    expect(sectionSlots(2, 3, false)).toBe(2);
  });

  it("never cuts sections a lesson has", () => {
    expect(sectionSlots(4, 3, true)).toBe(4);
    expect(sectionSlots(4, 3, false)).toBe(4);
  });

  it("holds the places when nothing has arrived yet", () => {
    expect(sectionSlots(0, 3, false)).toBe(3);
  });
});
