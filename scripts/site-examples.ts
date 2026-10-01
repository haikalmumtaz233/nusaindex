import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join("site", "src", "examples");
const update = process.argv.includes("--update");
const binDir = mkdtempSync(join(tmpdir(), "nusaindex-examples-"));

function normalized(out: string): string {
  return out.replace(/\r\n/g, "\n");
}

function runGo(name: string): string {
  const exe = join(binDir, process.platform === "win32" ? `${name}.exe` : name);
  return normalized(execFileSync(exe, { encoding: "utf8" }));
}

function runTs(name: string): string {
  const script = join(root, name, "main.ts");
  return normalized(execFileSync(process.execPath, [script], { encoding: "utf8" }));
}

const failures: string[] = [];
try {
  execFileSync("go", ["build", "-o", binDir + "/", `./${root.replaceAll("\\", "/")}/...`], {
    stdio: "inherit",
  });
  for (const name of readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) {
      continue;
    }
    const dir = join(root, name.name);
    const outputs: [string, string][] = [];
    if (existsSync(join(dir, "main.go"))) {
      outputs.push(["go", runGo(name.name)]);
    }
    if (existsSync(join(dir, "main.ts"))) {
      outputs.push(["ts", runTs(name.name)]);
    }
    const expectedPath = join(dir, "output.txt");
    const [first] = outputs;
    if (first === undefined) {
      failures.push(`${name.name}: no main.go or main.ts`);
      continue;
    }
    if (update && outputs.every(([, out]) => out === first[1])) {
      writeFileSync(expectedPath, first[1]);
    }
    const expected = existsSync(expectedPath) ? normalized(readFileSync(expectedPath, "utf8")) : "";
    for (const [lang, out] of outputs) {
      if (out !== expected) {
        failures.push(`${name.name} (${lang}):\n--- expected\n${expected}--- actual\n${out}`);
      }
    }
  }
} finally {
  rmSync(binDir, { recursive: true, force: true });
}

if (failures.length > 0) {
  process.stderr.write(`site examples differ from output.txt:\n${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("site examples: all outputs match\n");
