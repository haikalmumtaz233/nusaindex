import { describe, expect, it } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { csvLine, parseCsvLine } from "../src/cli/csv.js";
import { MAX_LINE } from "../src/cli/io.js";
import { summary, text } from "../src/cli/render.js";
import { run } from "../src/cli/run.js";

const FAKE_NIK = "3171014501909999";

interface Outcome {
  code: number;
  out: string[];
  err: string[];
}

async function cli(args: readonly string[], input: readonly string[] = []): Promise<Outcome> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await run(args, {
    out: (line) => out.push(line),
    err: (line) => err.push(line),
    lines: async function* lines() {
      await Promise.resolve();
      yield* input;
    },
    randomSeed: () => 7,
  });
  return { code, out, err };
}

describe("cli basics", () => {
  it("prints the version and help", async () => {
    expect(await cli(["--version"])).toMatchObject({ code: 0, out: [pkg.version] });
    const help = await cli(["-h"]);
    expect(help.code).toBe(0);
    expect(help.out[0]).toContain("Usage: nusaindex");
  });

  it.each([
    [[]],
    [["--nope"]],
    [["unknown", "x"]],
    [["holiday", "2026", "--stdin"]],
    [["nik"]],
    [["nik", "1", "2"]],
    [["nik", "1", "--stdin"]],
  ])("rejects bad usage %j", async (args) => {
    const result = await cli(args);
    expect(result.code).toBe(2);
    expect(result.err.at(-1)).toContain("--help");
  });
});

describe("cli identifiers", () => {
  it("parses one value as text or json", async () => {
    const ok = await cli(["nik", FAKE_NIK]);
    expect(ok.code).toBe(0);
    expect(ok.out).toContain("sex           female");
    expect(await cli(["nisn", "12"])).toMatchObject({
      code: 1,
      err: ["nusaindex: invalid: length"],
    });
    const json = await cli(["phone", "0812-0000-0001", "--json"]);
    expect(JSON.parse(json.out[0] ?? "")).toMatchObject({
      ok: true,
      value: { e164: "+6281200000001" },
    });
  });

  it("validates lines from stdin", async () => {
    const lines = [FAKE_NIK, "12", "x".repeat(MAX_LINE + 1)];
    expect(await cli(["nik", "--stdin"], lines)).toMatchObject({
      code: 1,
      out: ["valid", "invalid\tlength", "invalid\tlength"],
    });
    const json = await cli(["nik", "--stdin", "--json"], [FAKE_NIK]);
    expect(JSON.parse(json.out[0] ?? "")).toMatchObject({ line: 1, ok: true });
    expect(await cli(["nik", "--stdin"], [FAKE_NIK])).toMatchObject({ code: 0 });
  });

  it("checks a csv column by name or number", async () => {
    const input = ["name,nik", `"Doe, ""J""",${FAKE_NIK}`, "Ani,12"];
    const byName = await cli(["nik", "--csv", "--column", "nik"], input);
    expect(byName).toMatchObject({
      code: 1,
      out: [
        "name,nik,nik_valid,nik_error",
        `"Doe, ""J""",${FAKE_NIK},true,`,
        "Ani,12,false,length",
      ],
    });
    expect((await cli(["nik", "--csv", "--column", "2"], input)).out[0]).toBe(
      "name,nik,nik_valid,nik_error",
    );
    expect((await cli(["nik", "--csv", "--column", "2"], ["name,nik", "Budi"])).out[1]).toBe(
      "Budi,false,length",
    );
    const long = await cli(["nik", "--csv", "--column", "nik"], ["nik", "x".repeat(MAX_LINE + 1)]);
    expect(long.code).toBe(2);
  });

  it.each([
    [["nik", "--csv"], ["a"]],
    [["nik", "--csv", "--json", "--column", "a"], ["a"]],
    [["nik", "--csv", "--column", "missing"], ["a,b"]],
    [["nik", "--csv", "--column", "9"], ["a,b"]],
    [["nik", "--csv", "--column", "a"], ['"broken']],
  ])("rejects bad csv input %j", async (args, input) => {
    expect((await cli(args, input)).code).toBe(2);
  });
});

