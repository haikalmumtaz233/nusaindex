export function parseCsvLine(line: string): string[] | undefined {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;
  while (i < line.length) {
    const c = line.charAt(i);
    if (quoted) {
      if (c === '"' && line.charAt(i + 1) === '"') {
        field += '"';
        i += 2;
        continue;
      }
      if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === ",") {
      fields.push(field);
      field = "";
    } else {
      field += c;
    }
    i++;
  }
  if (quoted) {
    return undefined;
  }
  fields.push(field);
  return fields;
}

export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function csvLine(fields: readonly string[]): string {
  return fields.map(csvField).join(",");
}
