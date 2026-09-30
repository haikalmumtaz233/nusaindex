import { describe, expect, it } from "vitest";
import { add, count } from "../src/workday/index.js";

describe("workday", () => {
  it("counts the working days that add steps over", () => {
    for (let n = 1; n <= 60; n++) {
      const end = add("2025-01-02", n);
      expect(end.ok && count("2025-01-02", end.value)).toEqual({ ok: true, value: n + 1 });
    }
  });

  it("rejects a fractional day count", () => {
    expect(add("2025-01-02", 1.5)).toEqual({ ok: false, error: { code: "range" } });
  });
});
