export interface Scanned {
  readonly negative: boolean;
  readonly whole: number;
  readonly sen: number;
  readonly overflow: boolean;
}

const MAX_DIGITS = 15;

class Scanner {
  private i = 0;
  private count = 0;
  private readonly s: string;
  value = 0;
  overflow = false;

  constructor(s: string) {
    this.s = s;
  }

  done(): boolean {
    return this.i === this.s.length;
  }

  accept(c: string): boolean {
    if (this.s.charAt(this.i) === c) {
      this.i++;
      return true;
    }
    return false;
  }

  spaces(): void {
    while (this.accept(" ")) {
      continue;
    }
  }

  symbol(): boolean {
    if (this.word("rp")) {
      this.accept(".");
      return true;
    }
    return this.word("idr");
  }

  number(): boolean {
    const lead = this.digits();
    if (lead === 0) {
      return false;
    }
    if (this.s.charAt(this.i) !== ".") {
      return true;
    }
    if (lead > 3) {
      return false;
    }
    while (this.accept(".")) {
      if (this.digits() !== 3) {
        return false;
      }
    }
    return true;
  }

  decimals(): number | undefined {
    if (!this.accept(",")) {
      return 0;
    }
    if (this.accept("-")) {
      return 0;
    }
    let sen = 0;
    let n = 0;
    for (let d = this.digit(); d !== undefined; d = this.digit()) {
      if (n === 2) {
        return undefined;
      }
      sen = sen * 10 + d;
      this.i++;
      n++;
    }
    if (n === 1) {
      return sen * 10;
    }
    return n === 2 ? sen : undefined;
  }

  private word(w: string): boolean {
    if (this.s.slice(this.i, this.i + w.length).toLowerCase() !== w) {
      return false;
    }
    this.i += w.length;
    return true;
  }

  private digit(): number | undefined {
    const c = this.s.charCodeAt(this.i);
    return c >= 48 && c <= 57 ? c - 48 : undefined;
  }

  private digits(): number {
    let n = 0;
    for (let d = this.digit(); d !== undefined; d = this.digit()) {
      this.push(d);
      this.i++;
      n++;
    }
    return n;
  }

  private push(d: number): void {
    if (this.count === 0 && d === 0) {
      return;
    }
    this.count++;
    if (this.count > MAX_DIGITS) {
      this.overflow = true;
      return;
    }
    this.value = this.value * 10 + d;
  }
}

export function scan(s: string): Scanned | undefined {
  const sc = new Scanner(s);
  sc.spaces();
  const negative = sc.accept("-");
  sc.spaces();
  if (sc.symbol()) {
    sc.spaces();
  }
  if (!sc.number()) {
    return undefined;
  }
  const sen = sc.decimals();
  if (sen === undefined) {
    return undefined;
  }
  sc.spaces();
  if (!sc.done()) {
    return undefined;
  }
  const whole = sc.value;
  return { negative: negative && (whole !== 0 || sen !== 0), whole, sen, overflow: sc.overflow };
}
