import { execFileSync, spawn, spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

interface Check {
  name: string;
  value: number;
  limit: number;
  unit: string;
}

const runs = 7;
const probe = process.platform === "win32" ? ".cache/goprobe.exe" : ".cache/goprobe";
const checks: Check[] = [];

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

function goBenchmark(): void {
  const out = execFileSync(
    "go",
    ["test", "-run", "^$", "-bench", "^BenchmarkValid$", "-benchmem", "-count", "3", "./nik"],
    { encoding: "utf8" },
  );
  const results = [
    ...out.matchAll(/BenchmarkValid\S*\s+\d+\s+([\d.]+) ns\/op\s+\d+ B\/op\s+(\d+) allocs\/op/g),
  ];
  checks.push({
    name: "Go nik.Valid",
    value: median(results.map((m) => Number(m[1]))),
    limit: 200,
    unit: "ns/op",
  });
  checks.push({
    name: "Go nik.Valid allocations",
    value: Math.max(...results.map((m) => Number(m[2]))),
    limit: 0,
    unit: "allocs/op",
  });
}

function goRegionLoad(): void {
  execFileSync("go", ["build", "-o", probe, "./scripts/goprobe"]);
  const samples = Array.from({ length: runs }, () => {
    const out = execFileSync(probe, { encoding: "utf8" });
    const parsed: unknown = JSON.parse(out);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("regionLoadMs" in parsed) ||
      !("regionHeapMiB" in parsed) ||
      typeof parsed.regionLoadMs !== "number" ||
      typeof parsed.regionHeapMiB !== "number"
    ) {
      throw new Error("goprobe: unexpected output");
    }
    return { ms: parsed.regionLoadMs, heap: parsed.regionHeapMiB };
  });
  checks.push({
    name: "Go region first load",
    value: median(samples.map((s) => s.ms)),
    limit: 50,
    unit: "ms",
  });
  checks.push({
    name: "Go region heap",
    value: Math.max(...samples.map((s) => s.heap)),
    limit: 30,
    unit: "MiB",
  });
}

function cliColdStart(): void {
  const samples = Array.from({ length: runs }, () => {
    const start = performance.now();
    const run = spawnSync(process.execPath, [
      "packages/nusaindex/dist/cli.js",
      "nisn",
      "6299763315",
    ]);
    if (run.status !== 0) {
      throw new Error("cli: unexpected exit code");
    }
    return performance.now() - start;
  });
  checks.push({ name: "CLI cold start", value: median(samples), limit: 300, unit: "ms" });
}

function mcpReady(): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const child = spawn(process.execPath, ["packages/mcp/dist/main.js"], {
      stdio: ["pipe", "pipe", "ignore"],
    });
    child.stdout.once("data", () => {
      resolve(performance.now() - start);
      child.kill();
    });
    child.once("error", reject);
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "budget", version: "0" },
        },
      }) + "\n",
    );
  });
}

async function mcpColdStart(): Promise<void> {
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    samples.push(await mcpReady());
  }
  checks.push({ name: "MCP cold start", value: median(samples), limit: 300, unit: "ms" });
}

function unpackedSize(): void {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: "packages/nusaindex",
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const parsed: unknown = JSON.parse(out);
  const first: unknown = Array.isArray(parsed) ? parsed[0] : undefined;
  if (
    typeof first !== "object" ||
    first === null ||
    !("unpackedSize" in first) ||
    typeof first.unpackedSize !== "number"
  ) {
    throw new Error("npm pack: unexpected output");
  }
  checks.push({
    name: "nusaindex unpacked size",
    value: first.unpackedSize / 1_000_000,
    limit: 8,
    unit: "MB",
  });
}

goBenchmark();
goRegionLoad();
cliColdStart();
await mcpColdStart();
unpackedSize();

let failed = false;
for (const c of checks) {
  const ok = c.value <= c.limit;
  failed ||= !ok;
  process.stdout.write(
    `${ok ? "ok  " : "FAIL"} ${c.name.padEnd(28)} ${c.value.toFixed(2).padStart(9)} ${c.unit} (limit ${String(c.limit)})\n`,
  );
}
process.exit(failed ? 1 : 0);
