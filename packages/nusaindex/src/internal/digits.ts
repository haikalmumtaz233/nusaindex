export const MAX_INPUT = 64;

export type CollectResult =
  { readonly status: "ok"; readonly digits: string } | { readonly status: "charset" | "length" };

export function collect(s: string, separators: string): CollectResult {
  let digits = "";
  for (let i = 0; i < s.length; i++) {
    if (i === MAX_INPUT) {
      return { status: "length" };
    }
    const c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) {
      digits += s.charAt(i);
      continue;
    }
    if (c > 127 || !separators.includes(s.charAt(i))) {
      return { status: "charset" };
    }
  }
  return { status: "ok", digits };
}

export function toInt(s: string): number {
  return Number.parseInt(s, 10);
}

export function isAllZero(s: string): boolean {
  for (const ch of s) {
    if (ch !== "0") {
      return false;
    }
  }
  return true;
}

export function maskDigits(s: string, keep: number): string {
  let digits = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) {
      digits += s.charAt(i);
    }
  }
  const hidden = digits.length - keep;
  if (hidden <= 0) {
    return "*".repeat(digits.length);
  }
  return "*".repeat(hidden) + digits.slice(hidden);
}
