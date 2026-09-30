import { spawnSync } from "node:child_process";

const minimum = 95;
const run = spawnSync("go", ["test", "-cover", "./..."], { encoding: "utf8" });
process.stdout.write(run.stdout);
process.stderr.write(run.stderr);
if (run.status !== 0) {
  process.exit(run.status ?? 1);
}

const failures: string[] = [];
for (const line of run.stdout.split("\n")) {
  const match = /^ok\s+(\S+)\s.*coverage: ([\d.]+)% of statements/.exec(line);
  if (!match) {
    continue;
  }
  const [, pkg = "", percent = "0"] = match;
  if (pkg.includes("/internal/")) {
    continue;
  }
  if (Number(percent) < minimum) {
    failures.push(`${pkg}: ${percent}% < ${String(minimum)}%`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`go coverage below budget:\n${failures.join("\n")}\n`);
  process.exit(1);
}
