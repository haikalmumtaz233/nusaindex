import * as v from "valibot";
import {
  type Check,
  checks,
  messageFor,
  parseRupiah,
  type SchemaOptions,
} from "../internal/schemas.js";

export type { SchemaOptions } from "../internal/schemas.js";

type IdentifierSchema = v.SchemaWithPipe<
  readonly [v.StringSchema<undefined>, v.CheckAction<string, string>]
>;

function identifier(check: Check, options: SchemaOptions): IdentifierSchema {
  return v.pipe(
    v.string(),
    v.check((s) => check.parse(s).ok, messageFor(check.label, options)),
  );
}

export function nik(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.nik, options);
}

export function npwp(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.npwp, options);
}

export function phone(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.phone, options);
}

export function nip(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.nip, options);
}

export function nisn(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.nisn, options);
}

export function plate(options: SchemaOptions = {}): IdentifierSchema {
  return identifier(checks.plate, options);
}

export function rupiah(options: SchemaOptions = {}) {
  const message = messageFor("rupiah amount", options);
  return v.pipe(
    v.string(),
    v.rawTransform(({ dataset, addIssue, NEVER }) => {
      const result = parseRupiah(dataset.value);
      if (result.ok) {
        return result.value;
      }
      addIssue({ message });
      return NEVER;
    }),
  );
}
