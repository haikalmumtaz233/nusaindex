import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as fake from "../src/fake/index.js";
import * as root from "../src/index.js";

interface VectorCase {
  fn: string;
  args: unknown[];
  output?: unknown;
  error?: string;
}

interface VectorFile {
  module: string;
  cases: VectorCase[];
}

type AnyFunction = (...args: unknown[]) => unknown;

const api = { ...root, fake };

const vectorDir = join(import.meta.dirname, "..", "..", "..", "testdata", "vectors");

function loadVectors(): VectorFile[] {
  return readdirSync(vectorDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(vectorDir, f), "utf8")) as VectorFile);
}

function moduleFunctions(name: string): Map<string, AnyFunction> {
  const namespace: unknown = Reflect.get(api, name);
  const fns = new Map<string, AnyFunction>();
  if (typeof namespace !== "object" || namespace === null) {
    return fns;
  }
  for (const [key, value] of Object.entries(namespace)) {
    if (typeof value === "function") {
      fns.set(key, value as AnyFunction);
    }
  }
  return fns;
}

function isResult(
  value: unknown,
): value is { ok: boolean; value?: unknown; error?: { code: string } } {
  return typeof value === "object" && value !== null && "ok" in value;
}

const files = loadVectors();

describe("vectors", () => {
  it("has at least one vector file", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(file.module, () => {
      const fns = moduleFunctions(file.module);

      it("covers every exported function", () => {
        expect(fns.size).toBeGreaterThan(0);
        const used = new Set(file.cases.map((c) => c.fn));
        expect([...fns.keys()].filter((k) => !used.has(k))).toEqual([]);
        expect([...used].filter((k) => !fns.has(k))).toEqual([]);
      });

      file.cases.forEach((c, i) => {
        it(`${String(i)} ${c.fn}(${JSON.stringify(c.args)})`, async () => {
          const fn = fns.get(c.fn);
          expect(fn).toBeDefined();
          const result: unknown = await fn?.(...c.args);
          if (isResult(result)) {
            if (c.error !== undefined) {
              expect(result).toEqual({ ok: false, error: { code: c.error } });
            } else {
              expect(result).toEqual({ ok: true, value: c.output });
            }
            return;
          }
          expect(c.error).toBeUndefined();
          expect(result).toEqual(c.output);
        });
      });
    });
  }
});
