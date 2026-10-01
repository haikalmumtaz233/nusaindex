import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  MAX_AMOUNT,
  MAX_SEN_AMOUNT,
  format,
  isValid,
  parse,
  terbilang,
} from "../src/rupiah/index.js";

const wholeAmount = fc.integer({ min: -MAX_AMOUNT, max: MAX_AMOUNT });
const senAmount = fc
  .integer({ min: -Math.round(MAX_SEN_AMOUNT * 100), max: Math.round(MAX_SEN_AMOUNT * 100) })
  .map((sen) => sen / 100);

describe("rupiah", () => {
  it("round-trips whole and sen amounts through format and parse", () => {
    fc.assert(
      fc.property(fc.oneof(wholeAmount, senAmount), fc.boolean(), (amount, decimals) => {
        const formatted = format(amount, { decimals });
        expect(formatted.ok).toBe(true);
        const back = formatted.ok ? parse(formatted.value) : undefined;
        expect(back).toEqual({ ok: true, value: amount === 0 ? 0 : amount });
        expect(terbilang(amount).ok).toBe(true);
      }),
    );
  });

  it("agrees between isValid and parse for any string", () => {
    fc.assert(
      fc.property(fc.string({ unit: fc.constantFrom(..."0123456789.,- RpIDR".split("")) }), (s) => {
        expect(isValid(s)).toBe(parse(s).ok);
      }),
    );
  });

  it("rejects amounts that are not finite", () => {
    expect(format(Number.NaN)).toEqual({ ok: false, error: { code: "range" } });
    expect(terbilang(Number.POSITIVE_INFINITY)).toEqual({ ok: false, error: { code: "range" } });
  });
});
