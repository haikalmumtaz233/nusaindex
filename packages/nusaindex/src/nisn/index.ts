import { collect, isAllZero, maskDigits } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type NisnErrorCode = "length" | "charset" | "serial";

export interface Nisn {
  readonly nisn: string;
}

const SIZE = 10;
const SEPARATORS = " .-";
const MASK_KEEP = 4;

export function isValid(s: string): boolean {
  return parse(s).ok;
}

export function parse(s: string): Result<Nisn, NisnErrorCode> {
  const collected = collect(s, SEPARATORS);
  if (collected.status === "charset") {
    return failure("charset");
  }
  if (collected.status === "length" || collected.digits.length !== SIZE) {
    return failure("length");
  }
  if (isAllZero(collected.digits)) {
    return failure("serial");
  }
  return success({ nisn: collected.digits });
}

export function format(s: string): Result<string, NisnErrorCode> {
  const parsed = parse(s);
  return parsed.ok ? success(parsed.value.nisn) : parsed;
}

export function mask(s: string): string {
  return maskDigits(s, MASK_KEEP);
}
