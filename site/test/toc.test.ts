import { describe, expect, it } from "vitest";
import { atPageEnd, lastVisible } from "../src/lib/toc";

describe("table of contents at the end of a page", () => {
  it("knows when the page cannot scroll further", () => {
    expect(atPageEnd(1200, 800, 2000)).toBe(true);
    expect(atPageEnd(1199, 800, 2000)).toBe(true);
    expect(atPageEnd(1000, 800, 2000)).toBe(false);
  });

  it("picks the last heading that has scrolled into view", () => {
    expect(lastVisible([-900, -300, 120, 640], 800)).toBe(3);
    expect(lastVisible([-900, -300, 120, 900], 800)).toBe(2);
    expect(lastVisible([], 800)).toBe(-1);
    expect(lastVisible([900], 800)).toBe(-1);
  });
});
