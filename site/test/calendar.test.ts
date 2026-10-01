import { describe, expect, it } from "vitest";
import { monthGrid, yearCalendar } from "../src/lib/calendar";

describe("calendar", () => {
  it("lays out a month in monday-first weeks with blanks before the first day", () => {
    const weeks = monthGrid(2026, 8, new Map());
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(weeks[0]?.[5]).toEqual({ date: "2026-08-01", day: 1, weekend: true });
    expect(weeks.at(-1)?.[0]).toEqual({ date: "2026-08-31", day: 31, weekend: false });
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it("marks holidays and collective leave from the data", () => {
    const calendar = yearCalendar(2026);
    const august = calendar.months[7];
    const cell = august?.weeks.flat().find((c) => c?.date === "2026-08-17");
    expect(cell?.holiday).toEqual({
      kind: "national",
      name: "Proklamasi Kemerdekaan",
      nameEn: "Independence Day",
    });
    expect(calendar.months).toHaveLength(12);
    expect(calendar.national).toBeGreaterThan(10);
    expect(calendar.leave).toBeGreaterThan(0);
  });
});
