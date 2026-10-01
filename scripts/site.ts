import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const commands = new Set(["dev", "build", "preview"]);
const command = process.argv[2] ?? "";
if (!commands.has(command)) {
  process.stderr.write("usage: site.ts dev|build|preview\n");
  process.exit(2);
}

const siteDir = fileURLToPath(new URL("../site/", import.meta.url));
const run = spawnSync("astro", [command, ...process.argv.slice(3)], {
  cwd: siteDir,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
    ASTRO_DISABLE_UPDATE_CHECK: "true",
  },
});
if (run.status !== 0 || command !== "build") {
  process.exit(run.status ?? 1);
}
const csp = spawnSync(process.execPath, ["scripts/site-csp.ts"], {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  stdio: "inherit",
});
process.exit(csp.status ?? 1);
