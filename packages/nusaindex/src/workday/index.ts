import { inYear, years } from "../holiday/index.js";
import { parseIsoDate } from "../internal/dates.js";
import { once } from "../internal/once.js";
import { failure, success, type Result } from "../internal/result.js";

export type WorkdayErrorCode = "date" | "range" | "options";

export interface WorkdayOptions {
  readonly weekend?: readonly number[];
  readonly collectiveLeaveIsWorkday?: boolean;
}

interface Calendar {
  readonly weekend: readonly boolean[];
  readonly leaveWorkday: boolean;
}

interface DayOff {
  national: boolean;
  leave: boolean;
}

const DAY_MS = 86_400_000;
const DEFAULT_WEEKEND = [6, 0];
const DAYS_IN_WEEK = 7;

const daysOff = once(() => {
  const out = new Map<string, DayOff>();
  const c = years();
  for (let year = c.from; year <= c.to; year++) {
    const list = inYear(year);
    for (const h of list.ok ? list.value : []) {
      const d = out.get(h.date) ?? { national: false, leave: false };
      if (h.kind === "national") {
        d.national = true;
      } else {
        d.leave = true;
      }
      out.set(h.date, d);
    }
  }
  return out;
});

function calendar(options: WorkdayOptions): Result<Calendar, WorkdayErrorCode> {
  const weekend: boolean[] = Array.from({ length: DAYS_IN_WEEK }, () => false);
  for (const day of options.weekend ?? DEFAULT_WEEKEND) {
    if (!Number.isInteger(day) || day < 0 || day >= DAYS_IN_WEEK) {
      return failure("options");
    }
    weekend[day] = true;
  }
  if (weekend.every(Boolean)) {
    return failure("options");
  }
  return success({ weekend, leaveWorkday: options.collectiveLeaveIsWorkday ?? false });
}

function covered(ms: number): boolean {
  const c = years();
  const year = new Date(ms).getUTCFullYear();
  return year >= c.from && year <= c.to;
}

function parse(date: string): Result<number, WorkdayErrorCode> {
  const d = parseIsoDate(date);
  if (!d) {
    return failure("date");
  }
  const ms = Date.UTC(d.year, d.month - 1, d.day);
  return covered(ms) ? success(ms) : failure("range");
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function works(cal: Calendar, ms: number): boolean {
  if (cal.weekend[new Date(ms).getUTCDay()] === true) {
    return false;
  }
  const d = daysOff().get(iso(ms));
  return d === undefined || (!d.national && (!d.leave || cal.leaveWorkday));
}

export function isWorkday(
  date: string,
  options: WorkdayOptions = {},
): Result<boolean, WorkdayErrorCode> {
  const cal = calendar(options);
  if (!cal.ok) {
    return cal;
  }
  const t = parse(date);
  return t.ok ? success(works(cal.value, t.value)) : t;
}

export function add(
  date: string,
  days: number,
  options: WorkdayOptions = {},
): Result<string, WorkdayErrorCode> {
  const cal = calendar(options);
  if (!cal.ok) {
    return cal;
  }
  const t = parse(date);
  if (!t.ok) {
    return t;
  }
  if (!Number.isSafeInteger(days)) {
    return failure("range");
  }
  const step = days < 0 ? -DAY_MS : DAY_MS;
  let remaining = Math.abs(days);
  let ms = t.value;
  while (remaining > 0) {
    ms += step;
    if (!covered(ms)) {
      return failure("range");
    }
    if (works(cal.value, ms)) {
      remaining--;
    }
  }
  return success(iso(ms));
}

export function count(
  from: string,
  to: string,
  options: WorkdayOptions = {},
): Result<number, WorkdayErrorCode> {
  const cal = calendar(options);
  if (!cal.ok) {
    return cal;
  }
  const start = parse(from);
  if (!start.ok) {
    return start;
  }
  const end = parse(to);
  if (!end.ok) {
    return end;
  }
  if (start.value > end.value) {
    return failure("range");
  }
  let n = 0;
  for (let ms = start.value; ms <= end.value; ms += DAY_MS) {
    if (works(cal.value, ms)) {
      n++;
    }
  }
  return success(n);
}
