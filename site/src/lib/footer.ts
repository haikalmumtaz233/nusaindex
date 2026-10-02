import type { Locale } from "./anatomy-text";

const HOLDER = "© 2026 Haikal Mumtaz.";

const license: Readonly<Record<Locale, string>> = {
  en: "Code and data under the MIT License.",
  id: "Kode dan data berlisensi MIT.",
};

export function copyright(locale: Locale): string {
  return `${HOLDER} ${license[locale]}`;
}
