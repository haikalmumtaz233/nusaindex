import * as nik from "nusaindex/nik";
import * as nip from "nusaindex/nip";
import * as npwp from "nusaindex/npwp";
import * as phone from "nusaindex/phone";
import * as plate from "nusaindex/plate";
import * as region from "nusaindex/region";

export const anatomyKinds = ["nik", "npwp", "phone", "plate", "nip"] as const;
export type AnatomyKind = (typeof anatomyKinds)[number];

export const roles = [
  "province",
  "regency",
  "district",
  "birth",
  "serial",
  "lead",
  "taxpayerType",
  "registration",
  "check",
  "taxOffice",
  "status",
  "nik",
  "businessPlace",
  "country",
  "prefix",
  "areaCode",
  "subscriber",
  "plateRegion",
  "number",
  "suffix",
  "birthDate",
  "appointment",
  "appointmentYear",
  "agreement",
  "sex",
] as const;
export type Role = (typeof roles)[number];

export type Tone = 0 | 1 | 2 | 3 | 4 | 5;
export type Sex = "male" | "female";

export type Detail =
  | { readonly type: "none" }
  | { readonly type: "names"; readonly values: readonly string[] }
  | { readonly type: "birth"; readonly date: string; readonly sex: Sex }
  | { readonly type: "date"; readonly date: string }
  | { readonly type: "month"; readonly month: string }
  | { readonly type: "sex"; readonly sex: Sex }
  | { readonly type: "office"; readonly head: boolean }
  | { readonly type: "count"; readonly value: number }
  | {
      readonly type: "area";
      readonly provinces: readonly string[];
      readonly regencies: number;
      readonly first: string;
    };

export interface Segment {
  readonly digits: string;
  readonly role: Role;
  readonly tone: Tone;
  readonly detail: Detail;
}

export type AnatomyResult =
  | { readonly ok: true; readonly value: readonly Segment[] }
  | { readonly ok: false; readonly error: string };

const none: Detail = { type: "none" };

function segment(digits: string, role: Role, tone: Tone, detail: Detail = none): Segment {
  return { digits, role, tone, detail };
}

function names(...values: (string | undefined)[]): Detail {
  const present = values.filter((v): v is string => v !== undefined && v !== "");
  const unique = [...new Set(present)];
  return unique.length === 0 ? none : { type: "names", values: unique };
}

function failure(code: string): AnatomyResult {
  return { ok: false, error: code };
}

async function nikAnatomy(value: string): Promise<AnatomyResult> {
  const parsed = nik.parse(value);
  if (!parsed.ok) {
    return failure(parsed.error.code);
  }
  const n = parsed.value;
  const place = await region.fromNik(value);
  const p = place.ok ? place.value : undefined;
  return {
    ok: true,
    value: [
      segment(n.nik.slice(0, 2), "province", 1, names(p?.province.name)),
      segment(n.nik.slice(2, 4), "regency", 2, names(p?.regency?.name)),
      segment(n.nik.slice(4, 6), "district", 3, names(p?.district?.name)),
      segment(n.nik.slice(6, 12), "birth", 4, { type: "birth", date: n.birthDate, sex: n.sex }),
      segment(n.nik.slice(12, 16), "serial", 5),
    ],
  };
}

function npwpAnatomy(value: string): AnatomyResult {
  const parsed = npwp.parse(value);
  if (!parsed.ok) {
    return failure(parsed.error.code);
  }
  const p = parsed.value;
  const base = p.npwp16;
  const place = p.businessPlace === undefined ? [] : [segment(p.businessPlace, "businessPlace", 4)];
  if (p.isNik) {
    return { ok: true, value: [segment(base, "nik", 1), ...place] };
  }
  return {
    ok: true,
    value: [
      segment(base.slice(0, 1), "lead", 0),
      segment(base.slice(1, 3), "taxpayerType", 1),
      segment(base.slice(3, 9), "registration", 2),
      segment(base.slice(9, 10), "check", 3),
      segment(base.slice(10, 13), "taxOffice", 4),
      segment(base.slice(13, 16), "status", 5, { type: "office", head: base.endsWith("000") }),
      ...place,
    ],
  };
}

async function phoneAnatomy(value: string): Promise<AnatomyResult> {
  const parsed = phone.parse(value);
  if (!parsed.ok) {
    return failure(parsed.error.code);
  }
  const p = parsed.value;
  const country = segment("+62", "country", 0, names("Indonesia"));
  const nsn = p.e164.slice(3);
  if (p.areaCode === undefined) {
    return {
      ok: true,
      value: [
        country,
        segment(nsn.slice(0, 3), "prefix", 1, names(p.brand, p.operator)),
        segment(nsn.slice(3), "subscriber", 5),
      ],
    };
  }
  const areaLength = p.areaCode.length - 1;
  const area = await region.byAreaCode(p.areaCode);
  return {
    ok: true,
    value: [
      country,
      segment(
        nsn.slice(0, areaLength),
        "areaCode",
        2,
        names(...(area.ok ? area.value.map((r) => r.name) : [])),
      ),
      segment(nsn.slice(areaLength), "subscriber", 5),
    ],
  };
}

async function plateArea(code: string): Promise<Detail> {
  const regencies = await region.byPlate(code);
  if (!regencies.ok || regencies.value.length === 0) {
    return none;
  }
  const provinceCodes = [...new Set(regencies.value.map((r) => r.parentCode ?? ""))];
  const provinces = await Promise.all(provinceCodes.map((c) => region.get(c)));
  return {
    type: "area",
    provinces: provinces.flatMap((r) => (r.ok ? [r.value.name] : [])),
    regencies: regencies.value.length,
    first: regencies.value[0]?.name ?? "",
  };
}

async function plateAnatomy(value: string): Promise<AnatomyResult> {
  const parsed = plate.parse(value);
  if (!parsed.ok) {
    return failure(parsed.error.code);
  }
  const p = parsed.value;
  const suffix = p.suffix === "" ? [] : [segment(p.suffix, "suffix", 5)];
  return {
    ok: true,
    value: [
      segment(p.region, "plateRegion", 1, await plateArea(p.region)),
      segment(p.number, "number", 4),
      ...suffix,
    ],
  };
}

function nipAnatomy(value: string): AnatomyResult {
  const parsed = nip.parse(value);
  if (!parsed.ok) {
    return failure(parsed.error.code);
  }
  const n = parsed.value;
  const d = n.nip;
  const appointment =
    n.kind === "pns"
      ? [segment(d.slice(8, 14), "appointment", 2, { type: "month", month: n.appointmentDate })]
      : [
          segment(d.slice(8, 12), "appointmentYear", 2),
          segment(d.slice(12, 14), "agreement", 3, { type: "count", value: n.agreement ?? 0 }),
        ];
  return {
    ok: true,
    value: [
      segment(d.slice(0, 8), "birthDate", 4, { type: "date", date: n.birthDate }),
      ...appointment,
      segment(d.slice(14, 15), "sex", 1, { type: "sex", sex: n.sex }),
      segment(d.slice(15, 18), "serial", 5),
    ],
  };
}

export async function anatomy(kind: AnatomyKind, value: string): Promise<AnatomyResult> {
  switch (kind) {
    case "nik":
      return nikAnatomy(value);
    case "npwp":
      return npwpAnatomy(value);
    case "phone":
      return phoneAnatomy(value);
    case "plate":
      return plateAnatomy(value);
    case "nip":
      return nipAnatomy(value);
  }
}

export function isAnatomyKind(value: string): value is AnatomyKind {
  return (anatomyKinds as readonly string[]).includes(value);
}
