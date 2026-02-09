import { describe, expect, it } from "vitest";
import { slugifySegment, slugToWords, titleCaseWords } from "@/lib/location-slugs";

describe("location slug helpers", () => {
  it("slugifies mixed text into URL-safe segments", () => {
    expect(slugifySegment("Virginia Beach, VA")).toBe("virginia-beach-va");
    expect(slugifySegment("  St. Louis  ")).toBe("st-louis");
  });

  it("converts slug segments back to spaced words", () => {
    expect(slugToWords("virginia-beach")).toBe("virginia beach");
  });

  it("title-cases word strings", () => {
    expect(titleCaseWords("virginia beach")).toBe("Virginia Beach");
  });
});
