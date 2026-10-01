import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { levelCounts } from "../src/lib/stats";

describe("levelCounts", () => {
  it("counts regions by the length of their code", () => {
    const csv =
      "code,name\n11,Aceh\n11.01,Kab\n11.01.01,Kec\n11.01.01.2001,Desa\n11.01.01.2002,Desa\n";
    expect(levelCounts(csv)).toEqual({ province: 1, regency: 1, district: 1, village: 2 });
  });

  it("matches the published totals of the bundled data", () => {
    const csv = readFileSync(new URL("../../data/regions.csv", import.meta.url), "utf8");
    expect(levelCounts(csv)).toEqual({
      province: 38,
      regency: 514,
      district: 7285,
      village: 83762,
    });
  });
});
