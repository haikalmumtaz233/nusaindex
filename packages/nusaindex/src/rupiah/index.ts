import { MAX_INPUT } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";
import { scan } from "./scan.js";

export type RupiahErrorCode = "length" | "charset" | "format" | "range";

export interface RupiahOptions {
  readonly decimals?: boolean;
  readonly symbol?: boolean;
}

interface Parts {
  readonly negative: boolean;
  readonly whole: number;
  readonly sen: number;
}

export const MAX_AMOUNT = 999_999_999_999_999;
export const MAX_SEN_AMOUNT = 9_999_999_999_999.99;

const SEN_LIMIT = 1_000_000_000_000_000;
const ALLOWED = "0123456789.,- RrPpIiDd";

const UNITS = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];
const SCALES = ["", "ribu", "juta", "miliar", "triliun"];

export function format(
  amount: number,
  options: RupiahOptions = {},
): Result<string, RupiahErrorCode> {
  const split = toParts(amount);
  if (!split.ok) {
    return split;
  }
  const { negative, whole, sen } = split.value;
  let out = negative ? "-" : "";
  if (options.symbol ?? true) {
    out += "Rp";
  }
  out += grouped(whole);
  if (sen !== 0 || options.decimals === true) {
    out += "," + String(sen).padStart(2, "0");
  }
  return success(out);
}

export function isValid(s: string): boolean {
  return parse(s).ok;
}

export function parse(s: string): Result<number, RupiahErrorCode> {
  if (s.length > MAX_INPUT) {
    return failure("length");
  }
  for (let i = 0; i < s.length; i++) {
    if (!ALLOWED.includes(s.charAt(i))) {
      return failure("charset");
    }
  }
  const scanned = scan(s);
  if (scanned === undefined) {
    return failure("format");
  }
  if (scanned.overflow) {
    return failure("range");
  }
  const sen = scanned.whole * 100 + scanned.sen;
  if (scanned.sen !== 0 && sen >= SEN_LIMIT) {
    return failure("range");
  }
  const value = scanned.sen === 0 ? scanned.whole : sen / 100;
  return success(scanned.negative ? -value : value);
}

export function terbilang(amount: number): Result<string, RupiahErrorCode> {
  const split = toParts(amount);
  if (!split.ok) {
    return split;
  }
  const { negative, whole, sen } = split.value;
  const words: string[] = negative ? ["minus"] : [];
  if (whole > 0 || sen === 0) {
    pushNumber(words, whole);
    words.push("rupiah");
  }
  if (sen > 0) {
    pushNumber(words, sen);
    words.push("sen");
  }
  return success(words.join(" "));
}

function toParts(amount: number): Result<Parts, RupiahErrorCode> {
  if (!Number.isFinite(amount)) {
    return failure("range");
  }
  const abs = Math.abs(amount);
  let whole = Math.trunc(abs);
  let sen = Math.round((abs - whole) * 100);
  if (sen === 100) {
    whole++;
    sen = 0;
  }
  if (whole > MAX_AMOUNT || (sen !== 0 && whole * 100 + sen >= SEN_LIMIT)) {
    return failure("range");
  }
  return success({ negative: amount < 0 && (whole !== 0 || sen !== 0), whole, sen });
}

function grouped(n: number): string {
  const s = String(n);
  const lead = s.length % 3 || 3;
  let out = s.slice(0, lead);
  for (let i = lead; i < s.length; i += 3) {
    out += "." + s.slice(i, i + 3);
  }
  return out;
}

function pushNumber(words: string[], n: number): void {
  if (n === 0) {
    words.push("nol");
    return;
  }
  const groups: number[] = [];
  for (let rest = n; groups.length < SCALES.length; rest = Math.floor(rest / 1000)) {
    groups.push(rest % 1000);
  }
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i] ?? 0;
    if (g === 0) {
      continue;
    }
    if (i === 1 && g === 1) {
      words.push("seribu");
      continue;
    }
    pushHundreds(words, g);
    if (i > 0) {
      words.push(SCALES[i] ?? "");
    }
  }
}

function pushHundreds(words: string[], g: number): void {
  const h = Math.floor(g / 100);
  const r = g % 100;
  if (h === 1) {
    words.push("seratus");
  } else if (h > 1) {
    words.push(unit(h), "ratus");
  }
  if (r === 0) {
    return;
  }
  if (r < 10) {
    words.push(unit(r));
  } else if (r === 10) {
    words.push("sepuluh");
  } else if (r === 11) {
    words.push("sebelas");
  } else if (r < 20) {
    words.push(unit(r - 10), "belas");
  } else {
    words.push(unit(Math.floor(r / 10)), "puluh");
    if (r % 10 !== 0) {
      words.push(unit(r % 10));
    }
  }
}

function unit(d: number): string {
  return UNITS[d] ?? "";
}
