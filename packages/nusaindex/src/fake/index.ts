import { plateCodes } from "../generated/plate-codes.js";
import { parseIsoDate } from "../internal/dates.js";
import { failure, success, type Result } from "../internal/result.js";
import { children, get } from "../region/index.js";
import { Source, Stream } from "./source.js";

export type FakeErrorCode = "options" | "date" | "region";

export type Sex = "male" | "female";

export interface NikOptions {
  readonly region?: string;
  readonly birthDate?: string;
  readonly sex?: Sex;
}

export interface NipOptions {
  readonly birthDate?: string;
  readonly sex?: Sex;
}

export interface PlateOptions {
  readonly region?: string;
}

interface Range {
  readonly from: number;
  readonly to: number;
}

const DAY_MS = 86_400_000;
const MAX_SEED = 0xffff_ffff;
const DISTRICT = 8;
const FEMALE_DAY_OFFSET = 40;
const ADULT_AGE = 18;
const SERVICE_YEARS = 17;
const MIN_YEAR = 1900;
const MAX_YEAR = 2099;
const SEXES: readonly string[] = ["male", "female"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NIK_BIRTH: Range = { from: Date.UTC(1950, 0, 1), to: Date.UTC(2005, 11, 31) };
const NIP_BIRTH: Range = { from: Date.UTC(1960, 0, 1), to: Date.UTC(2000, 11, 31) };
const PREFIX_SIZE = 3;
const MOBILE_PREFIXES =
  "811812813814815816817818819821822823831832833838851852853855856857858859" +
  "877878881882883884885886887888889895896897898899";
const PLATE_CODES = plateCodes.split(" ");

export async function nik(
  seed: number,
  options: NikOptions = {},
): Promise<Result<string, FakeErrorCode>> {
  if (!validSeed(seed) || !validSex(options.sex)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Nik);
  const district = await pickDistrict(src, options.region ?? "");
  if (!district.ok) {
    return district;
  }
  const birth = birthDate(src, options.birthDate ?? "", NIK_BIRTH);
  if (birth === undefined) {
    return failure("date");
  }
  const day = birth.getUTCDate() + (pickSex(src, options.sex) === "female" ? FEMALE_DAY_OFFSET : 0);
  const serial = 1 + src.int(9999);
  const d = district.value;
  return success(
    d.slice(0, 2) +
      d.slice(3, 5) +
      d.slice(6, 8) +
      pad(day, 2) +
      pad(birth.getUTCMonth() + 1, 2) +
      pad(birth.getUTCFullYear() % 100, 2) +
      pad(serial, 4),
  );
}

export function npwp(seed: number): Result<string, FakeErrorCode> {
  if (!validSeed(seed)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Npwp);
  const kind = 1 + src.int(99);
  const serial = src.digits(7);
  const office = 1 + src.int(999);
  return success(`0${pad(kind, 2)}${serial}${pad(office, 3)}000`);
}

export function phone(seed: number): Result<string, FakeErrorCode> {
  if (!validSeed(seed)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Phone);
  const start = src.int(MOBILE_PREFIXES.length / PREFIX_SIZE) * PREFIX_SIZE;
  const prefix = MOBILE_PREFIXES.slice(start, start + PREFIX_SIZE);
  const size = 10 + src.int(3);
  return success(`+62${prefix}${src.digits(size - prefix.length)}`);
}

export function nip(seed: number, options: NipOptions = {}): Result<string, FakeErrorCode> {
  if (!validSeed(seed) || !validSex(options.sex)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Nip);
  const birth = birthDate(src, options.birthDate ?? "", NIP_BIRTH);
  if (birth === undefined) {
    return failure("date");
  }
  const sex = pickSex(src, options.sex) === "female" ? "2" : "1";
  const year = birth.getUTCFullYear();
  const appointed = year + ADULT_AGE + src.int(SERVICE_YEARS);
  const month = 1 + src.int(12);
  const serial = 1 + src.int(999);
  return success(
    pad(year, 4) +
      pad(birth.getUTCMonth() + 1, 2) +
      pad(birth.getUTCDate(), 2) +
      pad(appointed, 4) +
      pad(month, 2) +
      sex +
      pad(serial, 3),
  );
}

export function nisn(seed: number): Result<string, FakeErrorCode> {
  if (!validSeed(seed)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Nisn);
  const head = src.digits(9);
  return success(head + String(1 + src.int(9)));
}

export function plate(seed: number, options: PlateOptions = {}): Result<string, FakeErrorCode> {
  if (!validSeed(seed)) {
    return failure("options");
  }
  const src = new Source(seed, Stream.Plate);
  let code = options.region ?? "";
  if (code === "") {
    code = PLATE_CODES[src.int(PLATE_CODES.length)] ?? code;
  } else if (!PLATE_CODES.includes(code)) {
    return failure("region");
  }
  const out = `${code} ${String(1 + src.int(9999))}`;
  const size = src.int(4);
  if (size === 0) {
    return success(out);
  }
  let suffix = "";
  for (let i = 0; i < size; i++) {
    suffix += src.pick(LETTERS);
  }
  return success(`${out} ${suffix}`);
}

async function pickDistrict(src: Source, start: string): Promise<Result<string, FakeErrorCode>> {
  let code = start;
  if (code !== "") {
    const found = await get(code);
    if (!found.ok) {
      return failure("region");
    }
    if (found.value.level === "village") {
      return failure("options");
    }
    code = found.value.code;
  }
  while (code.length < DISTRICT) {
    const list = await children(code);
    const next = list.ok ? list.value[src.int(list.value.length)] : undefined;
    if (next === undefined) {
      return failure("region");
    }
    code = next.code;
  }
  return success(code);
}

function birthDate(src: Source, given: string, range: Range): Date | undefined {
  if (given === "") {
    const days = (range.to - range.from) / DAY_MS + 1;
    return new Date(range.from + src.int(days) * DAY_MS);
  }
  const d = parseIsoDate(given);
  if (d === undefined || d.year < MIN_YEAR || d.year > MAX_YEAR) {
    return undefined;
  }
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

function validSeed(seed: number): boolean {
  return Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED;
}

function validSex(sex: string | undefined): boolean {
  return sex === undefined || SEXES.includes(sex);
}

function pickSex(src: Source, sex: Sex | undefined): Sex {
  if (sex !== undefined) {
    return sex;
  }
  return src.int(2) === 0 ? "male" : "female";
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}
