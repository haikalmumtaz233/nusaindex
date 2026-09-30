import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  isValidDate,
  isoDate,
  isoMonth,
  parseIsoDate,
} from "../src/internal/dates.js";
import { MAX_INPUT, collect, isAllZero, maskDigits, toInt } from "../src/internal/digits.js";
import { failure, success } from "../src/internal/result.js";

describe("digits", () => {
  it("collects digits and skips separators", () => {
    expect(collect("12 34-5.6", " -.")).toEqual({ status: "ok", digits: "123456" });
    expect(collect("", " ")).toEqual({ status: "ok", digits: "" });
  });

  it("rejects other characters", () => {
    expect(collect("12a", " ")).toEqual({ status: "charset" });
    expect(collect("12 ", " ")).toEqual({ status: "charset" });
  });

  it("limits input length", () => {
    expect(collect("1".repeat(MAX_INPUT), "")).toEqual({
      status: "ok",
      digits: "1".repeat(MAX_INPUT),
    });
    expect(collect("1".repeat(MAX_INPUT + 1), "")).toEqual({ status: "length" });
  });

  it("converts and checks digit strings", () => {
    expect(toInt("0421")).toBe(421);
    expect(isAllZero("000")).toBe(true);
    expect(isAllZero("010")).toBe(false);
  });

  it("masks all but the last digits", () => {
    expect(maskDigits("1234 5678", 4)).toBe("****5678");
    expect(maskDigits("1234", 4)).toBe("****");
    expect(maskDigits("12", 4)).toBe("**");
    expect(maskDigits("abc", 4)).toBe("");
    expect(maskDigits("+62 812-3456", 3)).toBe("******456");
  });
});

describe("dates", () => {
  it("validates calendar dates", () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2023, 2, 29)).toBe(false);
    expect(isValidDate(1900, 2, 29)).toBe(false);
    expect(isValidDate(2000, 2, 29)).toBe(true);
    expect(isValidDate(2025, 4, 31)).toBe(false);
    expect(isValidDate(2025, 13, 1)).toBe(false);
    expect(isValidDate(2025, 0, 1)).toBe(false);
    expect(isValidDate(2025, 1, 0)).toBe(false);
    expect(isValidDate(0, 1, 1)).toBe(false);
    expect(isValidDate(10000, 1, 1)).toBe(false);
    expect(daysInMonth(2025, 12)).toBe(31);
  });

  it("formats ISO dates", () => {
    expect(isoDate(987, 3, 7)).toBe("0987-03-07");
    expect(isoMonth(2024, 11)).toBe("2024-11");
  });

  it("parses strict ISO dates", () => {
    expect(parseIsoDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
    for (const bad of ["2023-02-29", "2024-2-29", "2024/02/29", "2024-0a-29", ""]) {
      expect(parseIsoDate(bad)).toBeUndefined();
    }
  });
});

describe("result", () => {
  it("builds success and failure", () => {
    expect(success(1)).toEqual({ ok: true, value: 1 });
    expect(failure("length")).toEqual({ ok: false, error: { code: "length" } });
  });
});
