import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  dataDir,
  manifestPath,
  parseCsv,
  readManifest,
  readText,
  sha256,
  type Manifest,
} from "./data-lib.ts";

const allowedHosts = new Set([
  "raw.githubusercontent.com",
  "peraturan.bpk.go.id",
  "jdih.kemenkoinfra.go.id",
  "www.kemenkopmk.go.id",
  "kemenkopmk.go.id",
  "www.bca.co.id",
]);
const regionSource = "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql";
const regionRow = /\('(\d{2}(?:\.\d{2}(?:\.\d{2}(?:\.\d{4})?)?)?)','((?:[^']|'')*)'\)/g;
const nameOverrides: Readonly<Record<string, string>> = { "32.05.38": "Bl. Limbangan" };
const maxRedirects = 5;
const timeoutMs = 120_000;
const listed = 15;
const write = process.argv.includes("--write");

const report: string[] = [];
const say = (line: string): void => {
  report.push(line);
};

async function fetchBytes(url: string): Promise<Uint8Array> {
  let current = new URL(url);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (current.protocol !== "https:" || !allowedHosts.has(current.hostname)) {
      throw new Error(`host not in allowlist: ${current.hostname}`);
    }
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "Mozilla/5.0 (compatible; nusaindex-data-watch)" },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location !== null) {
      current = new URL(location, current);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${String(res.status)}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
  throw new Error("too many redirects");
}

function normalizeName(raw: string): string {
  return raw.replaceAll("''", "'").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
}

function regionsFromSql(sql: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [, code = "", name = ""] of sql.matchAll(regionRow)) {
    out.set(code, nameOverrides[code] ?? normalizeName(name));
  }
  return out;
}

function csvField(field: string): string {
  return /[",\n]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field;
}

function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  return [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n") + "\n";
}

function sample(items: readonly string[]): string {
  const shown = items.slice(0, listed).join("; ");
  return items.length > listed ? `${shown}; ...` : shown;
}

function bumpVersion(version: string, today: string): string {
  const month = today.slice(0, 7).replace("-", ".");
  const [year = "", mon = "", n = "0"] = version.split(".");
  return `${year}.${mon}` === month ? `${month}.${String(Number(n) + 1)}` : `${month}.1`;
}

async function watchRegions(manifest: Manifest, today: string): Promise<boolean> {
  const upstream = regionsFromSql(new TextDecoder().decode(await fetchBytes(regionSource)));
  const current = new Map(
    parseCsv(readText("regions.csv"))
      .slice(1)
      .map(([code = "", name = ""]) => [code, name]),
  );
  const aliases = new Set(
    parseCsv(readText("region_aliases.csv"))
      .slice(1)
      .map(([oldCode = ""]) => oldCode),
  );
  const added = [...upstream.keys()].filter((c) => !current.has(c));
  const removed = [...current.keys()].filter((c) => !upstream.has(c));
  const renamed = [...upstream].filter(([c, n]) => current.has(c) && current.get(c) !== n);
  const unaliased = removed.filter((c) => c.length <= 8 && !aliases.has(c));
  const nonAscii = [...upstream].filter(([, n]) => !/^[\x20-\x7e]+$/.test(n)).map(([c]) => c);
  say(`regions: ${String(upstream.size)} upstream, ${String(current.size)} in data/regions.csv`);
  say(`  added ${String(added.length)}: ${sample(added)}`);
  say(`  removed ${String(removed.length)}: ${sample(removed)}`);
  say(`  removed without alias ${String(unaliased.length)}: ${sample(unaliased)}`);
  say(`  renamed ${String(renamed.length)}: ${sample(renamed.map(([c, n]) => `${c} ${n}`))}`);
  say(`  names outside printable ASCII ${String(nonAscii.length)}: ${sample(nonAscii)}`);
  const changed = added.length + removed.length + renamed.length > 0;
  if (changed && write) {
    const rows = [...upstream].sort(([a], [b]) => (a < b ? -1 : 1)).map(([c, n]) => [c, n]);
    const text = toCsv(["code", "name"], rows);
    writeFileSync(join(dataDir, "regions.csv"), text);
    const entry = manifest.datasets["regions.csv"];
    if (entry) {
      entry.sha256 = sha256(text);
      entry.rows = rows.length;
      entry.retrievedAt = today;
    }
    say("  wrote data/regions.csv; review the diff and add aliases for removed codes");
  }
  return changed;
}

async function watchDocuments(manifest: Manifest): Promise<boolean> {
  let changed = false;
  for (const [name, entry] of Object.entries(manifest.datasets)) {
    const baseline = entry.sourceSha256 ?? {};
    for (const url of entry.source) {
      if (url === regionSource) {
        continue;
      }
      const known = baseline[url];
      if (known === undefined) {
        say(`${name}: manual check ${url}`);
        continue;
      }
      try {
        const hash = sha256Bytes(await fetchBytes(url));
        if (hash === known) {
          say(`${name}: unchanged ${url}`);
          continue;
        }
        changed = true;
        say(`${name}: CHANGED ${url}`);
        if (write) {
          baseline[url] = hash;
        }
      } catch (error) {
        say(`${name}: failed ${url} (${error instanceof Error ? error.message : String(error)})`);
      }
    }
  }
  return changed;
}

function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const manifest = readManifest();
const today = new Date().toISOString().slice(0, 10);
const regionsChanged = await watchRegions(manifest, today);
const documentsChanged = await watchDocuments(manifest);
if (write && (regionsChanged || documentsChanged)) {
  if (regionsChanged) {
    manifest.dataVersion = bumpVersion(manifest.dataVersion, today);
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  say(`manifest updated (${manifest.dataVersion})`);
}
say(
  regionsChanged || documentsChanged
    ? "changes found: create a data/<dataset>-<date> branch and review"
    : "no changes",
);
process.stdout.write(report.join("\n") + "\n");
