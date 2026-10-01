import { z } from "zod";
import {
  type Check,
  checks,
  messageFor,
  parseRupiah,
  type SchemaOptions,
} from "../internal/schemas.js";

export type { SchemaOptions } from "../internal/schemas.js";

function identifier(check: Check, options: SchemaOptions): z.ZodString {
  const message = messageFor(check.label, options);
  return z.string().check((payload) => {
    const result = check.parse(payload.value);
    if (!result.ok) {
      payload.issues.push({
        code: "custom",
        message,
        input: payload.value,
        params: { nusaindex: result.error.code },
      });
    }
  });
}

export function nik(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.nik, options);
}

export function npwp(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.npwp, options);
}

export function phone(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.phone, options);
}

export function nip(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.nip, options);
}

export function nisn(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.nisn, options);
}

export function plate(options: SchemaOptions = {}): z.ZodString {
  return identifier(checks.plate, options);
}

export function rupiah(options: SchemaOptions = {}) {
  const message = messageFor("rupiah amount", options);
  return z.string().transform((value, ctx) => {
    const result = parseRupiah(value);
    if (result.ok) {
      return result.value;
    }
    ctx.issues.push({
      code: "custom",
      message,
      input: value,
      params: { nusaindex: result.error.code },
    });
    return z.NEVER;
  });
}
