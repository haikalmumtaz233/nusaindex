import starlight from "@astrojs/starlight";
import { defineConfig, passthroughImageService } from "astro/config";

const section = (label, translation, slugs) => ({
  label,
  translations: { id: translation },
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
        "Validate, parse, and format Indonesian data in Go, TypeScript, the command line, and AI agents.",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        id: { label: "Bahasa Indonesia", lang: "id" },
      },
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/haikalmumtaz233/nusaindex" },
      ],
      customCss: ["./src/styles/theme.css"],
      lastUpdated: false,
      pagination: true,
      sidebar: [
        section("Start here", "Mulai", [
          "getting-started",
          "guides/results-and-errors",
          "guides/input-and-privacy",
        ]),
        section("Identifiers", "Nomor identitas", [
          "reference/nik",
          "reference/npwp",
          "reference/phone",
          "reference/plate",
          "reference/nip",
          "reference/nisn",
        ]),
        section("Reference data", "Data referensi", [
          "reference/region",
          "reference/holiday",
          "reference/workday",
          "reference/bank",
        ]),
        section("Utilities", "Utilitas", [
          "reference/rupiah",
          "reference/mask",
          "reference/fake",
          "reference/schemas",
        ]),
        section("Tools", "Alat", ["tools/cli", "tools/mcp", "tools/json-api", "playground"]),
        section("Project", "Proyek", [
          "project/data-sources",
          "project/security",
          "project/non-goals",
        ]),
      ],
    }),
  ],
});
