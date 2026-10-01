import type { Result } from "../internal/result.js";

function cell(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const code: unknown = Reflect.get(value, "code");
    const name: unknown = Reflect.get(value, "name");
    if (typeof code === "string" && typeof name === "string") {
      return `${code} ${name}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function row(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    return Object.values(value).map(cell).join("\t");
  }
  return String(value);
}

export function text(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(row);
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    const width = Math.max(...entries.map(([key]) => key.length));
    return entries.map(([key, v]) => `${key.padEnd(width)}  ${cell(v)}`);
  }
  return [String(value)];
}

export function summary(result: Result<unknown>): string {
  if (!result.ok) {
    return `invalid\t${result.error.code}`;
  }
  return typeof result.value === "object" && result.value !== null ? "valid" : String(result.value);
}
