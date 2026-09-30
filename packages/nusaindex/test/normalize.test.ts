import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { text } from "../src/normalize/index.js";

describe("normalize.text", () => {
  it("is idempotent", () => {
    fc.assert(
      fc.property(fc.string({ unit: "binary" }), (s) => {
        const once = text(s);
        expect(text(once)).toBe(once);
      }),
    );
  });

  it("maps full-width ASCII to ASCII", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0x21, max: 0x7e }), (cp) => {
        expect(text(String.fromCodePoint(cp + 0xfee0))).toBe(String.fromCodePoint(cp));
      }),
    );
  });
});
