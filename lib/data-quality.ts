import { DataConfidence, IngestionSource } from "@prisma/client";
import { db } from "@/lib/db";

export const COVERAGE_FIELDS = ["age", "hours", "enrollment", "ratio", "website"] as const;

type CountRow = { count: number };

function confidenceRank(confidence: DataConfidence | null | undefined) {
  if (confidence === "HIGH") return 4;
  if (confidence === "MEDIUM") return 3;
  if (confidence === "LOW") return 2;
  return 1;
}

export function meetsConfidenceThreshold(
  confidence: DataConfidence | null | undefined,
  threshold: DataConfidence,
) {
  return confidenceRank(confidence) >= confidenceRank(threshold);
}

export function formatCoverage(populated: number, total: number) {
  const percent = total > 0 ? ((populated / total) * 100).toFixed(1) : "0.0";
  return `${populated}/${total} (${percent}%)`;
}

function asInt(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

async function computeSchoolLevelCoverage() {
  const total = await db.school.count();

  const [ageRows, hoursRows, enrollmentRows, ratioRows, websiteRows] = await Promise.all([
    db.school.count({ where: { minAge: { not: null }, maxAge: { not: null } } }),
    db.school.count({ where: { openingHours: { not: null }, closingHours: { not: null } } }),
    db.school.count({
      where: {
        OR: [
          { minEnrollment: { not: null } },
          { maxEnrollment: { not: null } },
          { preschoolEnrollmentCount: { not: null } },
          { schoolWideEnrollment: { not: null } },
        ],
      },
    }),
    db.school.count({
      where: {
        OR: [
          { minStudentTeacherRatio: { not: null } },
          { maxStudentTeacherRatio: { not: null } },
          { schoolWideStudentTeacherRatio: { not: null } },
        ],
      },
    }),
    db.school.count({ where: { website: { not: null } } }),
  ]);

  const [ageHigh, hoursHigh, enrollmentHigh, ratioHigh, websiteHigh] = await Promise.all([
    db.school.count({ where: { ageDataConfidence: { in: ["HIGH", "MEDIUM"] } } }),
    db.school.count({ where: { hoursDataConfidence: "HIGH" } }),
    db.school.count({ where: { enrollmentDataConfidence: { in: ["HIGH", "MEDIUM"] } } }),
    db.school.count({ where: { ratioDataConfidence: "HIGH" } }),
    db.school.count({ where: { websiteDataConfidence: { in: ["HIGH", "MEDIUM"] } } }),
  ]);

  return [
    { fieldKey: "age", scope: "school", totalCount: total, populatedCount: ageRows, highConfidenceCount: ageHigh },
    {
      fieldKey: "hours",
      scope: "school",
      totalCount: total,
      populatedCount: hoursRows,
      highConfidenceCount: hoursHigh,
    },
    {
      fieldKey: "enrollment",
      scope: "school",
      totalCount: total,
      populatedCount: enrollmentRows,
      highConfidenceCount: enrollmentHigh,
    },
    {
      fieldKey: "ratio",
      scope: "school",
      totalCount: total,
      populatedCount: ratioRows,
      highConfidenceCount: ratioHigh,
    },
    {
      fieldKey: "website",
      scope: "school",
      totalCount: total,
      populatedCount: websiteRows,
      highConfidenceCount: websiteHigh,
    },
  ];
}

async function computeSourceCoverage() {
  const [headStartTotalRows, ncesTotalRows, hsEnrollmentRows, ncesEnrollmentRows, ncesRatioRows] = (await Promise.all(
    [
      db.$queryRaw`SELECT COUNT(*)::int AS count FROM "ProviderSourceRecord" WHERE source = 'HEAD_START'`,
      db.$queryRaw`SELECT COUNT(*)::int AS count FROM "ProviderSourceRecord" WHERE source = 'NCES_PK'`,
      db.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "ProviderSourceRecord"
        WHERE source = 'HEAD_START' AND NULLIF(TRIM(payload->>'funded_slots'),'') IS NOT NULL
      `,
      db.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "ProviderSourceRecord"
        WHERE source = 'NCES_PK' AND NULLIF(TRIM(payload->>'pk'),'') IS NOT NULL
      `,
      db.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "ProviderSourceRecord"
        WHERE source = 'NCES_PK' AND NULLIF(TRIM(payload->>'stuteratio'),'') IS NOT NULL
      `,
    ],
  )) as [CountRow[], CountRow[], CountRow[], CountRow[], CountRow[]];

  const headStartTotal = asInt(headStartTotalRows[0]?.count);
  const ncesTotal = asInt(ncesTotalRows[0]?.count);
  const hsEnrollment = asInt(hsEnrollmentRows[0]?.count);
  const ncesEnrollment = asInt(ncesEnrollmentRows[0]?.count);
  const ncesRatio = asInt(ncesRatioRows[0]?.count);
  const sources = [
    IngestionSource.HEAD_START,
    IngestionSource.NCES_PK,
    IngestionSource.VA_LICENSE,
    IngestionSource.FL_LICENSE,
    IngestionSource.TX_LICENSE,
  ];
  const websiteRowsBySource = await Promise.all(
    sources.map(async (source) => {
      const totalRows = (await db.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS count FROM "ProviderSourceRecord" WHERE source = '${source}'`,
      )) as CountRow[];
      const populatedRows = (await db.$queryRawUnsafe(
        `
          SELECT COUNT(*)::int AS count
          FROM "ProviderSourceRecord"
          WHERE source = '${source}'
            AND (
              payload ? 'website' OR
              payload ? 'web_url' OR
              payload ? 'url' OR
              payload ? 'school_url' OR
              payload ? 'providerWebsite' OR
              payload ? 'providerUrl'
            )
        `,
      )) as CountRow[];

      return {
        fieldKey: "website",
        scope: "source",
        source,
        totalCount: asInt(totalRows[0]?.count),
        populatedCount: asInt(populatedRows[0]?.count),
        highConfidenceCount: 0,
      };
    }),
  );

  return [
    {
      fieldKey: "enrollment",
      scope: "source",
      source: "HEAD_START",
      totalCount: headStartTotal,
      populatedCount: hsEnrollment,
      highConfidenceCount: hsEnrollment,
    },
    {
      fieldKey: "enrollment",
      scope: "source",
      source: "NCES_PK",
      totalCount: ncesTotal,
      populatedCount: ncesEnrollment,
      highConfidenceCount: ncesEnrollment,
    },
    {
      fieldKey: "ratio",
      scope: "source",
      source: "NCES_PK",
      totalCount: ncesTotal,
      populatedCount: ncesRatio,
      highConfidenceCount: 0,
    },
    ...websiteRowsBySource,
  ];
}

