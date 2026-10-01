import * as fake from "nusaindex/fake";
import * as holiday from "nusaindex/holiday";
import * as nik from "nusaindex/nik";
import * as nip from "nusaindex/nip";
import * as nisn from "nusaindex/nisn";
import * as npwp from "nusaindex/npwp";
import * as phone from "nusaindex/phone";
import * as plate from "nusaindex/plate";
import * as region from "nusaindex/region";
import * as rupiah from "nusaindex/rupiah";
import * as workday from "nusaindex/workday";
import { z } from "zod";

type Outcome = { ok: true; value: unknown } | { ok: false; error: { code: string } };

type Generated = { ok: true; value: string } | { ok: false; error: { code: string } };

export interface ToolContext {
  readonly randomSeed: () => number;
}

interface ToolSpec<S extends z.ZodObject> {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: S;
  readonly idempotent: boolean;
  readonly run: (args: z.infer<S>, ctx: ToolContext) => Promise<object>;
}

export interface ToolDefinition {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: z.ZodObject;
  readonly idempotent: boolean;
  readonly call: (args: unknown, ctx: ToolContext) => Promise<object>;
}

const PRIVACY =
  "Privacy: anything typed into this chat has already been sent to the AI provider before it reaches this local server, so use the fake tool for demos. " +
  "Valid means well-formed only: it cannot tell whether a number is real or who owns it.";

const KINDS = ["nik", "npwp", "phone", "plate", "nip", "nisn"] as const;
const FAKE_KINDS = ["nik", "npwp", "phone", "nip", "nisn", "plate"] as const;
const LEVELS = ["province", "regency", "district", "village"] as const;
const MAX_SEED = 0xffff_ffff;

const kind = z.enum(KINDS);
const identifierValue = z.string().max(64);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const parsers: Readonly<Record<(typeof KINDS)[number], (s: string) => Outcome>> = {
  nik: nik.parse,
  npwp: npwp.parse,
  phone: phone.parse,
  plate: plate.parse,
  nip: nip.parse,
  nisn: nisn.parse,
};

function define<S extends z.ZodObject>(spec: ToolSpec<S>): ToolDefinition {
  return {
    name: spec.name,
    title: spec.title,
    description: spec.description,
    inputSchema: spec.inputSchema,
    idempotent: spec.idempotent,
    call: (args, ctx) => spec.run(spec.inputSchema.parse(args), ctx),
  };
}

const validate = define({
  name: "validate",
  idempotent: true,
  title: "Validate Indonesian identifiers",
  description:
    "Check up to 100 values of one kind (nik, npwp, phone, plate, nip, nisn) and return valid or an error code for each, in input order. " +
    PRIVACY,
  inputSchema: z.object({ kind, values: z.array(identifierValue).min(1).max(100) }),
  run: async ({ kind: k, values }) => {
    await Promise.resolve();
    const results = values.map((value, index) => {
      const r = parsers[k](value);
      return r.ok ? { index, valid: true } : { index, valid: false, error: r.error.code };
    });
    return { results };
  },
});

const parse = define({
  name: "parse",
  idempotent: true,
  title: "Parse an Indonesian identifier",
  description:
    "Parse one value of a kind (nik, npwp, phone, plate, nip, nisn) into its fields, such as birth date, sex and region for a NIK or operator for a phone number. " +
    PRIVACY,
  inputSchema: z.object({ kind, value: identifierValue }),
  run: async ({ kind: k, value }) => {
    const r = parsers[k](value);
    if (!r.ok || k !== "nik") {
      return r;
    }
    const place = await region.fromNik(value);
    return { ok: true, value: r.value, ...(place.ok ? { place: place.value } : {}) };
  },
});

