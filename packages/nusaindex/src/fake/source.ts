export const Stream = { Nik: 1, Npwp: 2, Phone: 3, Nip: 4, Nisn: 5, Plate: 6 } as const;

export type StreamId = (typeof Stream)[keyof typeof Stream];

const DECIMAL = "0123456789";

export class Source {
  private state: number;

  constructor(seed: number, stream: StreamId) {
    let h = (seed ^ Math.imul(stream, 0x9e3779b9)) >>> 0;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    this.state = h >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  int(n: number): number {
    return this.next() % n;
  }

  pick(chars: string): string {
    return chars.charAt(this.int(chars.length));
  }

  digits(n: number): string {
    let out = "";
    for (let i = 0; i < n; i++) {
      out += this.pick(DECIMAL);
    }
    return out;
  }
}
