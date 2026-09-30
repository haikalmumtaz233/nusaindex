export function text(s: string): string {
  let out = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isZeroWidth(cp)) {
      continue;
    }
    if (isSpace(cp)) {
      out += " ";
    } else if (isDash(cp)) {
      out += "-";
    } else if (cp >= 0xff01 && cp <= 0xff5e) {
      out += String.fromCodePoint(cp - 0xfee0);
    } else if (cp >= 0x0660 && cp <= 0x0669) {
      out += String(cp - 0x0660);
    } else if (cp >= 0x06f0 && cp <= 0x06f9) {
      out += String(cp - 0x06f0);
    } else {
      out += ch;
    }
  }
  return trimSpaces(out);
}

function isZeroWidth(cp: number): boolean {
  return (
    cp === 0x00ad ||
    cp === 0x200b ||
    cp === 0x200c ||
    cp === 0x200d ||
    cp === 0x2060 ||
    cp === 0xfeff
  );
}

function isSpace(cp: number): boolean {
  return (
    (cp >= 0x09 && cp <= 0x0d) ||
    cp === 0x20 ||
    cp === 0x85 ||
    cp === 0xa0 ||
    cp === 0x1680 ||
    (cp >= 0x2000 && cp <= 0x200a) ||
    cp === 0x2028 ||
    cp === 0x2029 ||
    cp === 0x202f ||
    cp === 0x205f ||
    cp === 0x3000
  );
}

function isDash(cp: number): boolean {
  return (cp >= 0x2010 && cp <= 0x2015) || cp === 0x2212 || cp === 0xfe58 || cp === 0xfe63;
}

function trimSpaces(s: string): string {
  let start = 0;
  let end = s.length;
  while (start < end && s.charCodeAt(start) === 0x20) {
    start++;
  }
  while (end > start && s.charCodeAt(end - 1) === 0x20) {
    end--;
  }
  return s.slice(start, end);
}
