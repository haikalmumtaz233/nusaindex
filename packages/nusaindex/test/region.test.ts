import { describe, expect, it } from "vitest";
import { children, get, search } from "../src/region/index.js";

describe("region", () => {
  it("lists all 38 provinces in code order", async () => {
    const provinces = await children();
    expect(provinces.ok && provinces.value.length).toBe(38);
    expect(provinces.ok && [provinces.value[0]?.code, provinces.value[37]?.code]).toEqual([
      "11",
      "96",
    ]);
  });

  it("reports the level of every code size", async () => {
    const levels = await Promise.all(
      ["11", "11.01", "11.01.01", "11.01.01.2001"].map(async (code) => {
        const r = await get(code);
        return r.ok ? r.value.level : r.error.code;
      }),
    );
    expect(levels).toEqual(["province", "regency", "district", "village"]);
  });

  it("searches villages within a district", async () => {
    const found = await search("keude", { level: "village", within: "11.01.01", limit: 100 });
    expect(found.ok && found.value.map((r) => r.code)).toEqual(["11.01.01.2001"]);
  });

  it("rejects a fractional limit and an inherited level name", async () => {
    expect(await search("a", { limit: 1.5 })).toEqual({ ok: false, error: { code: "options" } });
    const level: unknown = "toString";
    expect(await search("a", JSON.parse(JSON.stringify({ level })) as object)).toEqual({
      ok: false,
      error: { code: "options" },
    });
  });
});
