import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { dataDir, readRows } from "./data-lib.ts";

const outDir = join("packages", "nusaindex", "src", "generated");
const shardBudget = 60 * 1024;

function has(name: string): boolean {
  return existsSync(join(dataDir, name));
}

function table(rows: string[][]): string {
  for (const row of rows) {
    if (row.some((field) => field.includes("|") || field.includes("\n"))) {
      throw new Error(`field contains a reserved character: ${row.join(",")}`);
    }
  }
  return rows.map((row) => row.join("|")).join("\n");
}

function constant(name: string, value: string): string {
  return `export const ${name}: string = ${JSON.stringify(value)};\n`;
}

function write(path: string, text: string): void {
  writeFileSync(join(outDir, path), text);
}

function buildRegions(): void {
  const rows = readRows("regions.csv");
  mkdirSync(join(outDir, "regions"), { recursive: true });
  const upper = rows.filter(([code = ""]) => code.length <= 5);
  const provinces = upper.filter(([code = ""]) => code.length === 2).map(([code = ""]) => code);
  let index = constant("index", table(upper));
  index += constant("aliases", table(readRows("region_aliases.csv")));
  if (has("plate_codes.csv")) {
    index += constant(
      "plates",
      table(readRows("plate_codes.csv").map(([c = "", r = ""]) => [c, r])),
    );
  }
  if (has("area_codes.csv")) {
    index += constant("areas", table(readRows("area_codes.csv").map(([c = "", r = ""]) => [c, r])));
  }
  index += "export const shards: Readonly<Record<string, () => Promise<string>>> = {\n";
  for (const province of provinces) {
    const lower = rows
      .filter(([code = ""]) => code.length > 5 && code.startsWith(`${province}.`))
      .map(([code = "", name = ""]) => [code.length > 8 ? code.slice(9) : code.slice(3), name]);
    const text = constant("shard", table(lower));
    const size = gzipSync(text).length;
    if (size > shardBudget) {
      throw new Error(
        `region shard ${province} is ${String(size)} bytes gzip, budget ${String(shardBudget)}`,
      );
    }
    write(join("regions", `p${province}.ts`), text);
    index += `  "${province}": async () => (await import("./p${province}.js")).shard,\n`;
  }
  index += "};\n";
  write(join("regions", "index.ts"), index);
}

function buildPlates(): void {
  const codes = [...new Set(readRows("plate_codes.csv").map(([code = ""]) => code))];
  write("plate-codes.ts", constant("plateCodes", codes.join(" ")));
}

function buildHolidays(): void {
  const rows = readRows("holidays.csv").map(
    ([date = "", kind = "", nameId = "", nameEn = "", basis = ""]) => [
      date,
      kind === "national" ? "n" : "c",
      nameId,
      nameEn,
      basis,
    ],
  );
  write("holidays.ts", constant("holidays", table(rows)));
}

function buildBanks(): void {
  write("banks.ts", constant("banks", table(readRows("banks.csv"))));
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const built: string[] = [];
if (has("regions.csv")) {
  buildRegions();
  built.push("regions");
}
if (has("plate_codes.csv")) {
  buildPlates();
  built.push("plates");
}
if (has("holidays.csv")) {
  buildHolidays();
  built.push("holidays");
}
if (has("banks.csv")) {
  buildBanks();
  built.push("banks");
}
process.stdout.write(`data build: ${built.join(", ") || "nothing"}\n`);
