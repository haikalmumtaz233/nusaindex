import { describe, expect, it } from "vitest";
import { copyright } from "../src/lib/footer";

describe("footer copyright", () => {
  it("names the holder and the license in indonesian", () => {
    expect(copyright("id")).toBe("© 2026 Haikal Mumtaz. Kode dan data berlisensi MIT.");
  });

  it("names the holder and the license in english", () => {
    expect(copyright("en")).toBe("© 2026 Haikal Mumtaz. Code and data under the MIT License.");
  });
});
