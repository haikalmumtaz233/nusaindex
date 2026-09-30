import { aliases as aliasText, index as indexText, shards } from "../generated/regions/index.js";
import { collect } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type RegionLevel = "province" | "regency" | "district" | "village";
export type RegionErrorCode = "length" | "charset" | "unknown" | "options";

export interface Region {
  readonly code: string;
  readonly name: string;
  readonly level: RegionLevel;
  readonly parentCode?: string;
}

export interface SearchOptions {
  readonly level?: RegionLevel;
  readonly within?: string;
  readonly limit?: number;
}

interface Entry {
  readonly code: string;
  readonly name: string;
  readonly folded: string;
}

const PROVINCE = 2;
const REGENCY = 5;
const DISTRICT = 8;
const VILLAGE = 13;
const SEPARATORS = ". ";
const MAX_QUERY = 256;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const NAME_PREFIXES = ["kabupaten administrasi ", "kota administrasi ", "kabupaten ", "kota "];
const LEVEL_SIZES: Readonly<Record<RegionLevel, number>> = {
  province: PROVINCE,
  regency: REGENCY,
  district: DISTRICT,
  village: VILLAGE,
};

function once<T>(build: () => T): () => T {
  let value: { readonly v: T } | undefined;
  return () => {
    value ??= { v: build() };
    return value.v;
  };
}

function lines(text: string): string[][] {
  return text === "" ? [] : text.split("\n").map((line) => line.split("|"));
}

function entry(code: string, name: string): Entry {
  return { code, name, folded: fold(name) };
}

const upper = once(() => lines(indexText).map(([code = "", name = ""]) => entry(code, name)));
const aliasMap = once(
  () => new Map(lines(aliasText).map(([oldCode = "", newCode = ""]) => [oldCode, newCode])),
);

function parseShard(province: string, text: string): Entry[] {
  const entries: Entry[] = [];
  let district = "";
  for (const [code = "", name = ""] of lines(text)) {
    if (code.includes(".")) {
      district = `${province}.${code}`;
      entries.push(entry(district, name));
    } else {
      entries.push(entry(`${district}.${code}`, name));
    }
  }
  return entries;
}

const shardCache = once(() => new Map<string, Promise<Entry[]>>());

function loadShard(province: string): Promise<Entry[]> {
  const cache = shardCache();
  let pending = cache.get(province);
  if (!pending) {
    const loader = shards[province];
    pending = loader ? loader().then((text) => parseShard(province, text)) : Promise.resolve([]);
    cache.set(province, pending);
  }
  return pending;
}

async function entriesFor(code: string): Promise<Entry[]> {
  return code.length <= REGENCY ? upper() : loadShard(code.slice(0, PROVINCE));
}

function merge(groups: readonly (readonly Entry[])[]): Entry[] {
  return groups.flat().sort((a, b) => compare(a.code, b.code));
}

const allEntries = once(async () => {
  const provinces = upper().filter((e) => e.code.length === PROVINCE);
  const loaded = await Promise.all(provinces.map((p) => loadShard(p.code)));
  return merge([upper(), ...loaded]);
});

