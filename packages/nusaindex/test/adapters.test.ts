import * as v from "valibot";
import { describe, expect, it } from "vitest";
import * as vs from "../src/valibot/index.js";
import * as zs from "../src/zod/index.js";

const FAKE_NIK = "3171014501909999";

const identifiers = [
  ["nik", FAKE_NIK, "3171014501909990x"],
  ["npwp", "01.234.567.8-901.000", "12"],
  ["phone", "0812-0000-0001", "0899"],
  ["nip", "19900105 201503 1 999", "1990"],
  ["nisn", "0109999991", "0000000000"],
  ["plate", "B 1234 XYZ", "XX 1"],
] as const;

describe("zod adapter", () => {
  for (const [name, valid, invalid] of identifiers) {
    it(`validates ${name}`, () => {
      const schema = zs[name]();
      expect(schema.parse(valid)).toBe(valid);
      const failed = schema.safeParse(invalid);
      expect(failed.success).toBe(false);
      const issue = failed.error?.issues[0];
      expect(issue?.message).toMatch(/^Invalid /);
      expect(issue && "params" in issue ? issue.params : undefined).toHaveProperty("nusaindex");
    });
  }

  it("keeps the input out of issues and uses a custom message", () => {
    const failed = zs.nik({ message: "NIK tidak valid" }).safeParse("317101450190999");
    expect(failed.error?.issues[0]?.message).toBe("NIK tidak valid");
    expect(JSON.stringify(failed.error?.issues)).not.toContain("317101450190999");
  });

  it("parses rupiah into a number", () => {
    expect(zs.rupiah().parse("Rp1.500,50")).toBe(1500.5);
    const failed = zs.rupiah().safeParse("1,500.00");
    expect(failed.error?.issues[0]?.message).toBe("Invalid rupiah amount");
  });
});

describe("valibot adapter", () => {
  for (const [name, valid, invalid] of identifiers) {
    it(`validates ${name}`, () => {
      const schema = vs[name]();
      expect(v.parse(schema, valid)).toBe(valid);
      const failed = v.safeParse(schema, invalid);
      expect(failed.success).toBe(false);
      expect(failed.issues?.[0].message).toMatch(/^Invalid /);
    });
  }

  it("uses a custom message", () => {
    const failed = v.safeParse(vs.nisn({ message: "NISN tidak valid" }), "12");
    expect(failed.issues?.[0].message).toBe("NISN tidak valid");
  });

  it("parses rupiah into a number", () => {
    expect(v.parse(vs.rupiah(), "Rp15.000,-")).toBe(15000);
    const failed = v.safeParse(vs.rupiah(), "Rp1.50");
    expect(failed.issues?.[0].message).toBe("Invalid rupiah amount");
  });
});
