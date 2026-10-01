import type { Result } from "./result.js";
import { parse as nik } from "../nik/index.js";
import { parse as nip } from "../nip/index.js";
import { parse as nisn } from "../nisn/index.js";
import { parse as npwp } from "../npwp/index.js";
import { parse as phone } from "../phone/index.js";
import { parse as plate } from "../plate/index.js";
import { parse as rupiah } from "../rupiah/index.js";

export interface SchemaOptions {
  readonly message?: string;
}

export interface Check {
  readonly label: string;
  readonly parse: (s: string) => Result<unknown>;
}

export const checks = {
  nik: { label: "NIK", parse: nik },
  npwp: { label: "NPWP", parse: npwp },
  phone: { label: "phone number", parse: phone },
  nip: { label: "NIP", parse: nip },
  nisn: { label: "NISN", parse: nisn },
  plate: { label: "vehicle plate", parse: plate },
} as const satisfies Record<string, Check>;

export const parseRupiah = rupiah;

export function messageFor(label: string, options: SchemaOptions): string {
  return options.message ?? `Invalid ${label}`;
}