const regionSearch = define({
  name: "region_search",
  idempotent: true,
  title: "Search Indonesian regions",
  description:
    "Search provinces, regencies, districts and villages by name (Kepmendagri 300.2.2-2138/2025). Returns codes, names and levels, best match first.",
  inputSchema: z.object({
    query: z.string().min(1).max(256),
    level: z.enum(LEVELS).optional(),
    within: z.string().max(16).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  run: async ({ query, level, within, limit }) =>
    region.search(query, {
      ...(level === undefined ? {} : { level }),
      ...(within === undefined ? {} : { within }),
      ...(limit === undefined ? {} : { limit }),
    }),
});

const regionGet = define({
  name: "region_get",
  idempotent: true,
  title: "Get an Indonesian region",
  description:
    "Get a region by code (11, 11.01, 11.01.01 or 11.01.01.2001), following codes renamed by the 2012 and 2022 splits, optionally with its direct children.",
  inputSchema: z.object({ code: z.string().max(16), children: z.boolean().optional() }),
  run: async ({ code, children }) => {
    const r = await region.resolve(code);
    if (!r.ok || children !== true) {
      return r;
    }
    const list = await region.children(r.value.code);
    return { ok: true, value: r.value, children: list.ok ? list.value : [] };
  },
});

const holidays = define({
  name: "holidays",
  idempotent: true,
  title: "Indonesian holidays",
  description:
    "List national holidays and collective leave (cuti bersama) for a year, or for a date range with from and to. Each entry names the SKB or Keppres it comes from.",
  inputSchema: z.object({
    year: z.number().int().min(1).max(9999).optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  }),
  run: async ({ year, from, to }) => {
    await Promise.resolve();
    if (year !== undefined) {
      return holiday.inYear(year);
    }
    return from !== undefined && to !== undefined
      ? holiday.between(from, to)
      : { ok: false, error: { code: "options" } };
  },
});

const workdays = define({
  name: "workdays",
  idempotent: true,
  title: "Indonesian working days",
  description:
    "Working-day arithmetic that skips weekends, national holidays and (unless collectiveLeaveIsWorkday) collective leave: is (one date), add (date plus days, negative to go back) or count (from date to to, inclusive).",
  inputSchema: z.object({
    operation: z.enum(["is", "add", "count"]),
    date: isoDate,
    days: z.number().int().min(-3650).max(3650).optional(),
    to: isoDate.optional(),
    weekend: z.array(z.number().int().min(0).max(6)).max(6).optional(),
    collectiveLeaveIsWorkday: z.boolean().optional(),
  }),
  run: async ({ operation, date, days, to, weekend, collectiveLeaveIsWorkday }) => {
    await Promise.resolve();
    const options: workday.WorkdayOptions = {
      ...(weekend === undefined ? {} : { weekend }),
      ...(collectiveLeaveIsWorkday === undefined ? {} : { collectiveLeaveIsWorkday }),
    };
    if (operation === "is") {
      return workday.isWorkday(date, options);
    }
    if (operation === "add") {
      return days === undefined
        ? { ok: false, error: { code: "options" } }
        : workday.add(date, days, options);
    }
    return to === undefined
      ? { ok: false, error: { code: "options" } }
      : workday.count(date, to, options);
  },
});

const money = define({
  name: "rupiah",
  idempotent: true,
  title: "Rupiah formatting and words",
  description:
    "format turns amount into Rp1.500.000,50; parse turns Indonesian text such as Rp1.500.000,50 or Rp15.000,- into a number; terbilang spells amount in Indonesian words up to 999 trillion.",
  inputSchema: z.object({
    operation: z.enum(["format", "parse", "terbilang"]),
    amount: z.number().optional(),
    text: z.string().max(64).optional(),
  }),
  run: async ({ operation, amount, text }) => {
    await Promise.resolve();
    if (operation === "parse") {
      return text === undefined ? { ok: false, error: { code: "options" } } : rupiah.parse(text);
    }
    if (amount === undefined) {
      return { ok: false, error: { code: "options" } };
    }
    return operation === "format" ? rupiah.format(amount) : rupiah.terbilang(amount);
  },
});

async function generate(
  k: (typeof FAKE_KINDS)[number],
  seed: number,
  at: fake.NikOptions,
  person: fake.NipOptions,
): Promise<Generated> {
  switch (k) {
    case "nik":
      return fake.nik(seed, { ...at, ...person });
    case "nip":
      return fake.nip(seed, person);
    case "plate":
      return fake.plate(seed, at);
    case "npwp":
      return fake.npwp(seed);
    case "phone":
      return fake.phone(seed);
    case "nisn":
      return fake.nisn(seed);
  }
}

const fakes = define({
  name: "fake",
  idempotent: false,
  title: "Generate fake Indonesian test data",
  description:
    "Generate up to 20 structurally valid but fake values (nik, npwp, phone, nip, nisn, plate) for tests and demos. The same seed always gives the same values. NIKs can be pinned to a region code, birthDate and sex; plates to a plate code such as B. For tests only: generated numbers may belong to real people.",
  inputSchema: z.object({
    kind: z.enum(FAKE_KINDS),
    seed: z.number().int().min(0).max(MAX_SEED).optional(),
    count: z.number().int().min(1).max(20).optional(),
    region: z.string().max(16).optional(),
    birthDate: isoDate.optional(),
    sex: z.enum(["male", "female"]).optional(),
  }),
  run: async ({ kind: k, seed, count, region: place, birthDate, sex }, ctx) => {
    const start = seed ?? ctx.randomSeed();
    const person = {
      ...(birthDate === undefined ? {} : { birthDate }),
      ...(sex === undefined ? {} : { sex }),
    };
    const at = place === undefined ? {} : { region: place };
    const values: string[] = [];
    for (let i = 0; i < (count ?? 1); i++) {
      const s = (start + i) % (MAX_SEED + 1);
      const r = await generate(k, s, at, person);
      if (!r.ok) {
        return r;
      }
      values.push(r.value);
    }
    return { ok: true, value: values, seed: start };
  },
});

export const tools = {
  validate,
  parse,
  regionSearch,
  regionGet,
  holidays,
  workdays,
  money,
  fakes,
};
