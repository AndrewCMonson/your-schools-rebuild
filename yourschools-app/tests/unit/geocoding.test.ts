import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const update = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findMany,
      update,
    },
  },
}));

describe("geocoding helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.GOOGLE_GEOCODING_API_KEY = "test-key";
  });

  it("computes haversine distance", async () => {
    const { haversineMiles } = await import("@/lib/geocoding");
    const miles = haversineMiles(
      { lat: 36.8529, lng: -75.978 },
      { lat: 36.8529, lng: -76.0 },
    );

    expect(miles).toBeGreaterThan(1);
  });

  it("geocodes an address", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 1, lng: 2 } } }],
        }),
      }),
    );

    const { geocodeAddress } = await import("@/lib/geocoding");
    const result = await geocodeAddress("123 Main St");

    expect(result).toEqual({ lat: 1, lng: 2 });
  });

  it("returns null when geocode key is missing", async () => {
    process.env.GOOGLE_GEOCODING_API_KEY = "";
    process.env.GOOGLE_MAPS_API_KEY = "";
    const { geocodeAddress } = await import("@/lib/geocoding");

    const result = await geocodeAddress("123 Main St");
    expect(result).toBeNull();
  });

  it("returns null for non-OK geocode response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ZERO_RESULTS",
          results: [],
        }),
      }),
    );

    const { geocodeAddress } = await import("@/lib/geocoding");
    const result = await geocodeAddress("unknown");
    expect(result).toBeNull();
  });

  it("updates schools missing coordinates", async () => {
    findMany.mockResolvedValue([
      {
        id: "school_1",
        address: "1 Main St",
        city: "City",
        state: "VA",
        zipcode: "12345",
      },
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 10, lng: 11 } } }],
        }),
      }),
    );

    const { updateMissingSchoolCoordinates } = await import("@/lib/geocoding");

    const outcome = await updateMissingSchoolCoordinates(5);

    expect(outcome).toEqual({ checked: 1, updated: 1 });
    expect(update).toHaveBeenCalledWith({
      where: { id: "school_1" },
      data: { lat: 10, lng: 11 },
    });
  });

  it("does not update when geocode fails", async () => {
    findMany.mockResolvedValue([
      {
        id: "school_2",
        address: "2 Main St",
        city: "Town",
        state: "VA",
        zipcode: "22222",
      },
    ]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { updateMissingSchoolCoordinates } = await import("@/lib/geocoding");
    const result = await updateMissingSchoolCoordinates(5);

    expect(result).toEqual({ checked: 1, updated: 0 });
    expect(update).not.toHaveBeenCalled();
  });
});
