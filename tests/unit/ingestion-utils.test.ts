import { describe, expect, it } from "vitest";
import {
  isTruthy,
  makeFallbackSourceId,
  normalizeState,
  normalizeText,
  normalizeZip,
  parseOptionalDate,
  parseOptionalNumber,
  slugify,
} from "@/lib/ingestion/utils";

describe("ingestion utils", () => {
  it("normalizes text/state/zip", () => {
    expect(normalizeText("  Little   Oaks ")).toBe("Little Oaks");
    expect(normalizeState(" va ")).toBe("VA");
    expect(normalizeZip(" 12345-6789 ext ")).toBe("12345-6789");
  });

  it("parses optional numbers and dates", () => {
    expect(parseOptionalNumber("4.5")).toBe(4.5);
    expect(parseOptionalNumber("nope")).toBeUndefined();
    expect(parseOptionalDate("2025-01-01")?.toISOString()).toContain("2025-01-01");
    expect(parseOptionalDate("invalid")).toBeUndefined();
  });

  it("parses truthy flags", () => {
    expect(isTruthy("yes")).toBe(true);
    expect(isTruthy("0")).toBe(false);
    expect(isTruthy("maybe")).toBeUndefined();
  });

  it("generates stable fallback IDs and slugs", () => {
    const one = makeFallbackSourceId(["A", "B", "C"]);
    const two = makeFallbackSourceId(["A", "B", "C"]);
    expect(one).toHaveLength(20);
    expect(one).toBe(two);
    expect(slugify("My School @ Main")).toBe("my-school-main");
  });
});
