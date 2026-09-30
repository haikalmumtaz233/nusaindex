import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, mask, parse, to16 } from "../src/npwp/index.js";

const legacy = fc.stringMatching(/^\d{15}$/).filter((s) => !/^0{9}/.test(s));

describe("npwp", () => {
  it("converts 15 digits to 16 by prefixing zero", () => {
    fc.assert(
      fc.property(legacy, (s) => {
        expect(to16(s)).toEqual({ ok: true, value: `0${s}` });
        expect(parse(`0${s}`)).toEqual(parse(s));
      }),
    );
  });

  it("round-trips the dotted 15-digit format", () => {
    fc.assert(
      fc.property(legacy, (s) => {
        const formatted = format(s);
        expect(formatted.ok).toBe(true);
        if (formatted.ok) {
          expect(parse(formatted.value)).toEqual(parse(s));
        }
      }),
    );
  });

  it("splits a nitku into npwp and business place", () => {
    fc.assert(
      fc.property(legacy, fc.stringMatching(/^\d{6}$/), (s, place) => {
        const parsed = parse(`0${s}${place}`);
        expect(parsed.ok && parsed.value.businessPlace).toBe(place);
      }),
    );
  });

  it("never reveals more than four digits when masking", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(mask(s).replace(/\*/g, "").length).toBeLessThanOrEqual(4);
        expect(format(s).ok).toBe(isValid(s));
      }),
    );
  });
});
