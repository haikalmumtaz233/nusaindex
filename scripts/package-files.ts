import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const rawBase = "https://raw.githubusercontent.com/haikalmumtaz233/nusaindex/main/";

const shared: Readonly<Record<string, readonly string[]>> = {
  nusaindex: ["LICENSE", "NOTICE", "README.md"],
  "nusaindex-mcp": ["LICENSE"],
};

const manifest: unknown = JSON.parse(readFileSync("package.json", "utf8"));
const name: unknown = Reflect.get(Object(manifest), "name");
const files = typeof name === "string" && Object.hasOwn(shared, name) ? shared[name] : undefined;
if (files === undefined) {
  process.stderr.write("package-files: run from packages/nusaindex or packages/mcp\n");
  process.exit(1);
}
for (const file of files) {
  if (file === "README.md") {
    const readme = readFileSync(join(root, file), "utf8");
    writeFileSync(file, readme.replaceAll("](site/public/", `](${rawBase}site/public/`));
  } else {
    copyFileSync(join(root, file), file);
  }
}
process.stdout.write(`package-files: ${String(name)} <- ${files.join(", ")}\n`);
