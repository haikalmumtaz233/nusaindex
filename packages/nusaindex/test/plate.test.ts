import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, parse } from "../src/plate/index.js";

const plate = fc.record({
  region: fc.stringMatching(/^[A-Z]{1,2}$/),
  number: fc.stringMatching(/^[1-9]\d{0,3}$/),
  suffix: fc.stringMatching(/^[A-Z]{0,3}$/),
});

describe("plate", () => {
  it("parses compact, spaced and lowercase forms alike", () => {
    fc.assert(
      fc.property(plate, (p) => {
        const expected = { ok: true, value: p };
        expect(parse(`${p.region} ${p.number} ${p.suffix}`)).toEqual(expected);
        expect(parse(`${p.region}${p.number}${p.suffix}`.toLowerCase())).toEqual(expected);
        expect(parse(`${p.region}-${p.number}-${p.suffix}`)).toEqual(expected);
      }),
    );
  });

  it("round-trips through format", () => {
    fc.assert(
      fc.property(plate, (p) => {
        const formatted = format(`${p.region}${p.number}${p.suffix}`);
        expect(formatted.ok && parse(formatted.value)).toEqual({ ok: true, value: p });
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
