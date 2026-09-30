import { MAX_INPUT } from "../internal/digits.js";
import { failure, success, type Result } from "../internal/result.js";

export type PlateErrorCode = "length" | "charset" | "format";

export interface Plate {
  readonly region: string;
  readonly number: string;
  readonly suffix: string;
}

type Kind = "letter" | "digit";

interface Group {
  readonly kind: Kind;
  readonly text: string;
}

const SEPARATORS = " -";
const MAX_GROUPS = 3;
const MAX_REGION = 2;
const MAX_NUMBER = 4;
const MAX_SUFFIX = 3;

export function isValid(s: string): boolean {
  return parse(s).ok;
}

export function parse(s: string): Result<Plate, PlateErrorCode> {
  const split = splitGroups(s);
  if (!split.ok) {
    return split;
  }
  const [region, number, suffix] = split.value;
  if (region?.kind !== "letter" || number?.kind !== "digit") {
    return failure("format");
  }
  if (suffix !== undefined && (suffix.kind !== "letter" || suffix.text.length > MAX_SUFFIX)) {
    return failure("format");
  }
  if (
    region.text.length > MAX_REGION ||
    number.text.length > MAX_NUMBER ||
    number.text.startsWith("0")
  ) {
    return failure("format");
  }
  return success({ region: region.text, number: number.text, suffix: suffix?.text ?? "" });
}

export function format(s: string): Result<string, PlateErrorCode> {
  const parsed = parse(s);
  if (!parsed.ok) {
    return parsed;
  }
  const { region, number, suffix } = parsed.value;
  return success(suffix === "" ? `${region} ${number}` : `${region} ${number} ${suffix}`);
}

function splitGroups(s: string): Result<Group[], PlateErrorCode> {
  const groups: Group[] = [];
  let text = "";
  let kind: Kind | undefined;
  const flush = (): boolean => {
    if (kind === undefined) {
      return true;
    }
    if (groups.length === MAX_GROUPS) {
      return false;
    }
    groups.push({ kind, text });
    text = "";
    kind = undefined;
    return true;
  };
  for (let i = 0; i < s.length; i++) {
    if (i === MAX_INPUT) {
      return failure("length");
    }
    const ch = s.charAt(i);
    const chKind = classify(ch);
    if (chKind === undefined) {
      if (!SEPARATORS.includes(ch)) {
        return failure("charset");
      }
      if (!flush()) {
        return failure("format");
      }
      continue;
    }
    if (chKind !== kind && !flush()) {
      return failure("format");
    }
    text += ch.toUpperCase();
    kind = chKind;
  }
  if (!flush()) {
    return failure("format");
  }
  return groups.length === 0 ? failure("length") : success(groups);
}

function classify(ch: string): Kind | undefined {
  if (ch >= "0" && ch <= "9") {
    return "digit";
  }
  if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z")) {
    return "letter";
  }
  return undefined;
}
