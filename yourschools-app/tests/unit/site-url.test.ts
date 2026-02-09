import { describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

function withEnv(next: Record<string, string | undefined>, fn: () => void) {
  const prev = { ...process.env };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  try {
    fn();
  } finally {
    process.env = prev;
  }
}

describe("getSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when provided", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: "https://example.com", SITE_URL: undefined, NEXTAUTH_URL: undefined, VERCEL_URL: undefined }, () => {
      expect(getSiteUrl().origin).toBe("https://example.com");
    });
  });

  it("normalizes URLs without protocol", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: "example.com", SITE_URL: undefined, NEXTAUTH_URL: undefined, VERCEL_URL: undefined }, () => {
      expect(getSiteUrl().origin).toBe("https://example.com");
    });
  });

  it("falls back to VERCEL_URL when explicit URL missing", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: undefined, SITE_URL: undefined, NEXTAUTH_URL: undefined, VERCEL_URL: "preview.example.com" }, () => {
      expect(getSiteUrl().origin).toBe("https://preview.example.com");
    });
  });

  it("falls back to localhost during development", () => {
    withEnv({ NEXT_PUBLIC_SITE_URL: undefined, SITE_URL: undefined, NEXTAUTH_URL: undefined, VERCEL_URL: undefined }, () => {
      expect(getSiteUrl().origin).toBe("http://localhost:3000");
    });
  });
});

