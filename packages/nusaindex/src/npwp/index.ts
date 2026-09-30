import { collect, isAllZero, maskDigits } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";
import { isValid as isValidNik } from "../nik/index.js";

export type NpwpErrorCode = "length" | "charset" | "nik" | "serial";

export interface Npwp {
  readonly npwp16: string;
  readonly npwp15?: string;
  readonly nitku?: string;
  readonly businessPlace?: string;
  readonly isNik: boolean;
  readonly taxOffice?: string;
  readonly status?: string;
}

interface Scanned {
  readonly digits: string;
  readonly base: string;
}

const LEGACY_SIZE = 15;
const SIZE = 16;
const NITKU_SIZE = 22;
const SEPARATORS = " .-";
const MASK_KEEP = 4;

export function isValid(s: string): boolean {
  return scan(s).ok;
}

export function parse(s: string): Result<Npwp, NpwpErrorCode> {
  const scanned = scan(s);
  if (!scanned.ok) {
    return scanned;
  }
  const { digits: d, base } = scanned.value;
  const isNik = !base.startsWith("0");
  const legacy = isNik
    ? {}
    : { npwp15: base.slice(1), taxOffice: base.slice(10, 13), status: base.slice(13, 16) };
  const nitku = d.length === NITKU_SIZE ? { nitku: d, businessPlace: d.slice(SIZE) } : {};
  return success({ npwp16: base, ...legacy, ...nitku, isNik });
}

export function format(s: string): Result<string, NpwpErrorCode> {
  const scanned = scan(s);
  if (!scanned.ok) {
    return scanned;
  }
  const d = scanned.value.digits;
  if (d.length !== LEGACY_SIZE) {
    return success(d);
  }
  return success(
    `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9, 12)}.${d.slice(12, 15)}`,
  );
}

export function to16(s: string): Result<string, NpwpErrorCode> {
  const scanned = scan(s);
  return scanned.ok ? success(scanned.value.base) : scanned;
}

export function mask(s: string): string {
  return maskDigits(s, MASK_KEEP);
}

function scan(s: string): Result<Scanned, NpwpErrorCode> {
  const collected = collect(s, SEPARATORS);
  if (collected.status === "charset") {
    return failure("charset");
  }
  if (collected.status === "length") {
    return failure("length");
  }
  const d = collected.digits;
  if (d.length !== LEGACY_SIZE && d.length !== SIZE && d.length !== NITKU_SIZE) {
    return failure("length");
  }
  const base = d.length === LEGACY_SIZE ? `0${d}` : d.slice(0, SIZE);
  if (!base.startsWith("0")) {
    return isValidNik(base) ? success({ digits: d, base }) : failure("nik");
  }
  if (isAllZero(base.slice(1, 10))) {
    return failure("serial");
  }
  return success({ digits: d, base });
}
