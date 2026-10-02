import { describe, expect, it } from "vitest";
import { revealScrollTop } from "../src/lib/sidebar";

describe("sidebar reveal for the current page", () => {
  it("keeps the scroll when the link is already in view", () => {
    expect(revealScrollTop({ top: 100, bottom: 130 }, { scrollTop: 0, height: 600 })).toBeNull();
    expect(revealScrollTop({ top: 900, bottom: 930 }, { scrollTop: 400, height: 600 })).toBeNull();
  });

  it("centers a link that sits below the visible part", () => {
    expect(revealScrollTop({ top: 1200, bottom: 1230 }, { scrollTop: 0, height: 600 })).toBe(915);
  });

  it("centers a link that sits above the visible part", () => {
    expect(revealScrollTop({ top: 100, bottom: 130 }, { scrollTop: 800, height: 600 })).toBe(0);
  });

  it("treats a link cut off at the edge as hidden", () => {
    expect(revealScrollTop({ top: 590, bottom: 620 }, { scrollTop: 0, height: 600 })).toBe(305);
  });
});