function compare(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

function findIndex(entries: readonly Entry[], code: string): number {
  let lo = 0;
  let hi = entries.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((entries[mid]?.code ?? "") < code) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function find(entries: readonly Entry[], code: string): Entry | undefined {
  const entry = entries[findIndex(entries, code)];
  return entry?.code === code ? entry : undefined;
}

function levelOf(code: string): RegionLevel {
  switch (code.length) {
    case PROVINCE:
      return "province";
    case REGENCY:
      return "regency";
    case DISTRICT:
      return "district";
    default:
      return "village";
  }
}

function toRegion(entry: Entry): Region {
  const dot = entry.code.lastIndexOf(".");
  const base = { code: entry.code, name: entry.name, level: levelOf(entry.code) };
  return dot < 0 ? base : { ...base, parentCode: entry.code.slice(0, dot) };
}

function normalizeCode(s: string): Result<string, RegionErrorCode> {
  const collected = collect(s, SEPARATORS);
  if (collected.status !== "ok") {
    return failure(collected.status);
  }
  const d = collected.digits;
  switch (d.length) {
    case 2:
      return success(d);
    case 4:
      return success(`${d.slice(0, 2)}.${d.slice(2, 4)}`);
    case 6:
      return success(`${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4, 6)}`);
    case 10:
      return success(`${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4, 6)}.${d.slice(6, 10)}`);
    default:
      return failure("length");
  }
}

function descendants(entries: readonly Entry[], code: string): Entry[] {
  return entries.slice(findIndex(entries, `${code}.`), findIndex(entries, `${code}/`));
}

export async function get(code: string): Promise<Result<Region, RegionErrorCode>> {
  const c = normalizeCode(code);
  if (!c.ok) {
    return c;
  }
  const entry = find(await entriesFor(c.value), c.value);
  return entry ? success(toRegion(entry)) : failure("unknown");
}

export async function children(code = ""): Promise<Result<Region[], RegionErrorCode>> {
  if (code === "") {
    return success(
      upper()
        .filter((e) => e.code.length === PROVINCE)
        .map(toRegion),
    );
  }
  const c = normalizeCode(code);
  if (!c.ok) {
    return c;
  }
  if (!find(await entriesFor(c.value), c.value)) {
    return failure("unknown");
  }
  const size = childSize(c.value.length);
  const pool = size <= REGENCY ? upper() : await loadShard(c.value.slice(0, PROVINCE));
  return success(
    descendants(pool, c.value)
      .filter((e) => e.code.length === size)
      .map(toRegion),
  );
}

function childSize(size: number): number {
  switch (size) {
    case PROVINCE:
      return REGENCY;
    case REGENCY:
      return DISTRICT;
    case DISTRICT:
      return VILLAGE;
    default:
      return 0;
  }
}

export async function resolve(code: string): Promise<Result<Region, RegionErrorCode>> {
  const c = normalizeCode(code);
  if (!c.ok) {
    return c;
  }
  const current = find(await entriesFor(c.value), c.value);
  if (current) {
    return success(toRegion(current));
  }
  const alias = aliasMap().get(c.value);
  if (alias === undefined) {
    return failure("unknown");
  }
  return get(alias);
}

function fold(s: string): string {
  let out = "";
  let space = false;
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      c += 32;
    } else if (!((c >= 97 && c <= 122) || (c >= 48 && c <= 57))) {
      if (c !== 39) {
        space = out !== "";
      }
      continue;
    }
    if (space) {
      out += " ";
      space = false;
    }
    out += String.fromCharCode(c);
  }
  return out;
}

function score(name: string, q: string): number {
  const prefix = NAME_PREFIXES.find((p) => name.startsWith(p));
  const base = prefix === undefined ? name : name.slice(prefix.length);
  if (name === q || base === q) {
    return 0;
  }
  if (base.startsWith(q) || name.startsWith(q)) {
    return 1;
  }
  if (` ${name}`.includes(` ${q}`)) {
    return 2;
  }
  return name.includes(q) ? 3 : -1;
}

function searchQuery(query: string): Result<string, RegionErrorCode> {
  if (query.length > MAX_QUERY) {
    return failure("length");
  }
  for (let i = 0; i < query.length; i++) {
    const c = query.charCodeAt(i);
    if (c < 32 || c > 126) {
      return failure("charset");
    }
  }
  const q = fold(query);
  return q === "" ? failure("length") : success(q);
}

function isRegionLevel(level: string): level is RegionLevel {
  return Object.hasOwn(LEVEL_SIZES, level);
}

export async function search(
  query: string,
  options: SearchOptions = {},
): Promise<Result<Region[], RegionErrorCode>> {
  const q = searchQuery(query);
  if (!q.ok) {
    return q;
  }
  const limit = options.limit === undefined || options.limit === 0 ? DEFAULT_LIMIT : options.limit;
  const level = options.level ?? "";
  if (!Number.isInteger(limit) || limit < 0 || limit > MAX_LIMIT) {
    return failure("options");
  }
  if (level !== "" && !isRegionLevel(level)) {
    return failure("options");
  }
  const size = level === "" ? 0 : LEVEL_SIZES[level];
  let pool: readonly Entry[];
  if (options.within === undefined || options.within === "") {
    pool = size !== 0 && size <= REGENCY ? upper() : await allEntries();
  } else {
    const within = normalizeCode(options.within);
    if (!within.ok) {
      return within;
    }
    if (!find(await entriesFor(within.value), within.value)) {
      return failure("unknown");
    }
    const scope = within.value.slice(0, PROVINCE);
    pool = descendants(merge([upper(), await loadShard(scope)]), within.value);
  }
  const matches: { entry: Entry; score: number }[] = [];
  for (const entry of pool) {
    if (size !== 0 && entry.code.length !== size) {
      continue;
    }
    const s = score(entry.folded, q.value);
    if (s >= 0) {
      matches.push({ entry, score: s });
    }
  }
  matches.sort(
    (a, b) =>
      a.score - b.score ||
      a.entry.code.length - b.entry.code.length ||
      compare(a.entry.code, b.entry.code),
  );
  return success(matches.slice(0, limit).map((m) => toRegion(m.entry)));
}