export async function rebuildCoverageSnapshot() {
  const capturedAt = new Date();
  const rows = [...(await computeSchoolLevelCoverage()), ...(await computeSourceCoverage())];

  await db.dataCoverageSnapshot.createMany({
    data: rows.map((row) => ({
      ...row,
      capturedAt,
    })),
  });

  return { capturedAt, rowCount: rows.length };
}

export async function getLatestCoverageSnapshot() {
  const latest = await db.dataCoverageSnapshot.findFirst({
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });

  if (!latest) return null;

  const rows = await db.dataCoverageSnapshot.findMany({
    where: { capturedAt: latest.capturedAt },
    orderBy: [{ scope: "asc" }, { fieldKey: "asc" }, { source: "asc" }],
  });

  return {
    capturedAt: latest.capturedAt,
    rows,
  };
}

export async function getDedupeSummary() {
  const total = await db.providerSourceRecord.count();
  const [sourceId, license, nameAddress, created] = await Promise.all([
    db.providerSourceRecord.count({ where: { matchMethod: "SOURCE_ID" } }),
    db.providerSourceRecord.count({ where: { matchMethod: "LICENSE" } }),
    db.providerSourceRecord.count({ where: { matchMethod: "NAME_ADDRESS" } }),
    db.providerSourceRecord.count({ where: { matchMethod: "NEW" } }),
  ]);

  return {
    total,
    sourceId,
    license,
    nameAddress,
    created,
  };
}

export function confidenceLabel(value: DataConfidence | null | undefined) {
  return value ?? "UNKNOWN";
}