describe("cli mask and rupiah", () => {
  it("masks values, text and csv columns", async () => {
    expect((await cli(["mask", "nik", FAKE_NIK])).out).toEqual(["************9999"]);
    for (const kind of ["npwp", "phone", "nip", "nisn", "account"]) {
      expect((await cli(["mask", kind, "1234567890"])).code).toBe(0);
    }
    const text = await cli(["mask", "text", "--stdin"], [`nik ${FAKE_NIK}`, ""]);
    expect(text.out).toEqual(["nik ************9999", ""]);
    const csv = await cli(["mask", "nik", "--csv", "--column", "nik"], ["nik,x", `${FAKE_NIK},1`]);
    expect(csv.out).toEqual(["nik,x", "************9999,1"]);
    expect((await cli(["mask", "card", "1"])).code).toBe(2);
  });

  it("formats, parses and spells rupiah", async () => {
    expect((await cli(["rupiah", "format", "1500000.5"])).out).toEqual(["Rp1.500.000,50"]);
    expect((await cli(["rupiah", "format", "1500", "--decimals", "--no-symbol"])).out).toEqual([
      "1.500,00",
    ]);
    expect((await cli(["rupiah", "format", "1e3"])).code).toBe(1);
    expect((await cli(["rupiah", "terbilang", "1000"])).out).toEqual(["seribu rupiah"]);
    expect((await cli(["rupiah", "terbilang", "x"])).code).toBe(1);
    expect((await cli(["rupiah", "parse", "Rp1.500,50"])).out).toEqual(["1500.5"]);
    expect((await cli(["rupiah", "round", "1"])).code).toBe(2);
    const csv = await cli(
      ["rupiah", "parse", "--csv", "--column", "1"],
      ["harga", "Rp1.500", "1.50"],
    );
    expect(csv).toMatchObject({ code: 1, out: ["harga", "1500", ""] });
    expect(csv.err).toEqual(["nusaindex: line 3: invalid harga: format"]);
  });
});

