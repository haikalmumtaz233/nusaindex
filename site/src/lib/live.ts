import * as holiday from "nusaindex/holiday";
import * as mask from "nusaindex/mask";
import * as region from "nusaindex/region";
import * as rupiah from "nusaindex/rupiah";
import * as workday from "nusaindex/workday";
import { sample, type Kind } from "./playground";

interface Failure {
  readonly ok: false;
  readonly error: string;
}

export type RupiahView =
  | {
      readonly ok: true;
      readonly amount: number;
      readonly formatted: string;
      readonly words: string;
    }
  | Failure;

export function rupiahView(text: string): RupiahView {
  const parsed = rupiah.parse(text);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error.code };
  }
  const formatted = rupiah.format(parsed.value);
  const words = rupiah.terbilang(parsed.value);
  if (!formatted.ok) {
    return { ok: false, error: formatted.error.code };
  }
  if (!words.ok) {
    return { ok: false, error: words.error.code };
  }
  return { ok: true, amount: parsed.value, formatted: formatted.value, words: words.value };
}

export interface MaskPart {
  readonly text: string;
  readonly masked: boolean;
}

export function maskParts(text: string): MaskPart[] {
  const masked = mask.text(text);
  const output = masked.ok ? masked.value : mask.REDACTED;
  return output
    .split(/(\*+)/)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, masked: part.startsWith("*") }));
}

export async function fakeValues(kind: Kind, seed: number, count: number): Promise<string[]> {
  const seeds = Array.from({ length: count }, (_, i) => (seed + i) >>> 0);
  return Promise.all(seeds.map((s) => sample(kind, s)));
}

export interface SkippedHoliday {
  readonly date: string;
  readonly name: string;
  readonly nameEn: string;
}

export type WorkdayView =
  | {
      readonly ok: true;
      readonly date: string;
      readonly weekendDays: number;
      readonly holidays: readonly SkippedHoliday[];
    }
  | Failure;

const DAY_MS = 86_400_000;

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function weekendDaysBetween(from: string, to: string): number {
  let count = 0;
  for (let d = from; d <= to; d = shift(d, 1)) {
    const day = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (day === 0 || day === 6) {
      count += 1;
    }
  }
  return count;
}

export function workdayView(start: string, days: number): WorkdayView {
  const result = workday.add(start, days);
  if (!result.ok) {
    return { ok: false, error: result.error.code };
  }
  const [from, to] = days >= 0 ? [shift(start, 1), result.value] : [result.value, shift(start, -1)];
  const skipped = holiday.between(from, to);
  return {
    ok: true,
    date: result.value,
    weekendDays: weekendDaysBetween(from, to),
    holidays: skipped.ok
      ? skipped.value.map((h) => ({ date: h.date, name: h.name, nameEn: h.nameEn }))
      : [],
  };
}

export interface RegionMatch {
  readonly code: string;
  readonly name: string;
  readonly level: region.RegionLevel;
  readonly parents: readonly string[];
}

async function parentNames(code: string | undefined): Promise<string[]> {
  if (code === undefined) {
    return [];
  }
  const parent = await region.get(code);
  if (!parent.ok) {
    return [];
  }
  return [...(await parentNames(parent.value.parentCode)), parent.value.name];
}

export async function regionMatches(
  query: string,
  limit: number,
): Promise<{ readonly ok: true; readonly value: readonly RegionMatch[] } | Failure> {
  if (query.trim() === "") {
    return { ok: true, value: [] };
  }
  const found = await region.search(query, { limit });
  if (!found.ok) {
    return { ok: false, error: found.error.code };
  }
  const value = await Promise.all(
    found.value.map(async (r) => ({
      code: r.code,
      name: r.name,
      level: r.level,
      parents: await parentNames(r.parentCode),
    })),
  );
  return { ok: true, value };
}
