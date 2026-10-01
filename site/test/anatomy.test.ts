import { describe, expect, it } from "vitest";
import { anatomy, type Segment } from "../src/lib/anatomy";

function digitsOf(segments: readonly Segment[]): string {
  return segments.map((s) => s.digits).join("");
}

async function segmentsOf(kind: Parameters<typeof anatomy>[0], value: string): Promise<Segment[]> {
  const result = await anatomy(kind, value);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return [...result.value];
}

describe("anatomy", () => {
  it("splits a nik into region, birth date and serial with region names", async () => {
    const segments = await segmentsOf("nik", "3273-2757-0590-1349");
    expect(digitsOf(segments)).toBe("3273275705901349");
    expect(segments.map((s) => [s.digits, s.role, s.tone])).toEqual([
      ["32", "province", 1],
      ["73", "regency", 2],
      ["27", "district", 3],
      ["570590", "birth", 4],
      ["1349", "serial", 5],
    ]);
    expect(segments.map((s) => s.detail)).toEqual([
      { type: "names", values: ["Jawa Barat"] },
      { type: "names", values: ["Kota Bandung"] },
      { type: "names", values: ["Gedebage"] },
      { type: "birth", date: "1990-05-17", sex: "female" },
      { type: "none" },
    ]);
  });

  it("reports the parse error code", async () => {
    expect(await anatomy("nik", "327327570590134")).toEqual({ ok: false, error: "length" });
    expect(await anatomy("phone", "0899")).toEqual({ ok: false, error: "length" });
  });

  it("splits a 15-digit npwp into its legacy fields", async () => {
    const segments = await segmentsOf("npwp", "15.067.320.0-246.000");
    expect(segments.map((s) => [s.digits, s.role])).toEqual([
      ["0", "lead"],
      ["15", "taxpayerType"],
      ["067320", "registration"],
      ["0", "check"],
      ["246", "taxOffice"],
      ["000", "status"],
    ]);
    expect(segments.at(-1)?.detail).toEqual({ type: "office", head: true });
  });

  it("treats a 16-digit npwp that is a nik as one nik segment and keeps the nitku place", async () => {
    const segments = await segmentsOf("npwp", "3273275705901349000001");
    expect(segments.map((s) => [s.digits, s.role])).toEqual([
      ["3273275705901349", "nik"],
      ["000001", "businessPlace"],
    ]);
  });

  it("splits a branch npwp and marks it as a branch", async () => {
    const segments = await segmentsOf("npwp", "15.067.320.0-246.001");
    expect(segments.at(-1)?.detail).toEqual({ type: "office", head: false });
  });

  it("splits a mobile number into country, prefix with brand, and subscriber", async () => {
    const segments = await segmentsOf("phone", "0857-2359-29957");
    expect(segments.map((s) => [s.digits, s.role])).toEqual([
      ["+62", "country"],
      ["857", "prefix"],
      ["235929957", "subscriber"],
    ]);
    expect(segments[1]?.detail).toEqual({
      type: "names",
      values: ["IM3", "Indosat Ooredoo Hutchison"],
    });
  });

  it("splits a fixed-line number by area code", async () => {
    const segments = await segmentsOf("phone", "(021) 5550-1234");
    expect(segments.map((s) => [s.digits, s.role])).toEqual([
      ["+62", "country"],
      ["21", "areaCode"],
      ["55501234", "subscriber"],
    ]);
    expect(segments[1]?.detail).toEqual({
      type: "names",
      values: ["Daerah Khusus Ibukota Jakarta"],
    });
  });

  it("splits a plate and summarises the regencies behind its region code", async () => {
    const segments = await segmentsOf("plate", "DE 4502 B");
    expect(segments.map((s) => [s.digits, s.role])).toEqual([
      ["DE", "plateRegion"],
      ["4502", "number"],
      ["B", "suffix"],
    ]);
    expect(segments[0]?.detail).toEqual({
      type: "area",
      provinces: ["Maluku"],
      regencies: 11,
      first: "Kabupaten Maluku Tengah",
    });
  });

  it("omits an empty plate suffix", async () => {
    const segments = await segmentsOf("plate", "B 1234");
    expect(segments.map((s) => s.role)).toEqual(["plateRegion", "number"]);
  });

  it("splits a pns nip into birth date, appointment month, sex and serial", async () => {
    const segments = await segmentsOf("nip", "19700503 200108 2 168");
    expect(segments.map((s) => [s.digits, s.role, s.detail])).toEqual([
      ["19700503", "birthDate", { type: "date", date: "1970-05-03" }],
      ["200108", "appointment", { type: "month", month: "2001-08" }],
      ["2", "sex", { type: "sex", sex: "female" }],
      ["168", "serial", { type: "none" }],
    ]);
  });

  it("splits a pppk nip into appointment year and agreement count", async () => {
    const segments = await segmentsOf("nip", "199001172022211001");
    expect(segments.map((s) => [s.digits, s.role, s.detail])).toEqual([
      ["19900117", "birthDate", { type: "date", date: "1990-01-17" }],
      ["2022", "appointmentYear", { type: "none" }],
      ["21", "agreement", { type: "count", value: 1 }],
      ["1", "sex", { type: "sex", sex: "male" }],
      ["001", "serial", { type: "none" }],
    ]);
  });
});
