import { redactString } from "./text.js";

export const MAX_DEPTH = 32;

const MARKER_DEPTH = "[MaxDepth]";
const MARKER_CIRCULAR = "[Circular]";
const MARKER_GETTER = "[Getter]";
const MAX_EXACT_NUMBER = 1e21;
const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

interface Walk {
  readonly active: Set<object>;
  readonly done: Map<object, unknown>;
}

export function redact(value: unknown): unknown {
  return walk(value, 0, { active: new Set(), done: new Map() });
}

function walk(value: unknown, depth: number, state: Walk): unknown {
  switch (typeof value) {
    case "string":
      return redactString(value);
    case "number":
      return redactNumber(value);
    case "bigint":
      return redactPrimitive(value, String(value));
    case "object":
      return value === null ? null : container(value, depth, state);
    default:
      return value;
  }
}

function container(value: object, depth: number, state: Walk): unknown {
  if (state.active.has(value)) {
    return MARKER_CIRCULAR;
  }
  if (state.done.has(value)) {
    return state.done.get(value);
  }
  if (depth >= MAX_DEPTH) {
    return MARKER_DEPTH;
  }
  state.active.add(value);
  const out = copy(value, depth, state);
  state.active.delete(value);
  state.done.set(value, out);
  return out;
}

function copy(value: object, depth: number, state: Walk): unknown {
  const date = timeOf(value);
  if (date !== undefined) {
    return new Date(date);
  }
  const out: object = Array.isArray(value) ? [] : {};
  const keys = value instanceof Error ? Object.getOwnPropertyNames(value) : Object.keys(value);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    const safeKey = redactString(key);
    if (descriptor === undefined || BLOCKED_KEYS.has(key) || BLOCKED_KEYS.has(safeKey)) {
      continue;
    }
    const item = "value" in descriptor ? walk(descriptor.value, depth + 1, state) : MARKER_GETTER;
    Object.defineProperty(out, safeKey, {
      value: item,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return out;
}

function timeOf(value: object): number | undefined {
  if (!(value instanceof Date)) {
    return undefined;
  }
  try {
    return Date.prototype.getTime.call(value);
  } catch {
    return undefined;
  }
}

function redactNumber(n: number): unknown {
  if (!Number.isInteger(n) || Math.abs(n) >= MAX_EXACT_NUMBER) {
    return n;
  }
  return redactPrimitive(n, String(n));
}

function redactPrimitive(original: number | bigint, s: string): unknown {
  const out = redactString(s);
  return out === s ? original : out;
}
