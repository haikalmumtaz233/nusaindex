import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dataDir = "data";
export const manifestPath = join(dataDir, "manifest.json");

export interface DatasetEntry {
  source: string[];
  regulation: string;
  retrievedAt: string;
  sha256: string;
  rows: number;
}

export interface Manifest {
  dataVersion: string;
  datasets: Record<string, DatasetEntry>;
}

export const schemas: Readonly<Record<string, readonly string[]>> = {
  "regions.csv": ["code", "name"],
  "region_aliases.csv": ["old_code", "new_code", "since", "basis"],
  "plate_codes.csv": ["code", "region_code", "basis"],
  "area_codes.csv": ["code", "region_code", "place"],
  "holidays.csv": ["date", "kind", "name_id", "name_en", "basis"],
  "banks.csv": ["code", "sharia_unit", "bic", "office_code", "name", "short_name"],
};

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function readText(name: string): string {
  return readFileSync(join(dataDir, name), "utf8");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;
  let i = 0;
  while (i < text.length) {
    const c = text.charAt(i);
    if (quoted) {
      if (c === '"' && text.charAt(i + 1) === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
      i++;
      continue;
    }
    if (c === '"' && field === "") {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
    i++;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function readRows(name: string): string[][] {
  return parseCsv(readText(name)).slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEntry(name: string, value: unknown): DatasetEntry {
  if (!isRecord(value)) {
    throw new Error(`manifest: ${name} is not an object`);
  }
  const { source, regulation, retrievedAt, sha256: hash, rows } = value;
  if (
    !Array.isArray(source) ||
    !source.every((s) => typeof s === "string") ||
    typeof regulation !== "string" ||
    typeof retrievedAt !== "string" ||
    typeof hash !== "string" ||
    typeof rows !== "number"
  ) {
    throw new Error(`manifest: ${name} has missing or invalid fields`);
  }
  return { source: source.map(String), regulation, retrievedAt, sha256: hash, rows };
}

export function readManifest(): Manifest {
  const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (
    !isRecord(parsed) ||
    typeof parsed["dataVersion"] !== "string" ||
    !isRecord(parsed["datasets"])
  ) {
    throw new Error("manifest: missing dataVersion or datasets");
  }
  const datasets: Record<string, DatasetEntry> = {};
  for (const [name, entry] of Object.entries(parsed["datasets"])) {
    datasets[name] = parseEntry(name, entry);
  }
  return { dataVersion: parsed["dataVersion"], datasets };
}
