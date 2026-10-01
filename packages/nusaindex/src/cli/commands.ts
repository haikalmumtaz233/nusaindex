import * as bank from "../bank/index.js";
import * as fake from "../fake/index.js";
import * as holiday from "../holiday/index.js";
import { failure, success, type Result } from "../internal/result.js";
import * as mask from "../mask/index.js";
import * as nik from "../nik/index.js";
import * as nip from "../nip/index.js";
import * as nisn from "../nisn/index.js";
import * as npwp from "../npwp/index.js";
import * as phone from "../phone/index.js";
import * as plate from "../plate/index.js";
import * as region from "../region/index.js";
import * as rupiah from "../rupiah/index.js";
import * as workday from "../workday/index.js";
import { batch, type Handler, type Mode } from "./batch.js";
import { EXIT_INVALID, EXIT_OK, type Io, usage } from "./io.js";
import { text } from "./render.js";

export interface Flags {
  readonly json: boolean;
  readonly stdin: boolean;
  readonly csv: boolean;
  readonly column: string | undefined;
  readonly decimals: boolean;
  readonly noSymbol: boolean;
  readonly level: string | undefined;
  readonly limit: string | undefined;
  readonly weekend: string | undefined;
  readonly leaveWorkday: boolean;
  readonly seed: string | undefined;
  readonly count: string | undefined;
  readonly region: string | undefined;
  readonly birthDate: string | undefined;
  readonly sex: string | undefined;
}

type Generator = (seed: number) => Result<string> | Promise<Result<string>>;

const MAX_FAKE = 1000;
const MAX_SEED = 0xffff_ffff;
const MAX_LIMIT = 100;
const LEVELS: readonly region.RegionLevel[] = ["province", "regency", "district", "village"];
const REGION_USAGE =
  "region needs get <code>, resolve <code>, children [code], search <query> or nik <nik>";
const BANK_USAGE = "bank needs a 3-digit code, a BIC or list";
const WORKDAY_USAGE = "workday needs is <date>, add <date> <days> or count <from> <to>";

const identifiers = new Map<string, Handler>([
  ["nik", nik.parse],
  ["npwp", npwp.parse],
  ["phone", phone.parse],
  ["plate", plate.parse],
  ["nip", nip.parse],
  ["nisn", nisn.parse],
]);

const masks = new Map<string, Handler>([
  ["nik", (s) => success(mask.nik(s))],
  ["npwp", (s) => success(mask.npwp(s))],
  ["phone", (s) => success(mask.phone(s))],
  ["nip", (s) => success(mask.nip(s))],
  ["nisn", (s) => success(mask.nisn(s))],
  ["account", (s) => success(mask.account(s))],
  ["text", mask.text],
]);

export function print(io: Io, flags: Flags, result: Result<unknown>): number {
  if (flags.json) {
    io.out(JSON.stringify(result));
  } else if (result.ok) {
    for (const line of text(result.value)) {
      io.out(line);
    }
  } else {
    io.err(`nusaindex: invalid: ${result.error.code}`);
  }
  return result.ok ? EXIT_OK : EXIT_INVALID;
}

async function values(
  io: Io,
  flags: Flags,
  rest: readonly string[],
  handle: Handler,
  mode: Mode,
): Promise<number> {
  if (flags.stdin || flags.csv) {
    if (rest.length > 0) {
      return usage(io, "give values on standard input or as an argument, not both");
    }
    return batch(io, { json: flags.json, csv: flags.csv, column: flags.column, mode }, handle);
  }
  const [value] = rest;
  if (value === undefined || rest.length > 1) {
    return usage(io, "expected exactly one value");
  }
  return print(io, flags, await handle(value));
}

export function identifier(
  io: Io,
  flags: Flags,
  kind: string,
  rest: readonly string[],
): Promise<number> | number {
  const handle = identifiers.get(kind);
  return handle === undefined
    ? usage(io, `unknown command '${kind}'`)
    : values(io, flags, rest, handle, "check");
}

export function masking(io: Io, flags: Flags, rest: readonly string[]): Promise<number> | number {
  const [kind = "", ...args] = rest;
  const handle = masks.get(kind);
  return handle === undefined
    ? usage(io, "mask needs one of nik, npwp, phone, nip, nisn, account, text")
    : values(io, flags, args, handle, "map");
}

function amount(s: string): Result<number> {
  return /^-?\d{1,16}(\.\d{1,12})?$/.test(s) ? success(Number(s)) : failure("format");
}

export function money(io: Io, flags: Flags, rest: readonly string[]): Promise<number> | number {
  const [op = "", ...args] = rest;
  const handlers = new Map<string, Handler>([
    [
      "format",
      (s) => {
        const a = amount(s);
        return a.ok
          ? rupiah.format(a.value, { decimals: flags.decimals, symbol: !flags.noSymbol })
          : a;
      },
    ],
    ["parse", rupiah.parse],
    [
      "terbilang",
      (s) => {
        const a = amount(s);
        return a.ok ? rupiah.terbilang(a.value) : a;
      },
    ],
  ]);
  const handle = handlers.get(op);
  return handle === undefined
    ? usage(io, "rupiah needs one of format, parse, terbilang")
    : values(io, flags, args, handle, "map");
}

function integer(s: string | undefined, min: number, max: number): number | undefined {
  if (s === undefined || !/^\d{1,10}$/.test(s)) {
    return undefined;
  }
  const n = Number(s);
  return n >= min && n <= max ? n : undefined;
}

