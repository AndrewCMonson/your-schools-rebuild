import {
  DataConfidence,
  IngestionRunStatus,
  IngestionSource,
  MergeMatchMethod,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import type { CsvAdapter, IngestionResult, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import { slugify, stableHash } from "@/lib/ingestion/utils";

function schoolAddressMatch(record: NormalizedPreschoolRecord) {
  return {
    name: { equals: record.name, mode: Prisma.QueryMode.insensitive },
    address: { equals: record.address, mode: Prisma.QueryMode.insensitive },
    city: { equals: record.city, mode: Prisma.QueryMode.insensitive },
    state: { equals: record.state, mode: Prisma.QueryMode.insensitive },
    zipcode: record.zipcode,
  };
}

function sanitizeSlugCandidate(record: NormalizedPreschoolRecord) {
  const base = slugify(`${record.name} ${record.city} ${record.state}`);
  return base || `school-${Date.now()}`;
}

async function reserveUniqueSlug(baseSlug: string) {
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db.school.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

type MatchedSchool = {
  schoolId?: string;
  matchMethod: MergeMatchMethod;
  matchConfidence: number;
};

function confidenceRank(confidence: DataConfidence | undefined) {
  if (confidence === DataConfidence.HIGH) return 4;
  if (confidence === DataConfidence.MEDIUM) return 3;
  if (confidence === DataConfidence.LOW) return 2;
  return 1;
}

async function findSchoolForRecord(record: NormalizedPreschoolRecord): Promise<MatchedSchool> {
  const existingSource = await db.providerSourceRecord.findUnique({
    where: {
      source_sourceRecordId: {
        source: record.source,
        sourceRecordId: record.sourceRecordId,
      },
    },
    select: { schoolId: true },
  });

  if (existingSource?.schoolId) {
    const linked = await db.school.findUnique({
      where: { id: existingSource.schoolId },
      select: { id: true },
    });
    if (linked?.id) {
      return {
        schoolId: linked.id,
        matchMethod: MergeMatchMethod.SOURCE_ID,
        matchConfidence: 1,
      };
    }
  }

  if (record.licenseNumber) {
    const licenseMatch = await db.license.findUnique({
      where: {
        state_licenseNumber: {
          state: record.state,
          licenseNumber: record.licenseNumber,
        },
      },
      select: { schoolId: true },
    });

    if (licenseMatch?.schoolId) {
      const linked = await db.school.findUnique({
        where: { id: licenseMatch.schoolId },
        select: { id: true },
      });
      if (linked?.id) {
        return {
          schoolId: linked.id,
          matchMethod: MergeMatchMethod.LICENSE,
          matchConfidence: 0.95,
        };
      }
    }
  }

  const byNameAddress = await db.school.findFirst({
    where: schoolAddressMatch(record),
    select: { id: true },
  });
  if (byNameAddress?.id) {
    return {
      schoolId: byNameAddress.id,
      matchMethod: MergeMatchMethod.NAME_ADDRESS,
      matchConfidence: 0.85,
    };
  }

  return {
    matchMethod: MergeMatchMethod.NEW,
    matchConfidence: 0.7,
  };
}

function schoolUpsertData(record: NormalizedPreschoolRecord) {
  return {
    name: record.name,
    address: record.address,
    city: record.city,
    state: record.state,
    zipcode: record.zipcode,
    lat: record.lat,
    lng: record.lng,
    phone: record.phone,
    website: record.website,
    email: record.email,
    description: record.description,
    minAge: record.minAge,
    maxAge: record.maxAge,
    preschoolEnrollmentCount: record.preschoolEnrollmentCount,
    schoolWideEnrollment: record.schoolWideEnrollment,
    schoolWideStudentTeacherRatio: record.schoolWideStudentTeacherRatio,
    openingHours: record.openingHours,
    closingHours: record.closingHours,
    offersDaycare: record.offersDaycare ?? false,
    websiteDataConfidence: record.website ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    websiteDataSource: record.website ? `${record.source}.website` : undefined,
    websiteLastVerifiedAt: record.website ? new Date() : undefined,
    ageDataConfidence: record.ageConfidence ?? DataConfidence.UNKNOWN,
    hoursDataConfidence: record.hoursConfidence ?? DataConfidence.UNKNOWN,
    enrollmentDataConfidence: record.enrollmentConfidence ?? DataConfidence.UNKNOWN,
    ratioDataConfidence: record.ratioConfidence ?? DataConfidence.UNKNOWN,
    ageDataSource: record.ageSource,
    hoursDataSource: record.hoursSource,
    enrollmentDataSource: record.enrollmentSource,
    ratioDataSource: record.ratioSource,
    dataLastNormalizedAt: new Date(),
    earlyEnrollment: true,
    daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    daysClosed: ["Saturday", "Sunday"],
  };
}

async function upsertOneRecord(record: NormalizedPreschoolRecord) {
  const schoolMatch = await findSchoolForRecord(record);
  let schoolId = schoolMatch.schoolId;

  if (!schoolId) {
    const slug = await reserveUniqueSlug(sanitizeSlugCandidate(record));
    const created = await db.school.create({
      data: {
        slug,
        ...schoolUpsertData(record),
      },
      select: { id: true },
    });
    schoolId = created.id;
  } else {
    const existing = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        ageDataConfidence: true,
        hoursDataConfidence: true,
        enrollmentDataConfidence: true,
        ratioDataConfidence: true,
        websiteDataConfidence: true,
      },
    });
    const normalized = schoolUpsertData(record);

    await db.school.update({
      where: { id: schoolId },
      data: {
        ...normalized,
        ageDataConfidence:
          existing && confidenceRank(existing.ageDataConfidence) > confidenceRank(normalized.ageDataConfidence)
            ? existing.ageDataConfidence
            : normalized.ageDataConfidence,
        hoursDataConfidence:
          existing && confidenceRank(existing.hoursDataConfidence) > confidenceRank(normalized.hoursDataConfidence)
            ? existing.hoursDataConfidence
            : normalized.hoursDataConfidence,
        enrollmentDataConfidence:
          existing &&
          confidenceRank(existing.enrollmentDataConfidence) > confidenceRank(normalized.enrollmentDataConfidence)
            ? existing.enrollmentDataConfidence
            : normalized.enrollmentDataConfidence,
        ratioDataConfidence:
          existing && confidenceRank(existing.ratioDataConfidence) > confidenceRank(normalized.ratioDataConfidence)
            ? existing.ratioDataConfidence
            : normalized.ratioDataConfidence,
        websiteDataConfidence:
          existing &&
          confidenceRank(existing.websiteDataConfidence) > confidenceRank(normalized.websiteDataConfidence)
            ? existing.websiteDataConfidence
            : normalized.websiteDataConfidence,
      },
    });
  }

  const checksum = stableHash(JSON.stringify(record.raw));

  await db.providerSourceRecord.upsert({
    where: {
      source_sourceRecordId: {
        source: record.source,
        sourceRecordId: record.sourceRecordId,
      },
    },
    create: {
      source: record.source,
      sourceRecordId: record.sourceRecordId,
      schoolId,
      state: record.state,
      licenseNumber: record.licenseNumber,
      matchMethod: schoolMatch.matchMethod,
      matchConfidence: schoolMatch.matchConfidence,
      payload: record.raw as Prisma.InputJsonValue,
      checksum,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      isActive: true,
    },
    update: {
      schoolId,
      state: record.state,
      licenseNumber: record.licenseNumber,
      matchMethod: schoolMatch.matchMethod,
      matchConfidence: schoolMatch.matchConfidence,
      payload: record.raw as Prisma.InputJsonValue,
      checksum,
      lastSeenAt: new Date(),
      isActive: true,
    },
  });

  if (record.licenseNumber) {
    await db.license.upsert({
      where: {
        state_licenseNumber: {
          state: record.state,
          licenseNumber: record.licenseNumber,
        },
      },
      create: {
        schoolId,
        state: record.state,
        licenseNumber: record.licenseNumber,
        status: record.licenseStatus,
        issuingAgency: record.issuingAgency,
        effectiveDate: record.effectiveDate,
        expiresDate: record.expiresDate,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        schoolId,
        status: record.licenseStatus,
        issuingAgency: record.issuingAgency,
        effectiveDate: record.effectiveDate,
        expiresDate: record.expiresDate,
        lastSeenAt: new Date(),
      },
    });
  }
}

