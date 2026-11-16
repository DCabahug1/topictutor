import { describe, expect, it } from "vitest";
import { KEEP_TODAY_LOGIN, callbackPath, isKeepToday } from "./next-path";

describe("isKeepToday", () => {
  it("is set only by keep=today", () => {
    expect(isKeepToday("today")).toBe(true);
    expect(isKeepToday(null)).toBe(false);
    expect(isKeepToday(undefined)).toBe(false);
    expect(isKeepToday("1")).toBe(false);
    expect(isKeepToday(["today", "today"])).toBe(false);
  });

  it("is what the finish screen's log-in link asks for", () => {
    const url = new URL(KEEP_TODAY_LOGIN, "https://example.com");
    expect(url.pathname).toBe("/login");
    expect(isKeepToday(url.searchParams.get("keep"))).toBe(true);
  });
});

describe("callbackPath", () => {
  it("carries the name, next and keep", () => {
    const url = new URL(callbackPath({ name: "Ada", next: "/stats", keepToday: true }), "https://example.com");
    expect(url.pathname).toBe("/auth/callback");
    expect(url.searchParams.get("name")).toBe("Ada");
    expect(url.searchParams.get("next")).toBe("/stats");
    expect(isKeepToday(url.searchParams.get("keep"))).toBe(true);
  });

  it("leaves keep out unless asked", () => {
    expect(callbackPath({ next: "/today" })).toBe("/auth/callback?next=%2Ftoday");
    expect(callbackPath({})).toBe("/auth/callback");
  });

  it("drops a next that leaves the site", () => {
    expect(callbackPath({ next: "//evil.com", keepToday: true })).toBe("/auth/callback?keep=today");
  });
});
