import { describe, expect, it } from "vitest";
import type { Locale } from "../src/lib/anatomy-text";
import { icons } from "../src/lib/icons";
import { useCases } from "../src/lib/use-cases";

const locales: readonly Locale[] = ["id", "en"];

describe("use cases", () => {
  it("has unique slugs and known icons and modules", () => {
    const slugs = useCases.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of useCases) {
      expect(Object.keys(icons)).toContain(c.icon);
      for (const m of c.modules) {
        expect(Object.keys(icons)).toContain(m);
      }
    }
  });

  it("says everything in both languages without semicolons", () => {
    for (const c of useCases) {
      for (const locale of locales) {
        const text = [c.title[locale], c.short[locale], ...c.points[locale]];
        expect(c.points[locale].length).toBeGreaterThan(0);
        for (const line of text) {
          expect(line).not.toBe("");
          expect(line).not.toContain(";");
        }
      }
      expect(c.points.id).toHaveLength(c.points.en.length);
    }
  });
});
