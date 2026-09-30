import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, mask, parse } from "../src/nip/index.js";

const pad = (n: number, width: number): string => String(n).padStart(width, "0");

const validNip = fc
  .record({
    birth: fc.date({
      min: new Date(Date.UTC(1950, 0, 1)),
      max: new Date(Date.UTC(2005, 11, 31)),
      noInvalidDate: true,
    }),
    appointmentOffset: fc.integer({ min: 18, max: 40 }),
    appointmentMonth: fc.integer({ min: 1, max: 12 }),
    female: fc.boolean(),
    serial: fc.integer({ min: 1, max: 999 }),
  })
  .map((r) => {
    const birthYear = r.birth.getUTCFullYear();
    const appointmentYear = birthYear + r.appointmentOffset;
    return {
      ...r,
      appointmentYear,
      value:
        pad(birthYear, 4) +
        pad(r.birth.getUTCMonth() + 1, 2) +
        pad(r.birth.getUTCDate(), 2) +
        pad(appointmentYear, 4) +
        pad(r.appointmentMonth, 2) +
        (r.female ? "2" : "1") +
        pad(r.serial, 3),
    };
  });

describe("nip", () => {
  it("parses the fields it was built from", () => {
    fc.assert(
      fc.property(validNip, (r) => {
        const parsed = parse(r.value);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
          return;
        }
        expect(parsed.value.birthDate).toBe(r.birth.toISOString().slice(0, 10));
        expect(parsed.value.appointmentDate).toBe(
          `${String(r.appointmentYear)}-${pad(r.appointmentMonth, 2)}`,
        );
        expect(parsed.value.sex).toBe(r.female ? "female" : "male");
      }),
    );
  });

  it("round-trips through format", () => {
    fc.assert(
      fc.property(validNip, (r) => {
        const formatted = format(r.value);
        expect(formatted.ok && parse(formatted.value)).toEqual(parse(r.value));
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
