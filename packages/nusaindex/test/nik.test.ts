import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { format, isValid, mask, parseAt } from "../src/nik/index.js";

const pad = (n: number, width: number): string => String(n).padStart(width, "0");

const validNik = fc
  .record({
    province: fc.constantFrom(11, 21, 31, 32, 36, 51, 64, 65, 76, 82, 91, 96),
    regency: fc.integer({ min: 1, max: 99 }),
    district: fc.integer({ min: 1, max: 99 }),
    birth: fc.date({
      min: new Date(Date.UTC(1927, 0, 1)),
      max: new Date(Date.UTC(2025, 11, 31)),
      noInvalidDate: true,
    }),
    female: fc.boolean(),
    serial: fc.integer({ min: 1, max: 9999 }),
  })
  .map((r) => ({
    ...r,
    value:
      pad(r.province, 2) +
      pad(r.regency, 2) +
      pad(r.district, 2) +
      pad(r.birth.getUTCDate() + (r.female ? 40 : 0), 2) +
      pad(r.birth.getUTCMonth() + 1, 2) +
      pad(r.birth.getUTCFullYear() % 100, 2) +
      pad(r.serial, 4),
  }));

describe("nik", () => {
  it("parses the fields it was built from", () => {
    fc.assert(
      fc.property(validNik, (r) => {
        const parsed = parseAt(r.value, 2026);
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
          return;
        }
        expect(parsed.value.birthDate).toBe(r.birth.toISOString().slice(0, 10));
        expect(parsed.value.sex).toBe(r.female ? "female" : "male");
        expect(parsed.value.serial).toBe(pad(r.serial, 4));
      }),
    );
  });

  it("round-trips through format", () => {
    fc.assert(
      fc.property(validNik, (r) => {
        const formatted = format(r.value.replace(/(\d{4})(?=\d)/g, "$1 "));
        expect(formatted).toEqual({ ok: true, value: r.value });
      }),
    );
  });

  it("never reveals more than four digits when masking", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const masked = mask(s);
        expect(masked.replace(/\*/g, "").length).toBeLessThanOrEqual(4);
        expect(format(s).ok).toBe(isValid(s));
      }),
    );
  });
});
