import { holidays as holidayText } from "../generated/holidays.js";
import { isoDate, parseIsoDate } from "../internal/dates.js";
import { once } from "../internal/once.js";
import { failure, success, type Result } from "../internal/result.js";

export type HolidayKind = "national" | "collective_leave";
export type HolidayErrorCode = "date" | "range";

export interface Holiday {
  readonly date: string;
  readonly kind: HolidayKind;
  readonly name: string;
  readonly nameEn: string;
  readonly basis: string;
}

export interface Coverage {
  readonly from: number;
  readonly to: number;
}

const all = once(() =>
  holidayText.split("\n").map((line): Holiday => {
    const [date = "", kind = "", name = "", nameEn = "", basis = ""] = line.split("|");
    return { date, kind: kind === "n" ? "national" : "collective_leave", name, nameEn, basis };
  }),
);

const coverage = once((): Coverage => ({
  from: Number(all()[0]?.date.slice(0, 4)),
  to: Number(all().at(-1)?.date.slice(0, 4)),
}));

export function years(): Coverage {
  return coverage();
}

function lowerBound(date: string, inclusive: boolean): number {
  const list = all();
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const d = list[mid]?.date ?? "";
    if (d < date || (!inclusive && d === date)) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function span(from: string, to: string): Holiday[] {
  return all().slice(lowerBound(from, true), lowerBound(to, false));
}

function inCoverage(year: number): boolean {
  const c = coverage();
  return Number.isInteger(year) && year >= c.from && year <= c.to;
}

function check(date: string): Result<string, HolidayErrorCode> {
  const parsed = parseIsoDate(date);
  if (!parsed) {
    return failure("date");
  }
  return inCoverage(parsed.year) ? success(date) : failure("range");
}

export function inYear(year: number): Result<Holiday[], HolidayErrorCode> {
  if (!inCoverage(year)) {
    return failure("range");
  }
  return success(span(isoDate(year, 1, 1), isoDate(year, 12, 31)));
}

export function between(from: string, to: string): Result<Holiday[], HolidayErrorCode> {
  const start = check(from);
  if (!start.ok) {
    return start;
  }
  const end = check(to);
  if (!end.ok) {
    return end;
  }
  return from > to ? failure("range") : success(span(from, to));
}

export function on(date: string): Result<Holiday[], HolidayErrorCode> {
  const checked = check(date);
  return checked.ok ? success(span(date, date)) : checked;
}
