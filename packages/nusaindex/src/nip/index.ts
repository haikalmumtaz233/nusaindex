import { isValidDate, isoDate, isoMonth } from "../internal/dates.js";
import { collect, isAllZero, maskDigits, toInt } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type NipErrorCode = "length" | "charset" | "date" | "sex" | "serial";

export interface Nip {
  readonly nip: string;
  readonly birthDate: string;
  readonly appointmentDate: string;
  readonly sex: "male" | "female";
  readonly serial: string;
}

const SIZE = 18;
const SEPARATORS = " .-";
const MASK_KEEP = 4;
const MIN_YEAR = 1900;
const FIRST_AGREEMENT = 21;

export function isValid(s: string): boolean {
  return scan(s).ok;
}

export function parse(s: string): Result<Nip, NipErrorCode> {
  const scanned = scan(s);
  if (!scanned.ok) {
    return scanned;
  }
  const d = scanned.value;
  const code = toInt(d.slice(12, 14));
  return success({
    nip: d,
    birthDate: isoDate(toInt(d.slice(0, 4)), toInt(d.slice(4, 6)), toInt(d.slice(6, 8))),
    appointmentDate:
      code < FIRST_AGREEMENT ? isoMonth(toInt(d.slice(8, 12)), code) : d.slice(8, 12),
    sex: d.charAt(14) === "2" ? "female" : "male",
    serial: d.slice(15, 18),
  });
}

export function format(s: string): Result<string, NipErrorCode> {
  const scanned = scan(s);
  if (!scanned.ok) {
    return scanned;
  }
  const d = scanned.value;
  return success(`${d.slice(0, 8)} ${d.slice(8, 14)} ${d.slice(14, 15)} ${d.slice(15, 18)}`);
}

export function mask(s: string): string {
  return maskDigits(s, MASK_KEEP);
}

function scan(s: string): Result<string, NipErrorCode> {
  const collected = collect(s, SEPARATORS);
  if (collected.status === "charset") {
    return failure("charset");
  }
  if (collected.status === "length" || collected.digits.length !== SIZE) {
    return failure("length");
  }
  const d = collected.digits;
  const birthYear = toInt(d.slice(0, 4));
  if (birthYear < MIN_YEAR || !isValidDate(birthYear, toInt(d.slice(4, 6)), toInt(d.slice(6, 8)))) {
    return failure("date");
  }
  const appointmentYear = toInt(d.slice(8, 12));
  const code = toInt(d.slice(12, 14));
  if (
    appointmentYear <= birthYear ||
    (code < FIRST_AGREEMENT && !isValidDate(appointmentYear, code, 1))
  ) {
    return failure("date");
  }
  const sex = d.charAt(14);
  if (sex !== "1" && sex !== "2") {
    return failure("sex");
  }
  if (isAllZero(d.slice(15, 18))) {
    return failure("serial");
  }
  return success(d);
}
