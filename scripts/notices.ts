import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const bundle = "dist/main.js";
const output = "THIRD_PARTY_NOTICES.md";
const allowedLicenses = new Set([
  "MIT",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "Apache-2.0",
  "0BSD",
]);
const licenseFiles = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "LICENCE"];

interface Notice {
  name: string;
  version: string;
  license: string;
  text: string;
}

function bundledPackages(source: string): string[] {
  const names = new Set<string>();
  for (const match of source.matchAll(/^\/\/#region (\S+)$/gm)) {
    const path = match[1] ?? "";
    const parts = path.split("node_modules/");
    const tail = parts.at(-1);
    if (parts.length < 2 || tail === undefined) {
      continue;
    }
    const segments = tail.split("/");
    const name = tail.startsWith("@") ? segments.slice(0, 2).join("/") : (segments[0] ?? "");
    names.add(name);
  }
  return [...names].sort();
}

function readNotice(name: string): Notice {
  const dir = join("node_modules", name);
  const manifest: unknown = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const version: unknown = Reflect.get(Object(manifest), "version");
  const license: unknown = Reflect.get(Object(manifest), "license");
  if (typeof version !== "string" || typeof license !== "string") {
    throw new Error(`${name}: missing version or license`);
  }
  if (!allowedLicenses.has(license)) {
    throw new Error(`${name}: license ${license} is not allowed in the bundle`);
  }
  const file = licenseFiles.map((f) => join(dir, f)).find((f) => existsSync(f));
  if (file === undefined) {
    throw new Error(`${name}: no license file`);
  }
  return { name, version, license, text: readFileSync(file, "utf8").trim() };
}

const names = bundledPackages(readFileSync(bundle, "utf8"));
const notices = names.map(readNotice);
const body = notices
  .map((n) => `## ${n.name} ${n.version} (${n.license})\n\n\`\`\`text\n${n.text}\n\`\`\``)
  .join("\n\n");
writeFileSync(
  output,
  `# Third-party notices\n\n\`${bundle}\` bundles the following packages.\n\n${body}\n`,
);
process.stdout.write(`notices: ${names.join(", ")}\n`);
