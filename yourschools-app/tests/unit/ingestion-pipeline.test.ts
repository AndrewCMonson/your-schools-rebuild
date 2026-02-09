import { beforeEach, describe, expect, it, vi } from "vitest";
import { IngestionSource } from "@prisma/client";

const ingestionRunCreate = vi.fn();
const ingestionRunUpdate = vi.fn();
const ingestionErrorCreate = vi.fn();
const providerSourceRecordFindUnique = vi.fn();
const providerSourceRecordUpsert = vi.fn();
const licenseFindUnique = vi.fn();
const licenseUpsert = vi.fn();
const schoolFindUnique = vi.fn();
const schoolFindFirst = vi.fn();
const schoolCreate = vi.fn();
const schoolUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    ingestionRun: {
      create: ingestionRunCreate,
      update: ingestionRunUpdate,
    },
    ingestionError: {
      create: ingestionErrorCreate,
    },
    providerSourceRecord: {
      findUnique: providerSourceRecordFindUnique,
      upsert: providerSourceRecordUpsert,
    },
    license: {
      findUnique: licenseFindUnique,
      upsert: licenseUpsert,
    },
    school: {
      findUnique: schoolFindUnique,
      findFirst: schoolFindFirst,
      create: schoolCreate,
      update: schoolUpdate,
    },
  },
}));

describe("ingestion pipeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ingestionRunCreate.mockResolvedValue({ id: "run_1" });
    ingestionRunUpdate.mockResolvedValue({});
    providerSourceRecordFindUnique.mockResolvedValue(null);
    licenseFindUnique.mockResolvedValue(null);
    schoolFindFirst.mockResolvedValue(null);
    schoolFindUnique.mockResolvedValue(null);
    schoolCreate.mockResolvedValue({ id: "school_1" });
    providerSourceRecordUpsert.mockResolvedValue({});
    licenseUpsert.mockResolvedValue({});
    schoolUpdate.mockResolvedValue({});
    ingestionErrorCreate.mockResolvedValue({});
  });

  it("creates a run and ingests records", async () => {
    const { runAdapter } = await import("@/lib/ingestion/pipeline");

    const result = await runAdapter({
      source: IngestionSource.HEAD_START,
      loadRecords: async () => [
        {
          source: IngestionSource.HEAD_START,
          sourceRecordId: "abc-1",
          name: "Little Oaks",
          address: "1 Main St",
          city: "Norfolk",
          state: "VA",
          zipcode: "23502",
          licenseNumber: "LIC-123",
          raw: { id: "abc-1" },
        },
      ],
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(result.recordsUpserted).toBe(1);
    expect(schoolCreate).toHaveBeenCalledTimes(1);
    expect(licenseUpsert).toHaveBeenCalledTimes(1);
    expect(ingestionRunUpdate).toHaveBeenCalled();
  });

  it("updates an existing school when source mapping already exists", async () => {
    providerSourceRecordFindUnique.mockResolvedValueOnce({ schoolId: "school_existing" });
    schoolFindUnique.mockResolvedValueOnce({ id: "school_existing" });

    const { runAdapter } = await import("@/lib/ingestion/pipeline");
    const result = await runAdapter({
      source: IngestionSource.HEAD_START,
      loadRecords: async () => [
        {
          source: IngestionSource.HEAD_START,
          sourceRecordId: "existing-1",
          name: "Existing School",
          address: "1 Main St",
          city: "Norfolk",
          state: "VA",
          zipcode: "23502",
          raw: { id: "existing-1" },
        },
      ],
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(schoolUpdate).toHaveBeenCalledTimes(1);
    expect(schoolCreate).not.toHaveBeenCalled();
    expect(licenseUpsert).not.toHaveBeenCalled();
  });

  it("links by license when source mapping is missing", async () => {
    licenseFindUnique.mockResolvedValueOnce({ schoolId: "school_by_license" });
    schoolFindUnique.mockResolvedValueOnce({ id: "school_by_license" });

    const { runAdapter } = await import("@/lib/ingestion/pipeline");
    await runAdapter({
      source: IngestionSource.HEAD_START,
      loadRecords: async () => [
        {
          source: IngestionSource.HEAD_START,
          sourceRecordId: "license-1",
          name: "Licensed School",
          address: "1 Main St",
          city: "Norfolk",
          state: "VA",
          zipcode: "23502",
          licenseNumber: "LIC-456",
          raw: { id: "license-1" },
        },
      ],
    });

    expect(schoolUpdate).toHaveBeenCalledTimes(1);
    expect(schoolFindFirst).not.toHaveBeenCalled();
  });

  it("records row-level errors and continues", async () => {
    schoolCreate.mockRejectedValueOnce(new Error("write failed"));

    const { runAdapter } = await import("@/lib/ingestion/pipeline");
    const result = await runAdapter({
      source: IngestionSource.HEAD_START,
      loadRecords: async () => [
        {
          source: IngestionSource.HEAD_START,
          sourceRecordId: "bad-1",
          name: "Bad School",
          address: "1 Main St",
          city: "Norfolk",
          state: "VA",
          zipcode: "23502",
          raw: { id: "bad-1" },
        },
      ],
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(result.recordsSkipped).toBe(1);
    expect(ingestionErrorCreate).toHaveBeenCalledTimes(1);
  });

  it("falls back to date-based slug when slugify yields empty value", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1735689600000);

    const { runAdapter } = await import("@/lib/ingestion/pipeline");
    await runAdapter({
      source: IngestionSource.NCES_PK,
      loadRecords: async () => [
        {
          source: IngestionSource.NCES_PK,
          sourceRecordId: "slug-1",
          name: "!!!",
          address: "1 Main St",
          city: "###",
          state: "",
          zipcode: "23502",
          raw: { id: "slug-1" },
        },
      ],
    });

    expect(schoolCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "school-1735689600000" }),
      }),
    );
    vi.restoreAllMocks();
  });

  it("marks run failed when adapter crashes", async () => {
    const { runAdapter } = await import("@/lib/ingestion/pipeline");

    const result = await runAdapter({
      source: IngestionSource.NCES_PK,
      loadRecords: async () => {
        throw new Error("downstream failure");
      },
    });

    expect(result.status).toBe("FAILED");
    expect(result.recordsSeen).toBe(0);
    expect(ingestionRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "run_1" },
      }),
    );
  });
});
