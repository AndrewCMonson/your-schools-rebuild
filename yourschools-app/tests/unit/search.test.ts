import { describe, expect, it } from "vitest";
import { buildSearchTerm, normalizeQuery } from "@/lib/search/query";
import { hasProfanity } from "@/lib/moderation/profanity";

describe("search helpers", () => {
  it("builds combined search term", () => {
    const term = buildSearchTerm({
      q: "montessori",
      zipcode: "23451",
      town: "Virginia Beach",
    });

    expect(term).toBe("montessori 23451 Virginia Beach");
  });

  it("normalizes query", () => {
    expect(normalizeQuery("  North Light   School ")).toBe("north light school");
  });
});

describe("moderation", () => {
  it("detects profanity", () => {
    expect(hasProfanity("This school is shit")).toBe(true);
  });

  it("allows clean text", () => {
    expect(hasProfanity("The staff communication is clear and helpful")).toBe(false);
  });
});
