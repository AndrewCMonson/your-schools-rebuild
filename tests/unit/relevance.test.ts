import { describe, expect, it } from "vitest";
import { calculateSchoolRelevance } from "@/lib/search/relevance";

describe("search relevance scoring", () => {
  it("prioritizes exact name matches", () => {
    const exact = calculateSchoolRelevance({
      schoolName: "Harbor Bloom Academy",
      city: "Virginia Beach",
      zipcode: "23451",
      averageRating: 4.5,
      isVerified: true,
      q: "Harbor Bloom Academy",
    });

    const partial = calculateSchoolRelevance({
      schoolName: "Harbor Bloom Academy",
      city: "Virginia Beach",
      zipcode: "23451",
      averageRating: 4.5,
      isVerified: true,
      q: "Harbor",
    });

    expect(exact).toBeGreaterThan(partial);
  });

  it("rewards zipcode and town relevance", () => {
    const matched = calculateSchoolRelevance({
      schoolName: "Little Oaks Cooperative School",
      city: "Chesapeake",
      zipcode: "23320",
      averageRating: 3.8,
      isVerified: false,
      town: "Chesapeake",
      zipcodeFilter: "23320",
    });

    const unmatched = calculateSchoolRelevance({
      schoolName: "Little Oaks Cooperative School",
      city: "Chesapeake",
      zipcode: "23320",
      averageRating: 3.8,
      isVerified: false,
      town: "Norfolk",
      zipcodeFilter: "99999",
    });

    expect(matched).toBeGreaterThan(unmatched);
  });

  it("adds prefix and contains scoring branches", () => {
    const prefixName = calculateSchoolRelevance({
      schoolName: "Northlight Montessori House",
      city: "Norfolk",
      zipcode: "23502",
      averageRating: 4.1,
      isVerified: false,
      q: "north",
    });

    const containsName = calculateSchoolRelevance({
      schoolName: "Northlight Montessori House",
      city: "Norfolk",
      zipcode: "23502",
      averageRating: 4.1,
      isVerified: false,
      q: "tessori",
    });

    expect(prefixName).toBeGreaterThan(containsName);
  });

  it("scores zipcode prefixes and city contains matches", () => {
    const cityContains = calculateSchoolRelevance({
      schoolName: "Harbor Bloom Academy",
      city: "Virginia Beach",
      zipcode: "23451",
      averageRating: 4.7,
      isVerified: true,
      q: "beach",
      zipcodeFilter: "234",
    });

    const lowSignal = calculateSchoolRelevance({
      schoolName: "Harbor Bloom Academy",
      city: "Virginia Beach",
      zipcode: "23451",
      averageRating: 4.7,
      isVerified: false,
      q: "unknown",
      zipcodeFilter: "999",
    });

    expect(cityContains).toBeGreaterThan(lowSignal);
  });

  it("covers zipcode-prefix and town-contains branches", () => {
    const prefixZipAndTownContains = calculateSchoolRelevance({
      schoolName: "Lakeview School",
      city: "West Norfolk",
      zipcode: "23502",
      averageRating: null,
      isVerified: false,
      q: "235",
      town: "folk",
    });

    const baseline = calculateSchoolRelevance({
      schoolName: "Lakeview School",
      city: "West Norfolk",
      zipcode: "23502",
      averageRating: null,
      isVerified: false,
      q: "zzz",
      town: "abc",
    });

    expect(prefixZipAndTownContains).toBeGreaterThan(baseline);
  });
});
