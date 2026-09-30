import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import * as prettier from "prettier";

const write = process.argv.includes("--write");
const ignorePath = [".gitignore", ".prettierignore"];

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split("\n")
  .filter((f) => f !== "");

const unformatted: string[] = [];
for (const file of files) {
  const info = await prettier.getFileInfo(file, { ignorePath });
  if (info.ignored || info.inferredParser === null) {
    continue;
  }
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const options = { ...(await prettier.resolveConfig(file)), filepath: file };
  if (await prettier.check(source, options)) {
    continue;
  }
  if (write) {
    writeFileSync(file, await prettier.format(source, options));
    process.stdout.write(`formatted ${file}\n`);
  } else {
    unformatted.push(file);
  }
}

if (unformatted.length > 0) {
  process.stderr.write(`not formatted:\n${unformatted.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write("format: ok\n");
