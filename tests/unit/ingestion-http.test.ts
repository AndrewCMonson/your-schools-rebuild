import { describe, expect, it, vi } from "vitest";
import { fetchRemoteText } from "@/lib/ingestion/http";

describe("ingestion http", () => {
  it("returns response text for successful requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "name,city\nLittle Oaks,Norfolk",
      }),
    );

    const text = await fetchRemoteText("https://example.com/data.csv");
    expect(text).toContain("Little Oaks");
  });

  it("throws for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    );

    await expect(fetchRemoteText("https://example.com/data.csv")).rejects.toThrow(
      "Failed to fetch source data",
    );
  });

  it("retries transient fetch failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError("fetch failed"))
        .mockResolvedValue({
          ok: true,
          text: async () => "ok",
        }),
    );

    const text = await fetchRemoteText("https://example.com/data.csv");
    expect(text).toBe("ok");
  });
});
