import { describe, expect, it } from "vitest";
import { roles, type Detail } from "../src/lib/anatomy";
import { detailText, errorText, localeOf, roleLabel, ui } from "../src/lib/anatomy-text";

describe("anatomy text", () => {
  it("labels every role in both languages", () => {
    for (const role of roles) {
      expect(roleLabel(role, "en")).not.toBe("");
      expect(roleLabel(role, "id")).not.toBe("");
    }
    expect(roleLabel("district", "id")).toBe("Kecamatan");
  });

  it("describes a birth segment with the encoded sex", () => {
    const detail: Detail = { type: "birth", date: "1990-05-17", sex: "female" };
    expect(detailText(detail, "en")).toBe("17 May 1990, female (day + 40)");
    expect(detailText(detail, "id")).toBe("17 Mei 1990, perempuan (tanggal + 40)");
    expect(detailText({ type: "birth", date: "1959-06-07", sex: "male" }, "en")).toBe(
      "7 June 1959, male",
    );
  });

  it("describes dates, months, sex, offices and counts", () => {
    expect(detailText({ type: "date", date: "1970-05-03" }, "id")).toBe("3 Mei 1970");
    expect(detailText({ type: "month", month: "2001-08" }, "en")).toBe("August 2001");
    expect(detailText({ type: "month", month: "2001-08" }, "id")).toBe("Agustus 2001");
    expect(detailText({ type: "sex", sex: "male" }, "id")).toBe("Laki-laki");
    expect(detailText({ type: "office", head: false }, "en")).toBe("Branch");
    expect(detailText({ type: "office", head: true }, "id")).toBe("Pusat");
    expect(detailText({ type: "count", value: 2 }, "en")).toBe("No. 2");
    expect(detailText({ type: "count", value: 2 }, "id")).toBe("Ke-2");
    expect(detailText({ type: "names", values: ["IM3", "Indosat"] }, "en")).toBe("IM3, Indosat");
    expect(detailText({ type: "none" }, "en")).toBe("");
  });

  it("summarises plate areas by size", () => {
    const one: Detail = {
      type: "area",
      provinces: ["Bali"],
      regencies: 1,
      first: "Kota Denpasar",
    };
    const many: Detail = { type: "area", provinces: ["Maluku"], regencies: 11, first: "X" };
    const mixed: Detail = {
      type: "area",
      provinces: ["Banten", "Jawa Barat"],
      regencies: 5,
      first: "X",
    };
    expect(detailText(one, "en")).toBe("Kota Denpasar, Bali");
    expect(detailText(many, "en")).toBe("11 regencies and cities in Maluku");
    expect(detailText(many, "id")).toBe("11 kabupaten/kota di Maluku");
    expect(detailText(mixed, "id")).toBe("5 kabupaten/kota di Banten, Jawa Barat");
  });

  it("explains error codes in plain words, with the expected length per kind", () => {
    expect(errorText("nik", "length", "en")).toBe("A NIK has 16 digits.");
    expect(errorText("nip", "length", "id")).toBe("NIP terdiri dari 18 digit.");
    expect(errorText("plate", "format", "en")).toBe("Not a plate like B 1234 XYZ.");
    expect(errorText("nik", "region", "id")).toBe("Kode wilayah ini tidak ada.");
    expect(errorText("nik", "mystery", "en")).toBe("Not valid (mystery).");
  });

  it("maps page languages to a locale and has ui strings for both", () => {
    expect(localeOf("id")).toBe("id");
    expect(localeOf("en")).toBe("en");
    expect(localeOf(undefined)).toBe("en");
    expect(ui("id").generate).toBe("Buat contoh lain");
    expect(ui("en").input.phone).toBe("Paste a phone number");
  });
});
