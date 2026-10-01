import type { RegionLevel } from "nusaindex/region";
import type { Locale } from "./anatomy-text";
import type { SkippedHoliday } from "./live";

export type Tool = "rupiah" | "mask" | "fake" | "workday" | "region";
export type FakeKind = "nik" | "npwp" | "phone" | "plate" | "nip" | "nisn";

export const fakeKinds: readonly FakeKind[] = ["nik", "npwp", "phone", "plate", "nip", "nisn"];

interface LiveText {
  readonly rupiahInput: string;
  readonly amount: string;
  readonly formatted: string;
  readonly words: string;
  readonly maskInput: string;
  readonly kind: string;
  readonly seed: string;
  readonly newSeed: string;
  readonly fakeHint: string;
  readonly fakeKinds: Readonly<Record<FakeKind, string>>;
  readonly start: string;
  readonly days: string;
  readonly regionInput: string;
  readonly levels: Readonly<Record<RegionLevel, string>>;
  readonly note: string;
  readonly skipped: (
    weekendDays: number,
    holidays: readonly SkippedHoliday[],
    locale: Locale,
  ) => string;
  readonly error: (code: string) => string;
}

function shortDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function holidayList(holidays: readonly SkippedHoliday[], locale: Locale): string {
  return holidays
    .map((h) => `${shortDate(h.date, locale)} ${locale === "id" ? h.name : h.nameEn}`)
    .join(", ");
}

const enErrors: Readonly<Record<string, string>> = {
  length: "Too long.",
  charset: "Contains characters that are not allowed.",
  format: "Not a format NusaIndex can read.",
  range: "Outside the supported range.",
  date: "Not a valid date.",
  options: "Enter a whole number.",
};

const idErrors: Readonly<Record<string, string>> = {
  length: "Terlalu panjang.",
  charset: "Ada karakter yang tidak diizinkan.",
  format: "Formatnya tidak bisa dibaca.",
  range: "Di luar rentang yang didukung.",
  date: "Tanggal tidak valid.",
  options: "Masukkan bilangan bulat.",
};

const en: LiveText = {
  rupiahInput: "Type an amount",
  amount: "Number",
  formatted: "Formatted",
  words: "In words",
  maskInput: "Type text that contains identifiers",
  kind: "Type",
  seed: "Seed",
  newSeed: "New seed",
  fakeHint: "The same seed gives the same values in Go and TypeScript. For tests only.",
  fakeKinds: {
    nik: "NIK",
    npwp: "NPWP",
    phone: "Phone",
    plate: "Plate",
    nip: "NIP",
    nisn: "NISN",
  },
  start: "Start date",
  days: "Working days to add",
  regionInput: "Search for a region",
  levels: {
    province: "Province",
    regency: "Regency or city",
    district: "District",
    village: "Village",
  },
  note: "Runs in your browser.",
  skipped: (weekendDays, holidays, locale) => {
    const parts = [
      ...(weekendDays > 0
        ? [`${String(weekendDays)} weekend day${weekendDays === 1 ? "" : "s"}`]
        : []),
      ...(holidays.length > 0
        ? [
            `${String(holidays.length)} holiday${holidays.length === 1 ? "" : "s"}: ${holidayList(holidays, locale)}`,
          ]
        : []),
    ];
    return parts.length === 0 ? "No days skipped." : `Skips ${parts.join(" and ")}.`;
  },
  error: (code) => enErrors[code] ?? `Not valid (${code}).`,
};

const id: LiveText = {
  rupiahInput: "Ketik nominal",
  amount: "Angka",
  formatted: "Format",
  words: "Terbilang",
  maskInput: "Ketik teks yang berisi nomor identitas",
  kind: "Jenis",
  seed: "Seed",
  newSeed: "Seed baru",
  fakeHint: "Seed yang sama memberi hasil yang sama di Go dan TypeScript. Hanya untuk pengujian.",
  fakeKinds: {
    nik: "NIK",
    npwp: "NPWP",
    phone: "Nomor HP",
    plate: "Plat",
    nip: "NIP",
    nisn: "NISN",
  },
  start: "Tanggal mulai",
  days: "Jumlah hari kerja",
  regionInput: "Cari wilayah",
  levels: {
    province: "Provinsi",
    regency: "Kabupaten/kota",
    district: "Kecamatan",
    village: "Desa/kelurahan",
  },
  note: "Berjalan di browser Anda.",
  skipped: (weekendDays, holidays, locale) => {
    const parts = [
      ...(weekendDays > 0 ? [`${String(weekendDays)} hari akhir pekan`] : []),
      ...(holidays.length > 0
        ? [`${String(holidays.length)} hari libur: ${holidayList(holidays, locale)}`]
        : []),
    ];
    return parts.length === 0
      ? "Tidak ada hari yang dilewati."
      : `Melewati ${parts.join(" dan ")}.`;
  },
  error: (code) => idErrors[code] ?? `Tidak valid (${code}).`,
};

export function texts(locale: Locale): LiveText {
  return locale === "id" ? id : en;
}
