import { describe, expect, it } from "vitest";
import { fakeValues, maskParts, regionMatches, rupiahView, workdayView } from "../src/lib/live";

describe("live tools", () => {
  it("reads a rupiah string into amount, format and words", () => {
    expect(rupiahView("Rp 1.500.000,50")).toEqual({
      ok: true,
      amount: 1_500_000.5,
      formatted: "Rp1.500.000,50",
      words: "satu juta lima ratus ribu rupiah lima puluh sen",
    });
    expect(rupiahView("Rp 1,5 juta")).toEqual({ ok: false, error: "charset" });
  });

  it("splits masked text into plain and masked parts", () => {
    expect(maskParts("NIK 3273275705901349 dan HP 0859-5257-171")).toEqual([
      { text: "NIK ", masked: false },
      { text: "************", masked: true },
      { text: "1349 dan HP +62", masked: false },
      { text: "*******", masked: true },
      { text: "171", masked: false },
    ]);
    expect(maskParts("")).toEqual([]);
  });

  it("generates the same values for the same seed", async () => {
    const first = await fakeValues("phone", 7, 3);
    expect(first).toHaveLength(3);
    expect(first[0]).toBe("+628595257171");
    expect(await fakeValues("phone", 7, 3)).toEqual(first);
    expect(await fakeValues("nik", 42, 2)).toHaveLength(2);
  });

  it("adds working days and lists the holidays and weekend days skipped", () => {
    expect(workdayView("2026-08-14", 3)).toEqual({
      ok: true,
      date: "2026-08-20",
      weekendDays: 2,
      holidays: [
        { date: "2026-08-17", name: "Proklamasi Kemerdekaan", nameEn: "Independence Day" },
      ],
    });
    expect(workdayView("2030-01-02", 3)).toEqual({ ok: false, error: "range" });
  });

  it("searches regions and returns the names of their parents", async () => {
    const found = await regionMatches("gambir", 2);
    expect(found).toEqual({
      ok: true,
      value: [
        {
          code: "31.71.01",
          name: "Gambir",
          level: "district",
          parents: ["Daerah Khusus Ibukota Jakarta", "Kota Administrasi Jakarta Pusat"],
        },
        {
          code: "31.71.01.1001",
          name: "Gambir",
          level: "village",
          parents: ["Daerah Khusus Ibukota Jakarta", "Kota Administrasi Jakarta Pusat", "Gambir"],
        },
      ],
    });
    expect(await regionMatches("", 5)).toEqual({ ok: true, value: [] });
  });
});
