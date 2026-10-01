import { describe, expect, it } from "vitest";
import { fakeKinds, texts } from "../src/lib/live-text";

const independence = {
  date: "2026-08-17",
  name: "Proklamasi Kemerdekaan",
  nameEn: "Independence Day",
};

describe("live tool text", () => {
  it("summarises skipped days in both languages", () => {
    expect(texts("en").skipped(2, [independence], "en")).toBe(
      "Skips 2 weekend days and 1 holiday: 17 Aug Independence Day.",
    );
    expect(texts("id").skipped(2, [independence], "id")).toBe(
      "Melewati 2 hari akhir pekan dan 1 hari libur: 17 Agu Proklamasi Kemerdekaan.",
    );
    expect(texts("en").skipped(1, [], "en")).toBe("Skips 1 weekend day.");
    expect(texts("en").skipped(0, [], "en")).toBe("No days skipped.");
    expect(texts("id").skipped(0, [], "id")).toBe("Tidak ada hari yang dilewati.");
  });

  it("explains known error codes and falls back for unknown ones", () => {
    expect(texts("en").error("range")).toBe("Outside the supported range.");
    expect(texts("id").error("charset")).toBe("Ada karakter yang tidak diizinkan.");
    expect(texts("en").error("odd")).toBe("Not valid (odd).");
    expect(texts("id").error("odd")).toBe("Tidak valid (odd).");
  });

  it("labels every fake kind", () => {
    for (const kind of fakeKinds) {
      expect(texts("en").fakeKinds[kind]).not.toBe("");
      expect(texts("id").fakeKinds[kind]).not.toBe("");
    }
  });
});
