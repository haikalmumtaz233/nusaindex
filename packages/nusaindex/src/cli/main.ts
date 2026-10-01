#!/usr/bin/env node
import { randomInt } from "node:crypto";
import { stderr, stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { run } from "./run.js";

process.exitCode = await run(process.argv.slice(2), {
  out: (line) => stdout.write(`${line}\n`),
  err: (line) => stderr.write(`${line}\n`),
  lines: () => createInterface({ input: stdin, crlfDelay: Infinity }),
  randomSeed: () => randomInt(0, 2 ** 32),
});
