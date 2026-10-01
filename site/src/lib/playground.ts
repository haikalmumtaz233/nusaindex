import * as fake from "nusaindex/fake";
import * as nik from "nusaindex/nik";
import * as nip from "nusaindex/nip";
import * as nisn from "nusaindex/nisn";
import * as normalize from "nusaindex/normalize";
import * as npwp from "nusaindex/npwp";
import * as phone from "nusaindex/phone";
import * as plate from "nusaindex/plate";
import * as region from "nusaindex/region";
import * as rupiah from "nusaindex/rupiah";

export const kinds = ["nik", "npwp", "phone", "plate", "nip", "nisn", "rupiah"] as const;
export type Kind = (typeof kinds)[number];

type Outcome = { ok: true; value: unknown } | { ok: false; error: { code: string } };

export interface Report {
  readonly valid: boolean;
  readonly error?: string;
  readonly parsed?: unknown;
  readonly formatted?: string;
  readonly masked?: string;
  readonly place?: unknown;
  readonly words?: string;
  readonly normalizedHint?: boolean;
}

interface Module {
  parse(s: string): Outcome;
  format(s: string): { ok: true; value: string } | { ok: false; error: { code: string } };
  mask?: (s: string) => string;
}

const identifiers: Readonly<Record<Exclude<Kind, "rupiah">, Module>> = {
  nik,
  npwp,
  phone,
  plate,
  nip,
  nisn,
};

export function isKind(value: string): value is Kind {
  return (kinds as readonly string[]).includes(value);
}

function rupiahReport(value: string): Report {
  const parsed = rupiah.parse(value);
  if (!parsed.ok) {
    return { valid: false, error: parsed.error.code };
  }
  const formatted = rupiah.format(parsed.value);
  const words = rupiah.terbilang(parsed.value);
  return {
    valid: true,
    parsed: parsed.value,
    ...(formatted.ok ? { formatted: formatted.value } : {}),
    ...(words.ok ? { words: words.value } : {}),
  };
}

export async function inspect(kind: Kind, value: string): Promise<Report> {
  if (kind === "rupiah") {
    return rupiahReport(value);
  }
  const module = identifiers[kind];
  const parsed = module.parse(value);
  if (!parsed.ok) {
    const retry = normalize.text(value);
    const hint = retry !== value && module.parse(retry).ok;
    return { valid: false, error: parsed.error.code, ...(hint ? { normalizedHint: true } : {}) };
  }
  const formatted = module.format(value);
  const place = kind === "nik" ? await region.fromNik(value) : undefined;
  return {
    valid: true,
    parsed: parsed.value,
    ...(formatted.ok ? { formatted: formatted.value } : {}),
    ...(module.mask === undefined ? {} : { masked: module.mask(value) }),
    ...(place?.ok === true ? { place: place.value } : {}),
  };
}

export async function sample(kind: Kind, seed: number): Promise<string> {
  switch (kind) {
    case "nik": {
      const r = await fake.nik(seed);
      return r.ok ? r.value : "";
    }
    case "npwp":
      return valueOf(fake.npwp(seed));
    case "phone":
      return valueOf(fake.phone(seed));
    case "plate":
      return valueOf(fake.plate(seed));
    case "nip":
      return valueOf(fake.nip(seed));
    case "nisn":
      return valueOf(fake.nisn(seed));
    case "rupiah": {
      const r = rupiah.format((seed % 100_000_000) + (seed % 100) / 100);
      return valueOf(r);
    }
  }
}

function valueOf(result: { ok: true; value: string } | { ok: false }): string {
  return result.ok ? result.value : "";
}

const exampleSeeds: Readonly<Record<Kind, number>> = {
  nik: 42,
  npwp: 42,
  phone: 7,
  plate: 42,
  nip: 42,
  nisn: 42,
  rupiah: 42,
};

export async function example(kind: Kind): Promise<string> {
  if (kind === "nik") {
    const r = await fake.nik(42, { region: "32.73", birthDate: "1990-05-17", sex: "female" });
    return r.ok ? r.value : "";
  }
  return sample(kind, exampleSeeds[kind]);
}
