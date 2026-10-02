import { readFileSync } from "node:fs";
import { distTag, releaseNotes, tagVersion } from "./release-lib.ts";

function fail(message: string): never {
  process.stderr.write(`release-notes: ${message}\n`);
  process.exit(1);
}

function packageVersion(): string {
  const parsed: unknown = JSON.parse(readFileSync("package.json", "utf8"));
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("version" in parsed) ||
    typeof parsed.version !== "string"
  ) {
    fail("package.json: missing version");
  }
  return parsed.version;
}

const [mode, tag = ""] = process.argv.slice(2);
if (mode !== "notes" && mode !== "dist-tag") {
  process.stderr.write("usage: release-notes.ts notes|dist-tag <vX.Y.Z>\n");
  process.exit(2);
}
const version = tagVersion(tag) ?? fail(`not a release tag: ${tag}`);
if (version !== packageVersion()) {
  fail(`tag ${tag} does not match package.json ${packageVersion()}`);
}
if (mode === "dist-tag") {
  process.stdout.write(`${distTag(version)}\n`);
} else {
  const notes =
    releaseNotes(readFileSync("CHANGELOG.md", "utf8"), version) ??
    fail(`CHANGELOG.md has no notes for ${version}`);
  process.stdout.write(`${notes}\n`);
}
