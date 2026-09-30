import { banks as bankText } from "../generated/banks.js";
import { collect } from "../internal/digits.js";
import { once } from "../internal/once.js";
import { failure, success, type Result } from "../internal/result.js";

export type BankErrorCode = "length" | "charset" | "unknown";

export interface Bank {
  readonly code: string;
  readonly bic: string;
  readonly officeCode: string;
  readonly name: string;
  readonly shortName: string;
  readonly shariaUnit: boolean;
}

const CODE_SIZE = 3;
const BIC_SIZE = 8;
const BIC_LONG_SIZE = 11;

const all = once(() =>
  bankText.split("\n").map((line): Bank => {
    const [code = "", unit = "", bic = "", officeCode = "", name = "", shortName = ""] =
      line.split("|");
    return { code, bic, officeCode, name, shortName, shariaUnit: unit === "1" };
  }),
);

export function list(): Bank[] {
  return [...all()];
}

export function byCode(code: string): Result<Bank[], BankErrorCode> {
  const collected = collect(code, " ");
  if (collected.status !== "ok") {
    return failure(collected.status);
  }
  if (collected.digits.length !== CODE_SIZE) {
    return failure("length");
  }
  const found = all().filter((b) => b.code === collected.digits);
  return found.length === 0 ? failure("unknown") : success(found);
}

export function byBic(bic: string): Result<Bank, BankErrorCode> {
  let key = "";
  for (let i = 0; i < bic.length; i++) {
    if (i === BIC_LONG_SIZE) {
      return failure("length");
    }
    const c = bic.charCodeAt(i);
    const upper = c >= 97 && c <= 122 ? c - 32 : c;
    if (!((upper >= 65 && upper <= 90) || (upper >= 48 && upper <= 57))) {
      return failure("charset");
    }
    if (i < BIC_SIZE) {
      key += String.fromCharCode(upper);
    }
  }
  if (bic.length !== BIC_SIZE && bic.length !== BIC_LONG_SIZE) {
    return failure("length");
  }
  const found = all().find((b) => b.bic === key);
  return found ? success(found) : failure("unknown");
}
