import { maskDigits } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";
import { mask as maskPhone } from "../phone/index.js";

export const MAX_TEXT = 1_048_576;
export const REDACTED = "[redacted]";

const KEEP = 4;
const MIN_DIGITS = 10;

export function text(s: string): Result<string, "length"> {
  if (s.length > MAX_TEXT) {
    return failure("length");
  }
  let out = "";
  for (let i = 0; i < s.length;) {
    if (!tokenStart(s, i)) {
      out += s.charAt(i);
      i++;
      continue;
    }
    const [end, last] = tokenEnd(s, i);
    const gluedAfter = end < s.length && isLetter(s.charCodeAt(end));
    let next = end;
    if (i > 0 && isLetter(s.charCodeAt(i - 1))) {
      next = firstRunEnd(s, i);
      out += s.slice(i, next);
    } else if (gluedAfter && last > i + 1) {
      next = last - 1;
      out += maskToken(s.slice(i, next));
    } else if (gluedAfter) {
      out += s.slice(i, end);
    } else {
      out += maskToken(s.slice(i, end));
    }
    i = next;
  }
  return success(out);
}

export function redactString(s: string): string {
  const out = text(s);
  return out.ok ? out.value : REDACTED;
}

export function maskKeep(s: string): string {
  return maskDigits(s, KEEP);
}

function tokenStart(s: string, i: number): boolean {
  return isDigit(s.charCodeAt(i)) || (s.charAt(i) === "+" && isDigit(s.charCodeAt(i + 1)));
}

function tokenEnd(s: string, start: number): [number, number] {
  let i = s.charAt(start) === "+" ? start + 1 : start;
  for (;;) {
    const last = i;
    const run = runLength(s, i);
    i += run;
    if (!isDigit(s.charCodeAt(i + 1))) {
      return [i, last];
    }
    const sep = s.charAt(i);
    const joins =
      sep === "." || sep === "-" || (sep === " " && (run >= 3 || runLength(s, i + 1) >= 3));
    if (!joins) {
      return [i, last];
    }
    i++;
  }
}

function firstRunEnd(s: string, start: number): number {
  const i = s.charAt(start) === "+" ? start + 1 : start;
  return i + runLength(s, i);
}

function runLength(s: string, i: number): number {
  let n = 0;
  while (isDigit(s.charCodeAt(i + n))) {
    n++;
  }
  return n;
}

function maskToken(token: string): string {
  let digits = "";
  for (let i = 0; i < token.length; i++) {
    if (isDigit(token.charCodeAt(i))) {
      digits += token.charAt(i);
    }
  }
  if (digits.length < MIN_DIGITS) {
    return token;
  }
  const phoneLike = token.startsWith("+")
    ? digits.startsWith("628")
    : digits.startsWith("628") || digits.startsWith("08");
  return phoneLike ? maskPhone(token) : maskKeep(token);
}

function isDigit(c: number): boolean {
  return c >= 48 && c <= 57;
}

function isLetter(c: number): boolean {
  const lower = c | 0x20;
  return lower >= 97 && lower <= 122;
}
