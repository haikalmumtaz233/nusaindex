import { parseArgs } from "node:util";
import pkg from "../../package.json" with { type: "json" };
import {
  type Flags,
  banks,
  fakes,
  holidays,
  identifier,
  masking,
  money,
  regions,
  workdays,
} from "./commands.js";
import { HELP } from "./help.js";
import { EXIT_OK, type Io, usage } from "./io.js";

const OPTIONS = {
  json: { type: "boolean" },
  stdin: { type: "boolean" },
  csv: { type: "boolean" },
  column: { type: "string" },
  decimals: { type: "boolean" },
  "no-symbol": { type: "boolean" },
  level: { type: "string" },
  limit: { type: "string" },
  weekend: { type: "string" },
  "leave-workday": { type: "boolean" },
  seed: { type: "string" },
  count: { type: "string" },
  region: { type: "string" },
  "birth-date": { type: "string" },
  sex: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

type Option = keyof typeof OPTIONS;

const BATCH: readonly Option[] = ["json", "stdin", "csv", "column"];

const ALLOWED: Readonly<Record<string, readonly Option[]>> = {
  mask: BATCH,
  rupiah: [...BATCH, "decimals", "no-symbol"],
  region: ["json", "level", "limit"],
  holiday: ["json"],
  bank: ["json"],
  workday: ["json", "weekend", "leave-workday"],
  fake: ["json", "seed", "count", "region", "birth-date", "sex"],
};

type Command = (io: Io, flags: Flags, rest: readonly string[]) => Promise<number> | number;

const COMMANDS: Readonly<Record<string, Command>> = {
  mask: masking,
  rupiah: money,
  region: regions,
  holiday: holidays,
  bank: banks,
  workday: workdays,
  fake: fakes,
};

function parse(
  args: readonly string[],
): ReturnType<typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>> | string {
  try {
    return parseArgs({ args: [...args], options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    return error instanceof Error ? error.message : "invalid arguments";
  }
}

export async function run(args: readonly string[], io: Io): Promise<number> {
  const parsed = parse(args);
  if (typeof parsed === "string") {
    return usage(io, parsed);
  }
  const { values: v, positionals } = parsed;
  if (v.version === true) {
    io.out(pkg.version);
    return EXIT_OK;
  }
  const [name, ...rest] = positionals;
  if (v.help === true) {
    io.out(HELP);
    return EXIT_OK;
  }
  if (name === undefined) {
    return usage(io, "missing command");
  }
  const allowed = (Object.hasOwn(ALLOWED, name) ? ALLOWED[name] : undefined) ?? BATCH;
  const extra = Object.entries(v).find(([key]) => !allowed.some((a) => a === key));
  if (extra !== undefined) {
    return usage(io, `--${extra[0]} is not supported by '${name}'`);
  }
  const flags: Flags = {
    json: v.json === true,
    stdin: v.stdin === true,
    csv: v.csv === true,
    column: v.column,
    decimals: v.decimals === true,
    noSymbol: v["no-symbol"] === true,
    level: v.level,
    limit: v.limit,
    weekend: v.weekend,
    leaveWorkday: v["leave-workday"] === true,
    seed: v.seed,
    count: v.count,
    region: v.region,
    birthDate: v["birth-date"],
    sex: v.sex,
  };
  const command = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : undefined;
  return command === undefined ? identifier(io, flags, name, rest) : command(io, flags, rest);
}
