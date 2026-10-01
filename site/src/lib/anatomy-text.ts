import type { AnatomyKind, Detail, Role, Sex } from "./anatomy";

export type Locale = "en" | "id";

type Pair = readonly [en: string, id: string];

const roleLabels: Readonly<Record<Role, Pair>> = {
  province: ["Province", "Provinsi"],
  regency: ["Regency or city", "Kabupaten atau kota"],
  district: ["District", "Kecamatan"],
  birth: ["Birth date and sex", "Tanggal lahir dan jenis kelamin"],
  serial: ["Serial number", "Nomor urut"],
  lead: ["Prefix for a 15-digit NPWP", "Awalan NPWP 15 digit"],
  taxpayerType: ["Taxpayer type", "Jenis wajib pajak"],
  registration: ["Registration number", "Nomor registrasi"],
  check: ["Check digit", "Digit pengaman"],
  taxOffice: ["Tax office (KPP)", "Kode KPP"],
  status: ["Head office or branch", "Status pusat atau cabang"],
  nik: ["The taxpayer's NIK", "NIK wajib pajak"],
  businessPlace: ["Place of business (NITKU)", "Tempat kegiatan usaha (NITKU)"],
  country: ["Country code", "Kode negara"],
  prefix: ["Operator prefix", "Prefiks operator"],
  areaCode: ["Area code", "Kode area"],
  subscriber: ["Subscriber number", "Nomor pelanggan"],
  plateRegion: ["Region code", "Kode wilayah"],
  number: ["Number", "Nomor"],
  suffix: ["Suffix letters", "Huruf belakang"],
  birthDate: ["Birth date", "Tanggal lahir"],
  appointment: ["Appointment month (TMT)", "TMT CPNS"],
  appointmentYear: ["Appointment year", "Tahun pengangkatan"],
  agreement: ["Work agreement", "Perjanjian kerja"],
  sex: ["Sex", "Jenis kelamin"],
};

const lengths: Readonly<Record<AnatomyKind, Pair>> = {
  nik: ["A NIK has 16 digits.", "NIK terdiri dari 16 digit."],
  npwp: [
    "An NPWP has 15 or 16 digits, a NITKU 22.",
    "NPWP terdiri dari 15 atau 16 digit, NITKU 22.",
  ],
  phone: [
    "Too short or too long for an Indonesian number.",
    "Terlalu pendek atau terlalu panjang.",
  ],
  plate: ["Too long for a plate.", "Terlalu panjang untuk plat nomor."],
  nip: ["A NIP has 18 digits.", "NIP terdiri dari 18 digit."],
};

const errors: Readonly<Record<string, Pair>> = {
  charset: ["Contains characters that are not allowed.", "Ada karakter yang tidak diizinkan."],
  region: ["This region code does not exist.", "Kode wilayah ini tidak ada."],
  date: ["The date part is not a real date.", "Bagian tanggalnya bukan tanggal yang ada."],
  serial: ["The serial number cannot be all zeros.", "Nomor urut tidak boleh nol semua."],
  nik: ["The NIK inside this NPWP is not valid.", "NIK di dalam NPWP ini tidak valid."],
  country: ["Not an Indonesian number (+62).", "Bukan nomor Indonesia (+62)."],
  prefix: [
    "Unknown operator prefix or area code.",
    "Prefiks operator atau kode area tidak dikenal.",
  ],
  format: ["Not a plate like B 1234 XYZ.", "Bukan plat seperti B 1234 XYZ."],
  sex: ["The sex digit must be 1 or 2.", "Digit jenis kelamin harus 1 atau 2."],
};

const sexes: Readonly<Record<Sex, Pair>> = {
  male: ["male", "laki-laki"],
  female: ["female", "perempuan"],
};

interface Ui {
  readonly kinds: Readonly<Record<AnatomyKind, string>>;
  readonly input: Readonly<Record<AnatomyKind, string>>;
  readonly generate: string;
  readonly valid: string;
  readonly empty: string;
  readonly note: string;
  readonly choose: string;
}

const uis: Readonly<Record<Locale, Ui>> = {
  en: {
    kinds: { nik: "NIK", npwp: "NPWP", phone: "Phone", plate: "Plate", nip: "NIP" },
    input: {
      nik: "Paste a NIK",
      npwp: "Paste an NPWP or NITKU",
      phone: "Paste a phone number",
      plate: "Paste a vehicle plate",
      nip: "Paste a NIP",
    },
    generate: "Generate another",
    valid: "Well-formed",
    empty: "Paste a value to decode it.",
    note: "Decoded in your browser. Nothing you type is sent anywhere.",
    choose: "Identifier",
  },
  id: {
    kinds: { nik: "NIK", npwp: "NPWP", phone: "Nomor HP", plate: "Plat", nip: "NIP" },
    input: {
      nik: "Tempel NIK",
      npwp: "Tempel NPWP atau NITKU",
      phone: "Tempel nomor HP atau telepon",
      plate: "Tempel plat nomor",
      nip: "Tempel NIP",
    },
    generate: "Buat contoh lain",
    valid: "Strukturnya benar",
    empty: "Tempel nomornya di sini.",
    note: "Dicek langsung di browser. Yang kamu ketik tidak dikirim ke mana pun.",
    choose: "Jenis nomor",
  },
};

function pick(pair: Pair, locale: Locale): string {
  return locale === "id" ? pair[1] : pair[0];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string, locale: Locale, withDay: boolean): string {
  const format = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    ...(withDay ? { day: "numeric" } : {}),
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return format.format(new Date(`${withDay ? iso : `${iso}-01`}T00:00:00Z`));
}

function areaText(provinces: readonly string[], regencies: number, first: string, locale: Locale) {
  if (regencies === 1) {
    return [first, ...provinces].join(", ");
  }
  const where = provinces.join(", ");
  return locale === "id"
    ? `${String(regencies)} kabupaten/kota di ${where}`
    : `${String(regencies)} regencies and cities in ${where}`;
}

export function roleLabel(role: Role, locale: Locale): string {
  return pick(roleLabels[role], locale);
}

export function detailText(detail: Detail, locale: Locale): string {
  switch (detail.type) {
    case "none":
      return "";
    case "names":
      return detail.values.join(", ");
    case "birth": {
      const date = formatDate(detail.date, locale, true);
      const sex = pick(sexes[detail.sex], locale);
      const shift =
        detail.sex === "female" ? (locale === "id" ? " (tanggal + 40)" : " (day + 40)") : "";
      return `${date}, ${sex}${shift}`;
    }
    case "date":
      return formatDate(detail.date, locale, true);
    case "month":
      return formatDate(detail.month, locale, false);
    case "sex":
      return capitalize(pick(sexes[detail.sex], locale));
    case "office":
      return detail.head
        ? pick(["Head office", "Pusat"], locale)
        : pick(["Branch", "Cabang"], locale);
    case "count":
      return locale === "id" ? `Ke-${String(detail.value)}` : `No. ${String(detail.value)}`;
    case "area":
      return areaText(detail.provinces, detail.regencies, detail.first, locale);
  }
}

export function errorText(kind: AnatomyKind, code: string, locale: Locale): string {
  if (code === "length") {
    return pick(lengths[kind], locale);
  }
  const known = errors[code];
  if (known !== undefined) {
    return pick(known, locale);
  }
  return locale === "id" ? `Tidak valid (${code}).` : `Not valid (${code}).`;
}

export function localeOf(lang: string | undefined): Locale {
  return lang === "en" ? "en" : "id";
}

export function ui(locale: Locale): Ui {
  return uis[locale];
}
