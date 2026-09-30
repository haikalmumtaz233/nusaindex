import { MAX_INPUT, maskDigits } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type PhoneErrorCode = "length" | "charset" | "country" | "prefix";

export type PhoneType = "mobile" | "fixed";

export interface Phone {
  readonly e164: string;
  readonly national: string;
  readonly type: PhoneType;
  readonly prefix?: string;
  readonly brand?: string;
  readonly operator?: string;
  readonly areaCode?: string;
}

const COUNTRY_CODE = "62";
const SEPARATORS = " -.()";
const MAX_DIGITS = 15;
const MASK_KEEP = 3;
const MOBILE_NSN = { min: 9, max: 12 };
const FIXED_NSN = { min: 8, max: 11 };
const TELKOMSEL = "Telkomsel";
const IOH = "Indosat Ooredoo Hutchison";
const XLSMART = "XLSmart";
const MOBILE_PREFIXES: readonly (readonly [string, string, readonly string[]])[] = [
  ["Telkomsel", TELKOMSEL, ["811", "812", "813", "821", "822", "823", "851", "852", "853"]],
  ["IM3", IOH, ["814", "815", "816", "855", "856", "857", "858"]],
  ["Tri", IOH, ["895", "896", "897", "898", "899"]],
  ["XL", XLSMART, ["817", "818", "819", "859", "877", "878"]],
  ["AXIS", XLSMART, ["831", "832", "833", "838"]],
  ["Smartfren", XLSMART, ["881", "882", "883", "884", "885", "886", "887", "888", "889"]],
];

export function isValid(s: string): boolean {
  return parse(s).ok;
}

export function parse(s: string): Result<Phone, PhoneErrorCode> {
  const subscriber = subscriberNumber(s);
  if (!subscriber.ok) {
    return subscriber;
  }
  const nsn = subscriber.value;
  const base = { e164: `+${COUNTRY_CODE}${nsn}`, national: `0${nsn}` };
  if (nsn.startsWith("8")) {
    const brand = mobileBrand(nsn.slice(0, 3));
    if (brand === undefined) {
      return failure("prefix");
    }
    if (nsn.length < MOBILE_NSN.min || nsn.length > MOBILE_NSN.max) {
      return failure("length");
    }
    return success({ ...base, type: "mobile", prefix: `0${nsn.slice(0, 3)}`, ...brand });
  }
  if (!isFixedLead(nsn.charAt(0))) {
    return failure("prefix");
  }
  if (nsn.length < FIXED_NSN.min || nsn.length > FIXED_NSN.max) {
    return failure("length");
  }
  return success({ ...base, type: "fixed", areaCode: `0${nsn.slice(0, areaCodeLength(nsn))}` });
}

export function format(s: string): Result<string, PhoneErrorCode> {
  const parsed = parse(s);
  return parsed.ok ? success(parsed.value.e164) : parsed;
}

export function whatsappLink(s: string): Result<string, PhoneErrorCode> {
  const parsed = parse(s);
  return parsed.ok ? success(`https://wa.me/${parsed.value.e164.slice(1)}`) : parsed;
}

export function mask(s: string): string {
  const parsed = parse(s);
  if (!parsed.ok) {
    return maskDigits(s, MASK_KEEP);
  }
  const nsn = parsed.value.e164.slice(COUNTRY_CODE.length + 1);
  return `+${COUNTRY_CODE}${"*".repeat(nsn.length - MASK_KEEP)}${nsn.slice(-MASK_KEEP)}`;
}

function subscriberNumber(s: string): Result<string, PhoneErrorCode> {
  const collected = collect(s);
  if (!collected.ok) {
    return collected;
  }
  const { digits: d, plus } = collected.value;
  if (d.length === 0 || d.length > MAX_DIGITS) {
    return failure("length");
  }
  let nsn: string;
  if (d.startsWith(COUNTRY_CODE)) {
    const rest = d.slice(COUNTRY_CODE.length);
    nsn = rest.startsWith("0") ? rest.slice(1) : rest;
  } else if (plus) {
    return failure("country");
  } else if (d.startsWith("0")) {
    nsn = d.slice(1);
  } else if (d.startsWith("8")) {
    nsn = d;
  } else {
    return failure("prefix");
  }
  return nsn.length < 3 ? failure("length") : success(nsn);
}

function collect(s: string): Result<{ digits: string; plus: boolean }, PhoneErrorCode> {
  let digits = "";
  let plus = false;
  for (let i = 0; i < s.length; i++) {
    if (i === MAX_INPUT) {
      return failure("length");
    }
    const ch = s.charAt(i);
    if (ch >= "0" && ch <= "9") {
      digits += ch;
    } else if (ch === "+" && digits === "" && !plus) {
      plus = true;
    } else if (!SEPARATORS.includes(ch)) {
      return failure("charset");
    }
  }
  return success({ digits, plus });
}

function mobileBrand(prefix: string): { brand: string; operator: string } | undefined {
  const entry = MOBILE_PREFIXES.find(([, , prefixes]) => prefixes.includes(prefix));
  return entry === undefined ? undefined : { brand: entry[0], operator: entry[1] };
}

function isFixedLead(ch: string): boolean {
  return (ch >= "2" && ch <= "7") || ch === "9";
}

function areaCodeLength(nsn: string): number {
  return ["21", "22", "24", "31", "61"].includes(nsn.slice(0, 2)) ? 2 : 3;
}
