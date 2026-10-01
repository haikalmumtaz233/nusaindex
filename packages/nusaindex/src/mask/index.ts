import { mask as maskPhone } from "../phone/index.js";
import { maskKeep } from "./text.js";

export { MAX_DEPTH, redact } from "./redact.js";
export { MAX_TEXT, REDACTED, text } from "./text.js";

export function nik(s: string): string {
  return maskKeep(s);
}

export function npwp(s: string): string {
  return maskKeep(s);
}

export function phone(s: string): string {
  return maskPhone(s);
}

export function nip(s: string): string {
  return maskKeep(s);
}

export function nisn(s: string): string {
  return maskKeep(s);
}

export function account(s: string): string {
  return maskKeep(s);
}
