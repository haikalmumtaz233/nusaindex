import { failure, type Result } from "../internal/result.js";
import { csvLine, parseCsvLine } from "./csv.js";
import { EXIT_INVALID, EXIT_OK, EXIT_USAGE, type Io, MAX_LINE, usage } from "./io.js";
import { summary } from "./render.js";

export type Mode = "check" | "map";

export type Handler = (value: string) => Result<unknown> | Promise<Result<unknown>>;

export interface BatchOptions {
  readonly json: boolean;
  readonly csv: boolean;
  readonly column: string | undefined;
  readonly mode: Mode;
}

function bounded(line: string, handle: Handler): Result<unknown> | Promise<Result<unknown>> {
  return line.length > MAX_LINE ? failure("length") : handle(line);
}

export async function batch(io: Io, options: BatchOptions, handle: Handler): Promise<number> {
  if (options.csv) {
    return options.json
      ? usage(io, "--csv and --json cannot be combined")
      : batchCsv(io, options, handle);
  }
  let failed = false;
  let line = 0;
  for await (const value of io.lines()) {
    line++;
    const result = await bounded(value, handle);
    failed ||= !result.ok;
    io.out(options.json ? JSON.stringify({ line, ...result }) : summary(result));
  }
  return failed ? EXIT_INVALID : EXIT_OK;
}

function columnIndex(header: readonly string[], column: string): number {
  const byName = header.indexOf(column);
  if (byName >= 0 || !/^[1-9]\d{0,5}$/.test(column)) {
    return byName;
  }
  const index = Number(column) - 1;
  return index < header.length ? index : -1;
}

async function batchCsv(io: Io, options: BatchOptions, handle: Handler): Promise<number> {
  if (options.column === undefined) {
    return usage(io, "--csv needs --column <name or number>");
  }
  let index = -1;
  let name = "";
  let failed = false;
  let line = 0;
  for await (const text of io.lines()) {
    line++;
    const fields = text.length > MAX_LINE ? undefined : parseCsvLine(text);
    if (fields === undefined) {
      io.err(`nusaindex: line ${String(line)}: malformed CSV`);
      return EXIT_USAGE;
    }
    if (line === 1) {
      index = columnIndex(fields, options.column);
      if (index < 0) {
        return usage(io, "--column is not in the CSV header");
      }
      name = fields[index] ?? "";
      io.out(
        csvLine(options.mode === "check" ? [...fields, `${name}_valid`, `${name}_error`] : fields),
      );
      continue;
    }
    const result = await handle(fields[index] ?? "");
    failed ||= !result.ok;
    if (options.mode === "check") {
      io.out(csvLine([...fields, String(result.ok), result.ok ? "" : result.error.code]));
      continue;
    }
    if (!result.ok) {
      io.err(`nusaindex: line ${String(line)}: invalid ${name}: ${result.error.code}`);
    }
    io.out(
      csvLine(fields.map((f, i) => (i !== index ? f : result.ok ? String(result.value) : ""))),
    );
  }
  return failed ? EXIT_INVALID : EXIT_OK;
}
