import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";

const section = (label, english, slugs) => ({
  label,
  translations: { en: english },
  items: slugs,
});

export default defineConfig({
  site: "https://nusaindex.haikalmumtaz.com",
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  image: { service: passthroughImageService() },
  integrations: [
    starlight({
      title: "NusaIndex",
      description:
        "Cek, baca, dan format data Indonesia di Go, TypeScript, terminal, dan agent AI.",
      defaultLocale: "root",
      locales: {
        root: { label: "Bahasa Indonesia", lang: "id" },
        en: { label: "English", lang: "en" },
      },
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/haikalmumtaz233/nusaindex" },
      ],
      customCss: ["./src/styles/theme.css"],
      components: {
        Hero: "./src/components/Hero.astro",
        TableOfContents: "./src/components/TableOfContents.astro",
      },
      lastUpdated: false,
      pagination: true,
      sidebar: [
        section("Mulai", "Start here", [
          "getting-started",
          "use-cases",
          "guides/results-and-errors",
          "guides/input-and-privacy",
        ]),
        section("Nomor identitas", "Identifiers", [
          "reference/nik",
          "reference/npwp",
          "reference/phone",
          "reference/plate",
          "reference/nip",
          "reference/nisn",
        ]),
        section("Data referensi", "Reference data", [
          "reference/region",
          "reference/holiday",
          "reference/workday",
          "reference/bank",
        ]),
        section("Utilitas", "Utilities", [
          "reference/rupiah",
          "reference/mask",
          "reference/fake",
          "reference/schemas",
        ]),
        section("Alat", "Tools", ["tools/cli", "tools/mcp", "tools/json-api", "playground"]),
        section("Proyek", "Project", [
          "project/data-sources",
          "project/security",
          "project/non-goals",
        ]),
      ],
    }),
  ],
});
