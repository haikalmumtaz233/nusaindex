import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, mask, parse } from "../src/nisn/index.js";

describe("nisn", () => {
  it("accepts any ten digits except all zeros", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{10}$/), (s) => {
        expect(isValid(s)).toBe(s !== "0000000000");
      }),
    );
  });

  it("agrees between format, parse and mask", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(format(s).ok).toBe(parse(s).ok);
        expect(mask(s).replace(/\*/g, "").length).toBeLessThanOrEqual(4);
      }),
    );
  });
});