async function searchRegions(io: Io, flags: Flags, query: string): Promise<number> {
  const level = LEVELS.find((l) => l === flags.level);
  if (flags.level !== undefined && level === undefined) {
    return usage(io, "--level must be province, regency, district or village");
  }
  const limit = integer(flags.limit, 1, MAX_LIMIT);
  if (flags.limit !== undefined && limit === undefined) {
    return usage(io, `--limit must be a number from 1 to ${String(MAX_LIMIT)}`);
  }
  const options: region.SearchOptions = {
    ...(level === undefined ? {} : { level }),
    ...(limit === undefined ? {} : { limit }),
  };
  return print(io, flags, await region.search(query, options));
}

async function resolveRegion(code: string): Promise<Result<unknown>> {
  const r = await region.resolve(code);
  if (!r.ok) {
    return r;
  }
  const moved = code.replace(/\D/g, "") !== r.value.code.replace(/\D/g, "");
  return success(moved ? { ...r.value, resolvedFrom: code } : r.value);
}

export function banks(io: Io, flags: Flags, rest: readonly string[]): number {
  const [query] = rest;
  if (query === undefined || rest.length !== 1) {
    return usage(io, BANK_USAGE);
  }
  if (query === "list") {
    return print(io, flags, success(bank.list()));
  }
  return print(io, flags, /^[0-9]/.test(query) ? bank.byCode(query) : bank.byBic(query));
}

export async function regions(io: Io, flags: Flags, rest: readonly string[]): Promise<number> {
  const [op = "", ...args] = rest;
  const [first = ""] = args;
  if (op === "search" && args.length > 0) {
    return searchRegions(io, flags, args.join(" "));
  }
  if (op === "children" && args.length <= 1) {
    return print(io, flags, await region.children(first));
  }
  if (op === "get" && args.length === 1) {
    return print(io, flags, await region.get(first));
  }
  if (op === "resolve" && args.length === 1) {
    return print(io, flags, await resolveRegion(first));
  }
  if (op === "nik" && args.length === 1) {
    return print(io, flags, await region.fromNik(first));
  }
  return usage(io, REGION_USAGE);
}

export function holidays(io: Io, flags: Flags, rest: readonly string[]): number {
  const [year] = rest;
  const y = integer(year, 1, 9999);
  if (y === undefined || rest.length !== 1) {
    return usage(io, "holiday needs a year");
  }
  return print(io, flags, holiday.inYear(y));
}

function weekendDays(spec: string | undefined): number[] | undefined {
  if (spec === undefined) {
    return undefined;
  }
  return spec === "none" ? [] : spec.split(",").map((d) => (/^\d$/.test(d) ? Number(d) : -1));
}

export function workdays(io: Io, flags: Flags, rest: readonly string[]): number {
  const [op = "", a = "", b = ""] = rest;
  const weekend = weekendDays(flags.weekend);
  const options: workday.WorkdayOptions = {
    collectiveLeaveIsWorkday: flags.leaveWorkday,
    ...(weekend === undefined ? {} : { weekend }),
  };
  if (op === "is" && rest.length === 2) {
    return print(io, flags, workday.isWorkday(a, options));
  }
  if (op === "add" && rest.length === 3) {
    const days = /^-?\d{1,6}$/.test(b) ? Number(b) : Number.NaN;
    return print(io, flags, workday.add(a, days, options));
  }
  if (op === "count" && rest.length === 3) {
    return print(io, flags, workday.count(a, b, options));
  }
  return usage(io, WORKDAY_USAGE);
}

function generators(flags: Flags, sex: fake.Sex | undefined): Map<string, Generator> {
  const person = {
    ...(flags.birthDate === undefined ? {} : { birthDate: flags.birthDate }),
    ...(sex === undefined ? {} : { sex }),
  };
  const place = flags.region === undefined ? {} : { region: flags.region };
  return new Map<string, Generator>([
    ["nik", (s) => fake.nik(s, { ...place, ...person })],
    ["npwp", fake.npwp],
    ["phone", fake.phone],
    ["nip", (s) => fake.nip(s, person)],
    ["nisn", fake.nisn],
    ["plate", (s) => fake.plate(s, place)],
  ]);
}

export async function fakes(io: Io, flags: Flags, rest: readonly string[]): Promise<number> {
  const [kind = ""] = rest;
  const sex = flags.sex === "male" || flags.sex === "female" ? flags.sex : undefined;
  if (flags.sex !== undefined && sex === undefined) {
    return usage(io, "--sex must be male or female");
  }
  const generate = generators(flags, sex).get(kind);
  if (generate === undefined || rest.length !== 1) {
    return usage(io, "fake needs one of nik, npwp, phone, nip, nisn, plate");
  }
  const seed = flags.seed === undefined ? io.randomSeed() : integer(flags.seed, 0, MAX_SEED);
  const count = flags.count === undefined ? 1 : integer(flags.count, 1, MAX_FAKE);
  if (seed === undefined || count === undefined) {
    return usage(
      io,
      `--seed must be 0 to ${String(MAX_SEED)} and --count 1 to ${String(MAX_FAKE)}`,
    );
  }
  for (let i = 0; i < count; i++) {
    const code = print(io, flags, await generate((seed + i) % (MAX_SEED + 1)));
    if (code !== EXIT_OK) {
      return code;
    }
  }
  return EXIT_OK;
}
