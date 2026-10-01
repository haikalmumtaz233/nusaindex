export interface Io {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
  readonly lines: () => AsyncIterable<string>;
  readonly randomSeed: () => number;
}

export const EXIT_OK = 0;
export const EXIT_INVALID = 1;
export const EXIT_USAGE = 2;

export const MAX_LINE = 1_048_576;

export function usage(io: Io, message: string): number {
  io.err(`nusaindex: ${message}`);
  io.err("Run 'nusaindex --help' for usage.");
  return EXIT_USAGE;
}
