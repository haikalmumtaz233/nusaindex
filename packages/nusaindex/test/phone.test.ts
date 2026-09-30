import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, mask, parse } from "../src/phone/index.js";

const mobile = fc
  .tuple(
    fc.constantFrom("811", "812", "857", "896", "878", "838", "881"),
    fc.stringMatching(/^\d{6,9}$/),
  )
  .map(([prefix, rest]) => `0${prefix}${rest}`);

describe("phone", () => {
  it("accepts national, international and plus forms alike", () => {
    fc.assert(
      fc.property(mobile, (national) => {
        const expected = parse(national);
        expect(expected.ok).toBe(true);
        expect(parse(`+62${national.slice(1)}`)).toEqual(expected);
        expect(parse(`62${national.slice(1)}`)).toEqual(expected);
        expect(parse(national.slice(1))).toEqual(expected);
      }),
    );
  });

  it("round-trips through e164", () => {
    fc.assert(
      fc.property(mobile, (national) => {
        const e164 = format(national);
        expect(e164.ok && parse(e164.value)).toEqual(parse(national));
      }),
    );
  });

  it("shows only the country code and last three digits of valid numbers", () => {
    fc.assert(
      fc.property(mobile, (national) => {
        expect(mask(national)).toMatch(/^\+62\*+\d{3}$/);
      }),
    );
  });

  it("agrees between isValid and parse", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(isValid(s)).toBe(parse(s).ok);
      }),
    );
  });
});
