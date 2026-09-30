import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

interface Manifest {
  version: string;
}

function readManifest(path: string): Manifest {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    throw new Error(`${path}: missing version`);
  }
  return { version: parsed.version };
}

function packageManifests(): string[] {
  return readdirSync("packages", { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join("packages", d.name, "package.json"));
}

const mode = process.argv[2];
if (mode !== "sync" && mode !== "check") {
  process.stderr.write("usage: version.ts sync|check\n");
  process.exit(2);
}
const rootVersion = readManifest("package.json").version;
const mismatched: string[] = [];

for (const path of packageManifests()) {
  const { version } = readManifest(path);
  if (version === rootVersion) {
    continue;
  }
  if (mode === "sync") {
    const text = readFileSync(path, "utf8");
    writeFileSync(path, text.replace(`"version": "${version}"`, `"version": "${rootVersion}"`));
    process.stdout.write(`${path}: ${version} -> ${rootVersion}\n`);
  } else {
    mismatched.push(`${path}: ${version} (root ${rootVersion})`);
  }
}

if (mismatched.length > 0) {
  process.stderr.write(`version mismatch:\n${mismatched.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`version: ${rootVersion}\n`);
