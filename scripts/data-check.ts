import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dataDir, parseCsv, readManifest, readText, schemas, sha256 } from "./data-lib.ts";

const errors: string[] = [];
const fail = (message: string): void => {
  errors.push(message);
};

const codePattern = /^\d{2}(?:\.\d{2}(?:\.\d{2}(?:\.\d{4})?)?)?$/;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const printable = /^[\x20-\x7e]*$/;

function isDate(s: string): boolean {
  const m = datePattern.exec(s);
  if (!m) {
    return false;
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === s;
}

function parentOf(code: string): string {
  return code.slice(0, code.lastIndexOf("."));
}

function checkSorted(name: string, keys: string[], strict: boolean): void {
  for (let i = 1; i < keys.length; i++) {
    const prev = keys[i - 1] ?? "";
    const cur = keys[i] ?? "";
    if (prev > cur || (strict && prev === cur)) {
      fail(`${name}: row ${String(i + 1)} out of order or duplicated (${cur})`);
      return;
    }
  }
}

function checkText(name: string, text: string): void {
  if (text.startsWith("﻿")) {
    fail(`${name}: has a byte order mark`);
  }
  if (text.includes("\r")) {
    fail(`${name}: has CR line endings`);
  }
  if (!text.endsWith("\n") || text.endsWith("\n\n")) {
    fail(`${name}: must end with exactly one newline`);
  }
  if (text.includes("\n\n")) {
    fail(`${name}: has blank lines`);
  }
  if (!printable.test(text.replace(/\n/g, ""))) {
    fail(`${name}: has characters outside printable ASCII`);
  }
}

function checkFields(name: string, rows: string[][], width: number): void {
  rows.forEach((row, i) => {
    if (row.length !== width) {
      fail(`${name}: row ${String(i + 2)} has ${String(row.length)} fields, want ${String(width)}`);
    }
    for (const field of row) {
      if (field === "" || field !== field.trim() || field.includes("  ")) {
        fail(`${name}: row ${String(i + 2)} has an empty or untrimmed field`);
        return;
      }
    }
  });
}

const rowsOf = new Map<string, string[][]>();

function checkRegions(rows: string[][]): void {
  const codes = new Set<string>();
  for (const [code = ""] of rows) {
    if (!codePattern.test(code)) {
      fail(`regions.csv: invalid code ${code}`);
    }
    if (code.length > 2 && !codes.has(parentOf(code))) {
      fail(`regions.csv: ${code} has no parent`);
    }
    codes.add(code);
  }
  checkSorted("regions.csv", [...codes], true);
}

function regionCodes(): Set<string> {
  return new Set((rowsOf.get("regions.csv") ?? []).map((r) => r[0] ?? ""));
}

function checkAliases(rows: string[][]): void {
  const current = regionCodes();
  for (const [oldCode = "", newCode = "", since = ""] of rows) {
    if (!codePattern.test(oldCode) || current.has(oldCode)) {
      fail(`region_aliases.csv: ${oldCode} is invalid or still a current code`);
    }
    if (!current.has(newCode) || newCode.length !== oldCode.length) {
      fail(`region_aliases.csv: ${oldCode} maps to unknown or different-level ${newCode}`);
    }
    if (!isDate(since)) {
      fail(`region_aliases.csv: ${oldCode} has invalid since ${since}`);
    }
  }
  checkSorted(
    "region_aliases.csv",
    rows.map((r) => r[0] ?? ""),
    true,
  );
}

function checkPlates(rows: string[][]): void {
  const current = regionCodes();
  const covered = new Map<string, string>();
  for (const [code = "", regionCode = ""] of rows) {
    if (!/^[A-Z]{1,2}$/.test(code)) {
      fail(`plate_codes.csv: invalid code ${code}`);
    }
    if (regionCode.length !== 5 || !current.has(regionCode)) {
      fail(`plate_codes.csv: ${code} maps to unknown regency ${regionCode}`);
    }
    if (covered.has(regionCode)) {
      fail(`plate_codes.csv: ${regionCode} has more than one plate code`);
    }
    covered.set(regionCode, code);
  }
  for (const code of current) {
    if (code.length === 5 && !covered.has(code)) {
      fail(`plate_codes.csv: regency ${code} has no plate code`);
    }
  }
  checkSorted(
    "plate_codes.csv",
    rows.map((r) => `${r[0] ?? ""} ${r[1] ?? ""}`),
    true,
  );
}

function checkAreas(rows: string[][]): void {
  const current = regionCodes();
  for (const [code = "", regionCode = ""] of rows) {
    if (!/^0\d{2,3}$/.test(code)) {
      fail(`area_codes.csv: invalid code ${code}`);
    }
    if (regionCode.length > 5 || !current.has(regionCode)) {
      fail(`area_codes.csv: ${code} maps to unknown province or regency ${regionCode}`);
    }
  }
  checkSorted(
    "area_codes.csv",
    rows.map((r) => `${r[0] ?? ""} ${r[1] ?? ""}`),
    true,
  );
}

function checkHolidays(rows: string[][]): void {
  const years = new Set<number>();
  for (const [date = "", kind = ""] of rows) {
    if (!isDate(date)) {
      fail(`holidays.csv: invalid date ${date}`);
    }
    if (kind !== "national" && kind !== "collective_leave") {
      fail(`holidays.csv: ${date} has invalid kind ${kind}`);
    }
    years.add(Number(date.slice(0, 4)));
  }
  const sorted = [...years].sort((a, b) => a - b);
  const first = sorted[0] ?? 0;
  sorted.forEach((year, i) => {
    if (year !== first + i) {
      fail(`holidays.csv: coverage has a gap before ${String(year)}`);
    }
  });
  checkSorted(
    "holidays.csv",
    rows.map((r) => r[0] ?? ""),
    false,
  );
  const keys = rows.map((r) => `${r[0] ?? ""} ${r[1] ?? ""} ${r[2] ?? ""}`);
  if (new Set(keys).size !== keys.length) {
    fail("holidays.csv: duplicated date, kind and name");
  }
}

function checkBanks(rows: string[][]): void {
  const bics = new Set<string>();
  for (const [code = "", unit = "", bic = "", office = ""] of rows) {
    if (!/^\d{3}$/.test(code) || !/^[01]$/.test(unit) || !/^\d{4}$/.test(office)) {
      fail(`banks.csv: invalid code, sharia_unit or office_code for ${bic}`);
    }
    if (!/^[A-Z0-9]{8}$/.test(bic) || bics.has(bic)) {
      fail(`banks.csv: invalid or duplicated bic ${bic}`);
    }
    bics.add(bic);
  }
  checkSorted(
    "banks.csv",
    rows.map((r) => `${r[0] ?? ""} ${r[1] ?? ""} ${r[2] ?? ""}`),
    true,
  );
}

const checks: Readonly<Record<string, (rows: string[][]) => void>> = {
  "regions.csv": checkRegions,
  "region_aliases.csv": checkAliases,
  "plate_codes.csv": checkPlates,
  "area_codes.csv": checkAreas,
  "holidays.csv": checkHolidays,
  "banks.csv": checkBanks,
};

const manifest = readManifest();
if (!/^\d{4}\.\d{2}\.\d+$/.test(manifest.dataVersion)) {
  fail(`manifest: dataVersion ${manifest.dataVersion} is not YYYY.MM.N`);
}
const files = readdirSync(dataDir).filter((f) => f.endsWith(".csv"));
for (const name of Object.keys(manifest.datasets)) {
  if (!files.includes(name)) {
    fail(`manifest: ${name} has no file`);
  }
}
const ordered = Object.keys(checks).filter((name) => files.includes(name));
for (const name of files) {
  if (!(name in checks)) {
    fail(`${name}: unknown dataset`);
  }
}
for (const name of ordered) {
  const entry = manifest.datasets[name];
  const text = readText(name);
  checkText(name, text);
  const [header = [], ...rows] = parseCsv(text);
  const schema = schemas[name] ?? [];
  if (header.join(",") !== schema.join(",")) {
    fail(`${name}: header ${header.join(",")} does not match ${schema.join(",")}`);
  }
  checkFields(name, rows, schema.length);
  rowsOf.set(name, rows);
  if (!entry) {
    fail(`manifest: ${name} is missing`);
    continue;
  }
  if (entry.sha256 !== sha256(text)) {
    fail(`manifest: ${name} sha256 does not match`);
  }
  if (entry.rows !== rows.length) {
    fail(`manifest: ${name} rows ${String(entry.rows)}, file has ${String(rows.length)}`);
  }
  if (!isDate(entry.retrievedAt) || entry.source.length === 0 || entry.regulation === "") {
    fail(`manifest: ${name} needs source, regulation and retrievedAt`);
  }
  for (const [url, hash] of Object.entries(entry.sourceSha256 ?? {})) {
    if (!entry.source.includes(url) || !/^[0-9a-f]{64}$/.test(hash)) {
      fail(`manifest: ${name} has a sourceSha256 for an unlisted source or a bad hash`);
    }
  }
  checks[name]?.(rows);
}

const notices = ["NOTICE", "packages/nusaindex/NOTICE"];
if (ordered.length > 0) {
  const texts = notices.map((p) => (existsSync(p) ? readFileSync(p, "utf8") : ""));
  if (texts.some((t) => t === "") || texts[0] !== texts[1]) {
    fail("NOTICE: root and packages/nusaindex copies must exist and match");
  }
}

if (errors.length > 0) {
  process.stderr.write(`data check failed:\n${errors.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`data: ${String(ordered.length)} datasets ok (${manifest.dataVersion})\n`);
