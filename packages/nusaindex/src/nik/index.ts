import { isValidDate, isoDate } from "../internal/dates.js";
import { collect, isAllZero, maskDigits, toInt } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type NikErrorCode = "length" | "charset" | "region" | "date" | "serial";

export interface Nik {
  readonly nik: string;
  readonly provinceCode: string;
  readonly regencyCode: string;
  readonly districtCode: string;
  readonly birthDate: string;
  readonly sex: "male" | "female";
  readonly serial: string;
}

interface Fields {
  readonly digits: string;
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly female: boolean;
}

const SIZE = 16;
const SEPARATORS = " .-";
const MASK_KEEP = 4;

export function isValid(s: string): boolean {
  return scan(s, currentYear()).ok;
}

export function parse(s: string): Result<Nik, NikErrorCode> {
  return parseAt(s, currentYear());
}

export function parseAt(s: string, referenceYear: number): Result<Nik, NikErrorCode> {
  const scanned = scan(s, referenceYear);
  if (!scanned.ok) {
    return scanned;
  }
  const { digits: d, year, month, day, female } = scanned.value;
  return success({
    nik: d,
    provinceCode: d.slice(0, 2),
    regencyCode: `${d.slice(0, 2)}.${d.slice(2, 4)}`,
    districtCode: `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4, 6)}`,
    birthDate: isoDate(year, month, day),
    sex: female ? "female" : "male",
    serial: d.slice(12, 16),
  });
}

export function format(s: string): Result<string, NikErrorCode> {
  const scanned = scan(s, currentYear());
  return scanned.ok ? success(scanned.value.digits) : scanned;
}

export function mask(s: string): string {
  return maskDigits(s, MASK_KEEP);
}

function scan(s: string, referenceYear: number): Result<Fields, NikErrorCode> {
  const collected = collect(s, SEPARATORS);
  if (collected.status === "charset") {
    return failure("charset");
  }
  if (collected.status === "length" || collected.digits.length !== SIZE) {
    return failure("length");
  }
  const d = collected.digits;
  if (
    !knownProvince(toInt(d.slice(0, 2))) ||
    isAllZero(d.slice(2, 4)) ||
    isAllZero(d.slice(4, 6))
  ) {
    return failure("region");
  }
  let day = toInt(d.slice(6, 8));
  const female = day > 40;
  if (female) {
    day -= 40;
  }
  const month = toInt(d.slice(8, 10));
  const year = resolveYear(toInt(d.slice(10, 12)), referenceYear);
  if (!isValidDate(year, month, day)) {
    return failure("date");
  }
  if (isAllZero(d.slice(12, 16))) {
    return failure("serial");
  }
  return success({ digits: d, year, month, day, female });
}

function resolveYear(twoDigit: number, referenceYear: number): number {
  const year = 2000 + twoDigit;
  return year > referenceYear ? year - 100 : year;
}

function knownProvince(code: number): boolean {
  return (
    (code >= 11 && code <= 19) ||
    code === 21 ||
    (code >= 31 && code <= 36) ||
    (code >= 51 && code <= 53) ||
    (code >= 61 && code <= 65) ||
    (code >= 71 && code <= 76) ||
    code === 81 ||
    code === 82 ||
    (code >= 91 && code <= 96)
  );
}

function currentYear(): number {
  return new Date().getFullYear();
}
