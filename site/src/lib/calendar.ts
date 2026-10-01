import * as holiday from "nusaindex/holiday";

export interface DayMark {
  readonly kind: holiday.HolidayKind;
  readonly name: string;
  readonly nameEn: string;
}

export interface Cell {
  readonly date: string;
  readonly day: number;
  readonly weekend: boolean;
  readonly holiday?: DayMark;
}

export interface Month {
  readonly month: number;
  readonly weeks: readonly (readonly (Cell | null)[])[];
}

export interface YearCalendar {
  readonly year: number;
  readonly months: readonly Month[];
  readonly national: number;
  readonly leave: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function monthGrid(
  year: number,
  month: number,
  marks: ReadonlyMap<string, DayMark>,
): (Cell | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const cells: (Cell | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day++) {
    const date = `${String(year)}-${pad(month)}-${pad(day)}`;
    const weekday = (offset + day - 1) % 7;
    const mark = marks.get(date);
    cells.push({
      date,
      day,
      weekend: weekday >= 5,
      ...(mark === undefined ? {} : { holiday: mark }),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

export function yearCalendar(year: number): YearCalendar {
  const listed = holiday.inYear(year);
  const entries = listed.ok ? listed.value : [];
  const marks = new Map<string, DayMark>();
  for (const h of entries) {
    if (!marks.has(h.date) || h.kind === "national") {
      marks.set(h.date, { kind: h.kind, name: h.name, nameEn: h.nameEn });
    }
  }
  return {
    year,
    months: Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      weeks: monthGrid(year, i + 1, marks),
    })),
    national: entries.filter((h) => h.kind === "national").length,
    leave: entries.filter((h) => h.kind === "collective_leave").length,
  };
}