export async function runAdapter(adapter: CsvAdapter): Promise<IngestionResult> {
  const run = await db.ingestionRun.create({
    data: {
      source: adapter.source,
      status: IngestionRunStatus.RUNNING,
      recordsSeen: 0,
      recordsUpserted: 0,
      recordsSkipped: 0,
      metadata: {},
    },
  });

  let recordsSeen = 0;
  let recordsUpserted = 0;
  let recordsSkipped = 0;

  try {
    const records = await adapter.loadRecords();

    for (const record of records) {
      recordsSeen += 1;
      try {
        await upsertOneRecord(record);
        recordsUpserted += 1;
      } catch (error) {
        recordsSkipped += 1;
        await db.ingestionError.create({
          data: {
            runId: run.id,
            recordKey: `${record.source}:${record.sourceRecordId}`,
            message: "Failed to ingest record",
            details: {
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        });
      }
    }

    await db.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: IngestionRunStatus.SUCCEEDED,
        recordsSeen,
        recordsUpserted,
        recordsSkipped,
        completedAt: new Date(),
      },
    });

    return {
      runId: run.id,
      source: adapter.source,
      status: "SUCCEEDED",
      recordsSeen,
      recordsUpserted,
      recordsSkipped,
    };
  } catch (error) {
    await db.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: IngestionRunStatus.FAILED,
        recordsSeen,
        recordsUpserted,
        recordsSkipped,
        completedAt: new Date(),
        metadata: {
          fatalError: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    return {
      runId: run.id,
      source: adapter.source,
      status: "FAILED",
      recordsSeen,
      recordsUpserted,
      recordsSkipped,
    };
  }
}

export async function runSelectedSources(sources: IngestionSource[]) {
  const { headStartAdapter } = await import("@/lib/ingestion/adapters/head-start");
  const { ncesPkAdapter } = await import("@/lib/ingestion/adapters/nces-pk");
  const { vaLicenseAdapter } = await import("@/lib/ingestion/adapters/va-license");
  const { flLicenseAdapter } = await import("@/lib/ingestion/adapters/fl-license");
  const { txLicenseAdapter } = await import("@/lib/ingestion/adapters/tx-license");

  const adapters: Record<IngestionSource, CsvAdapter> = {
    [IngestionSource.HEAD_START]: headStartAdapter,
    [IngestionSource.NCES_PK]: ncesPkAdapter,
    [IngestionSource.VA_LICENSE]: vaLicenseAdapter,
    [IngestionSource.FL_LICENSE]: flLicenseAdapter,
    [IngestionSource.TX_LICENSE]: txLicenseAdapter,
  };

  const results: IngestionResult[] = [];
  for (const source of sources) {
    const adapter = adapters[source];
    if (!adapter) {
      continue;
    }
    results.push(await runAdapter(adapter));
  }

  return results;
}
