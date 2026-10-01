import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { nik, nip, nisn, npwp, phone, plate } from "../src/fake/index.js";
import { parseAt } from "../src/nik/index.js";
import { isValid as isValidNip } from "../src/nip/index.js";
import { isValid as isValidNisn } from "../src/nisn/index.js";
import { isValid as isValidNpwp } from "../src/npwp/index.js";
import { isValid as isValidPhone } from "../src/phone/index.js";
import { isValid as isValidPlate } from "../src/plate/index.js";
import { get } from "../src/region/index.js";

const REFERENCE_YEAR = 2026;
const seed = fc.integer({ min: 0, max: 0xffff_ffff });

describe("fake", () => {
  it("builds valid niks that match the requested options", async () => {
    for (let s = 0; s < 40; s++) {
      const value = await nik(s);
      expect(value.ok).toBe(true);
      const parsed = parseAt(value.ok ? value.value : "", REFERENCE_YEAR);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }
      const district = await get(parsed.value.districtCode);
      expect(district.ok && district.value.level).toBe("district");
      const fixed = await nik(s, {
        region: parsed.value.regencyCode,
        birthDate: "1999-12-31",
        sex: "female",
      });
      const again = parseAt(fixed.ok ? fixed.value : "", REFERENCE_YEAR);
      expect(again.ok && again.value).toMatchObject({
        regencyCode: parsed.value.regencyCode,
        birthDate: "1999-12-31",
        sex: "female",
      });
    }
  });

  it("builds valid values for every other kind", () => {
    fc.assert(
      fc.property(seed, (s) => {
        const values = [npwp(s), phone(s), nip(s), nisn(s), plate(s)];
        const [n, p, i, sn, pl] = values.map((v) => (v.ok ? v.value : ""));
        expect(isValidNpwp(n ?? "")).toBe(true);
        expect(isValidPhone(p ?? "")).toBe(true);
        expect(isValidNip(i ?? "")).toBe(true);
        expect(isValidNisn(sn ?? "")).toBe(true);
        expect(isValidPlate(pl ?? "")).toBe(true);
      }),
    );
  });

  it("rejects seeds outside the uint32 range", async () => {
    const options = { ok: false, error: { code: "options" } };
    for (const bad of [-1, 1.5, 2 ** 32, Number.NaN]) {
      expect(await nik(bad)).toEqual(options);
      expect(npwp(bad)).toEqual(options);
      expect(phone(bad)).toEqual(options);
      expect(nip(bad)).toEqual(options);
      expect(nisn(bad)).toEqual(options);
      expect(plate(bad)).toEqual(options);
    }
  });
});
