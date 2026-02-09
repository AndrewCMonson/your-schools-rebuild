import { describe, expect, it } from "vitest";
import { claimSchema } from "@/lib/validators/claim";
import { createReviewSchema } from "@/lib/validators/review";
import { haversineMiles } from "@/lib/geocoding";

describe("claim schema", () => {
  it("accepts valid claim payload", () => {
    const parsed = claimSchema.safeParse({
      schoolId: "ckw9x4l1f0000a2v4bn7h3j5m",
      fullName: "Jane Smith",
      workEmail: "jane@school.org",
      phone: "757-555-1212",
      roleTitle: "Director",
      relationship: "I am the current school director and records custodian.",
      schoolDomain: "school.org",
      proof: "I can provide state licensing documents and district onboarding records.",
    });

    expect(parsed.success).toBe(true);
  });
});

describe("review schema", () => {
  it("rejects short review", () => {
    const parsed = createReviewSchema.safeParse({
      schoolId: "ckw9x4l1f0000a2v4bn7h3j5m",
      rating: 4,
      body: "too short",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("distance calculations", () => {
  it("returns near-zero distance for identical points", () => {
    const miles = haversineMiles({ lat: 36.8529, lng: -75.978 }, { lat: 36.8529, lng: -75.978 });
    expect(miles).toBeLessThan(0.01);
  });
});
