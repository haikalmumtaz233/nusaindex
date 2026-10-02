import { describe, expect, it } from "vitest";
import { copyright } from "../src/lib/footer";

describe("footer copyright", () => {
  it("names only the holder", () => {
    expect(copyright).toBe("© 2026 Haikal Mumtaz");
  });
});
