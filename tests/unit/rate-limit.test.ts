import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    review: {
      findFirst,
    },
  },
}));

describe("review rate limit", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when no recent review exists", async () => {
    findFirst.mockResolvedValue(null);
    const { checkReviewRateLimit } = await import("@/lib/moderation/rate-limit");

    await expect(checkReviewRateLimit("user_1")).resolves.toBe(true);
  });

  it("returns false when recent review exists", async () => {
    findFirst.mockResolvedValue({ id: "review_1" });
    const { checkReviewRateLimit } = await import("@/lib/moderation/rate-limit");

    await expect(checkReviewRateLimit("user_1")).resolves.toBe(false);
  });
});