describe("cli reference data", () => {
  it("looks up regions", async () => {
    expect((await cli(["region", "get", "31.71"])).out).toContain("level       regency");
    expect((await cli(["region", "get", "99"])).code).toBe(1);
    expect((await cli(["region", "children"])).out).toHaveLength(38);
    expect((await cli(["region", "children", "31.71.01.1001"])).out).toEqual([]);
    const search = await cli([
      "region",
      "search",
      "jakarta",
      "pusat",
      "--level",
      "regency",
      "--limit",
      "2",
    ]);
    expect(search.out[0]).toContain("31.71");
    expect((await cli(["region", "search", "gambir"])).out.length).toBeGreaterThan(1);
    expect((await cli(["region", "nik", FAKE_NIK])).out.join("\n")).toContain("31.71.01 Gambir");
  });

  it("resolves old region codes and says which code it followed", async () => {
    const moved = await cli(["region", "resolve", "91.04"]);
    expect(moved.code).toBe(0);
    expect(moved.out).toContain("code          94.01");
    expect(moved.out).toContain("resolvedFrom  91.04");
    const json = await cli(["region", "resolve", "9104", "--json"]);
    expect(JSON.parse(json.out[0] ?? "")).toMatchObject({
      ok: true,
      value: { code: "94.01", resolvedFrom: "9104" },
    });
    for (const code of ["31.71", "3171"]) {
      const current = await cli(["region", "resolve", code]);
      expect(current.out.join("\n")).not.toContain("resolvedFrom");
    }
    expect((await cli(["region", "resolve", "99"])).code).toBe(1);
  });

  it("looks up banks by code or bic and lists them", async () => {
    const byCode = await cli(["bank", "014"]);
    expect(byCode.code).toBe(0);
    expect(byCode.out[0]).toContain("CENAIDJA");
    expect((await cli(["bank", "cenaidja"])).out).toContain("shortName   BCA");
    expect((await cli(["bank", "list"])).out).toHaveLength(125);
    expect((await cli(["bank", "999"])).code).toBe(1);
    expect((await cli(["bank", "014", "--json"])).out[0]).toContain('"shortName":"BCA"');
  });

  it.each([
    [["region"]],
    [["region", "get", "31", "32"]],
    [["region", "resolve"]],
    [["bank"]],
    [["bank", "014", "015"]],
    [["region", "search", "x", "--level", "city"]],
    [["region", "search", "x", "--limit", "0"]],
    [["holiday", "abc"]],
    [["workday", "is"]],
    [["workday", "next", "a", "b"]],
  ])("rejects bad usage %j", async (args) => {
    expect((await cli(args)).code).toBe(2);
  });

  it("lists holidays and computes workdays", async () => {
    expect((await cli(["holiday", "2026"])).out[0]).toMatch(/^2026-01-01\tnational/);
    expect((await cli(["holiday", "2019"])).code).toBe(1);
    expect((await cli(["workday", "is", "2026-08-17"])).out).toEqual(["false"]);
    expect((await cli(["workday", "add", "2026-08-14", "1", "--weekend", "6,0"])).out).toEqual([
      "2026-08-18",
    ]);
    expect((await cli(["workday", "add", "2026-08-14", "x"])).code).toBe(1);
    expect((await cli(["workday", "is", "2026-08-15", "--weekend", "none"])).out).toEqual(["true"]);
    expect((await cli(["workday", "is", "2026-08-15", "--weekend", "a"])).code).toBe(1);
    const count = await cli(["workday", "count", "2026-03-01", "2026-03-31", "--leave-workday"]);
    expect(count.out).toEqual(["21"]);
  });
});

describe("cli fake", () => {
  it("generates values from a seed", async () => {
    expect((await cli(["fake", "nik", "--seed", "1", "--count", "2"])).out).toEqual([
      "5105011707791121",
      "3315101006730262",
    ]);
    expect((await cli(["fake", "phone"])).out).toHaveLength(1);
    for (const kind of ["npwp", "nisn"]) {
      expect((await cli(["fake", kind, "--json"])).code).toBe(0);
    }
    expect((await cli(["fake", "plate", "--region", "B"])).out[0]).toMatch(/^B \d+/);
    const nik = await cli([
      "fake",
      "nik",
      "--region",
      "31.71",
      "--birth-date",
      "1990-01-01",
      "--sex",
      "male",
    ]);
    expect(nik.out[0]).toMatch(/^3171\d{2}010190/);
    expect((await cli(["fake", "nip", "--birth-date", "1990-02-30"])).code).toBe(1);
  });

  it.each([
    [["fake", "nik", "--sex", "x"]],
    [["fake", "card"]],
    [["fake", "nik", "--seed", "abc"]],
    [["fake", "nik", "--count", "0"]],
  ])("rejects bad usage %j", async (args) => {
    expect((await cli(args)).code).toBe(2);
  });
});

describe("cli helpers", () => {
  it("renders values", () => {
    expect(text({ a: { b: 1 }, c: null })).toEqual(['a  {"b":1}', "c  null"]);
    expect(text([1, "x"])).toEqual(["1", "x"]);
    expect(summary({ ok: true, value: 3 })).toBe("3");
  });

  it("round-trips csv fields", () => {
    const fields = ['a "q"', "b,c", "d\ne", "plain"];
    expect(parseCsvLine(csvLine(fields.slice(0, 2)))).toEqual(fields.slice(0, 2));
    expect(csvLine(fields)).toBe('"a ""q""","b,c","d\ne",plain');
    expect(parseCsvLine('a"b,c')).toEqual(['a"b', "c"]);
  });
});
