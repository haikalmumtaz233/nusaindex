import { spawnSync } from "node:child_process";

const fuzzTime = process.env["FUZZ_TIME"] ?? "10s";

const list = spawnSync("go", ["test", "-list", "^Fuzz", "./..."], { encoding: "utf8" });
if (list.status !== 0) {
  process.stderr.write(list.stderr);
  process.exit(list.status ?? 1);
}

const targets: { pkg: string; name: string }[] = [];
let pending: string[] = [];
for (const line of list.stdout.split("\n")) {
  if (line.startsWith("Fuzz")) {
    pending.push(line.trim());
    continue;
  }
  const match = /^ok\s+(\S+)/.exec(line);
  if (match?.[1] !== undefined) {
    for (const name of pending) {
      targets.push({ pkg: match[1], name });
    }
    pending = [];
  }
}

for (const { pkg, name } of targets) {
  process.stdout.write(`fuzz ${pkg} ${name} (${fuzzTime})\n`);
  const run = spawnSync(
    "go",
    ["test", "-run", "^$", "-fuzz", `^${name}$`, "-fuzztime", fuzzTime, pkg],
    { stdio: "inherit" },
  );
  if (run.status !== 0) {
    process.exit(run.status ?? 1);
  }
}
