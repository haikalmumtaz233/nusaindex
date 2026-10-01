import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MAX_DEPTH, MAX_TEXT, REDACTED, redact, text } from "../src/mask/index.js";

const FAKE_NIK = "3171014501909999";
const MASKED_NIK = "************9999";

function nested(levels: number): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  let current = root;
  for (let i = 0; i < levels; i++) {
    const next: Record<string, unknown> = {};
    current["child"] = next;
    current = next;
  }
  return root;
}

function at(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? Reflect.get(value, key) : undefined;
}

describe("mask.text", () => {
  it("rejects text over the limit", () => {
    expect(text("a".repeat(MAX_TEXT + 1))).toEqual({ ok: false, error: { code: "length" } });
    expect(redact("a".repeat(MAX_TEXT + 1))).toBe(REDACTED);
  });

  it("never leaks a nik surrounded by arbitrary text", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (prefix, suffix) => {
        const out = text(`${prefix} ${FAKE_NIK} ${suffix}`);
        expect(out.ok).toBe(true);
        const middle = "1450190";
        if (out.ok && !(prefix + suffix).includes(middle)) {
          expect(out.value).not.toContain(middle);
        }
      }),
    );
  });
});

describe("mask.redact", () => {
  it("does not mutate the input", () => {
    const input = { nik: FAKE_NIK, list: [FAKE_NIK] };
    const out = redact(input);
    expect(input).toEqual({ nik: FAKE_NIK, list: [FAKE_NIK] });
    expect(out).toEqual({ nik: MASKED_NIK, list: [MASKED_NIK] });
  });

  it("marks cycles and reuses shared references", () => {
    const shared = { nik: FAKE_NIK };
    const root: Record<string, unknown> = { a: shared, b: shared };
    root["self"] = root;
    const out = redact(root);
    expect(at(out, "self")).toBe("[Circular]");
    expect(at(out, "a")).toBe(at(out, "b"));
    expect(at(out, "a")).toEqual({ nik: MASKED_NIK });
  });

  it("stops at the depth limit", () => {
    let current: unknown = redact(nested(MAX_DEPTH + 5));
    for (let depth = 0; depth < MAX_DEPTH; depth++) {
      current = at(current, "child");
    }
    expect(current).toBe("[MaxDepth]");
  });

  it("handles a deep shared graph in linear time", () => {
    let node: Record<string, unknown> = { nik: FAKE_NIK };
    for (let i = 0; i < 30; i++) {
      node = { left: node, right: node };
    }
    expect(at(at(redact(node), "left"), "right")).toBeDefined();
  });

  it("never calls getters", () => {
    let calls = 0;
    const input = {
      get secret(): string {
        calls++;
        return FAKE_NIK;
      },
    };
    expect(redact(input)).toEqual({ secret: "[Getter]" });
    expect(calls).toBe(0);
  });

  it("drops prototype pollution keys", () => {
    const input: unknown = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"ok":1}',
    );
    const out = redact(input);
    expect(out).toEqual({ ok: 1 });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(Reflect.get({}, "polluted")).toBeUndefined();
  });

  it("copies dates, errors and primitives", () => {
    const date = new Date(Date.UTC(2025, 0, 2));
    const fake = Object.create(Date.prototype) as object;
    const error = new Error(`nik ${FAKE_NIK}`);
    const symbol = Symbol("s");
    const out = redact({ date, fake, error, big: 3171014501909999n, small: 7n, symbol });
    expect(at(out, "date")).toEqual(date);
    expect(at(out, "date")).not.toBe(date);
    expect(at(out, "fake")).toEqual({});
    expect(at(at(out, "error"), "message")).toBe(`nik ${MASKED_NIK}`);
    expect(at(out, "big")).toBe(MASKED_NIK);
    expect(at(out, "small")).toBe(7n);
    expect(at(out, "symbol")).toBe(symbol);
  });
});
