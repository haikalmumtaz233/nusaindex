import type { Locale } from "./anatomy-text";
import type { IconName } from "./icons";

export interface UseCase {
  readonly slug: string;
  readonly icon: IconName;
  readonly modules: readonly IconName[];
  readonly tools?: readonly ("cli" | "mcp")[];
  readonly title: Readonly<Record<Locale, string>>;
  readonly short: Readonly<Record<Locale, string>>;
  readonly points: Readonly<Record<Locale, readonly string[]>>;
}

export const useCases: readonly UseCase[] = [
  {
    slug: "layanan-publik",
    icon: "government",
    modules: ["nik", "nip", "region"],
    title: {
      id: "Layanan publik dan website pemda",
      en: "Public services and local government sites",
    },
    short: {
      id: "Formulir pendaftaran yang langsung tahu kalau NIK salah ketik.",
      en: "Sign-up forms that catch a mistyped NIK right away.",
    },
    points: {
      id: [
        "Cek format NIK dan NIP sebelum formulir dikirim, jadi petugas tidak perlu menolak berkas karena salah ketik.",
        "Isi dropdown provinsi sampai desa dari Kepmendagri terbaru, tanpa tabel wilayah buatan sendiri.",
        "Kode wilayah lama hasil pemekaran Papua dan Kalimantan Utara otomatis diarahkan ke kode yang baru.",
      ],
      en: [
        "Check NIK and NIP formats before a form is submitted, so staff do not reject files over typos.",
        "Fill province to village dropdowns from the latest Kepmendagri instead of a home-made region table.",
        "Old codes from the Papua and North Kalimantan splits resolve to the current codes.",
      ],
    },
  },
  {
    slug: "sekolah",
    icon: "school",
    modules: ["nisn", "nik", "region"],
    title: { id: "Sekolah dan kampus", en: "Schools and universities" },
    short: {
      id: "Pendaftaran siswa baru dengan NISN, NIK orang tua, dan alamat yang rapi.",
      en: "Student enrolment with clean NISN, parent NIK and address data.",
    },
    points: {
      id: [
        "Cek NISN siswa dan NIK orang tua di formulir pendaftaran.",
        "Alamat siswa tersimpan sebagai kode wilayah, jadi gampang direkap per kecamatan atau kabupaten.",
      ],
      en: [
        "Check student NISN and parent NIK on enrolment forms.",
        "Store addresses as region codes so reports per district or regency are easy.",
      ],
    },
  },
  {
    slug: "fintech",
    icon: "shop",
    modules: ["phone", "bank", "rupiah"],
    title: { id: "Fintech, e-commerce, dan pembayaran", en: "Fintech, e-commerce and payments" },
    short: {
      id: "Nomor HP untuk OTP, kode bank untuk transfer, dan nominal di invoice.",
      en: "Phone numbers for OTP, bank codes for transfers, amounts on invoices.",
    },
    points: {
      id: [
        "Ubah nomor HP ke format E.164 sebelum kirim OTP, dan tolak prefix yang tidak pernah dialokasikan.",
        "Cari bank dari sandi 3 digit atau BIC untuk form transfer.",
        "Tulis nominal sebagai Rp1.500.000,50 dan terbilang untuk kuitansi.",
      ],
      en: [
        "Normalize phone numbers to E.164 before sending OTPs, and reject prefixes that were never allocated.",
        "Look up banks by 3-digit code or BIC for transfer forms.",
        "Print amounts as Rp1.500.000,50 and in words for receipts.",
      ],
    },
  },
  {
    slug: "hr-penggajian",
    icon: "team",
    modules: ["workday", "holiday", "npwp", "nip"],
    title: { id: "HR dan penggajian", en: "HR and payroll" },
    short: {
      id: "Tanggal gajian, cuti bersama, dan NPWP karyawan tanpa hitung manual.",
      en: "Pay dates, collective leave and employee NPWP without manual counting.",
    },
    points: {
      id: [
        "Hitung hari kerja dan jatuh tempo dengan libur nasional serta cuti bersama dari SKB terbaru.",
        "Konversi NPWP 15 digit lama ke format 16 digit untuk laporan pajak.",
        "Baca tanggal lahir, TMT, dan jenis kelamin dari NIP ASN maupun PPPK.",
      ],
      en: [
        "Count working days and due dates with national holidays and collective leave from the latest SKB.",
        "Convert old 15-digit NPWPs to the 16-digit format for tax reports.",
        "Read birth date, appointment date and sex from civil servant and PPPK NIPs.",
      ],
    },
  },
  {
    slug: "logistik",
    icon: "truck",
    modules: ["region", "workday", "plate"],
    title: { id: "Logistik dan pengiriman", en: "Logistics and delivery" },
    short: {
      id: "Alamat sampai desa, estimasi tiba, dan plat armada.",
      en: "Addresses down to village level, delivery estimates and fleet plates.",
    },
    points: {
      id: [
        'Pilih alamat sampai desa dan cari wilayah dari nama, misalnya "gambir".',
        "Estimasi tanggal tiba dalam hari kerja, melewati akhir pekan dan libur.",
        "Cek plat armada dan cari kabupaten/kota asal dari kode wilayahnya.",
      ],
      en: [
        'Pick addresses down to village level and search regions by name, such as "gambir".',
        "Estimate delivery dates in working days, skipping weekends and holidays.",
        "Check fleet plates and find the regencies behind a plate code.",
      ],
    },
  },
  {
    slug: "uu-pdp",
    icon: "lock",
    modules: ["mask"],
    title: { id: "Kepatuhan UU PDP", en: "Personal data protection" },
    short: {
      id: "NIK dan nomor HP tidak ikut tercatat di log.",
      en: "Keep NIKs and phone numbers out of your logs.",
    },
    points: {
      id: [
        "Mask NIK, NPWP, dan nomor HP di layar admin dan tiket layanan.",
        "Redaksi teks dan objek sebelum dikirim ke log atau tools observability, termasuk lewat handler slog di Go.",
      ],
      en: [
        "Mask NIK, NPWP and phone numbers on admin screens and support tickets.",
        "Redact text and objects before they reach logs or observability tools, including through a Go slog handler.",
      ],
    },
  },
  {
    slug: "pengujian",
    icon: "test",
    modules: ["fake", "schemas"],
    title: { id: "Pengujian dan QA", en: "Testing and QA" },
    short: {
      id: "Data uji yang valid tanpa menyalin data asli pelanggan.",
      en: "Valid test data without copying real customer records.",
    },
    points: {
      id: [
        "Buat NIK, NPWP, nomor HP, dan plat yang strukturnya valid dari sebuah seed.",
        "Seed yang sama memberi hasil yang sama di Go dan TypeScript, jadi fixture bisa dipakai bareng.",
        "Pasang validasi yang sama di skema Zod, Valibot, atau go-playground/validator.",
      ],
      en: [
        "Generate structurally valid NIK, NPWP, phone numbers and plates from a seed.",
        "The same seed gives the same values in Go and TypeScript, so fixtures can be shared.",
        "Reuse the same checks in Zod, Valibot or go-playground/validator schemas.",
      ],
    },
  },
  {
    slug: "agent-ai",
    icon: "chat",
    modules: ["holiday", "region", "rupiah"],
    tools: ["mcp"],
    title: { id: "Chatbot dan agent AI", en: "Chatbots and AI agents" },
    short: {
      id: "Agent yang bisa jawab soal libur, wilayah, dan nominal tanpa mengarang.",
      en: "Agents that answer about holidays, regions and amounts without guessing.",
    },
    points: {
      id: [
        "Pasang server MCP supaya agent menjawab dari data, bukan dari ingatan model.",
        "Semua tool cuma membaca dan berjalan offline di mesin kamu.",
      ],
      en: [
        "Add the MCP server so agents answer from data, not from what the model remembers.",
        "Every tool is read-only and runs offline on your machine.",
      ],
    },
  },
];
