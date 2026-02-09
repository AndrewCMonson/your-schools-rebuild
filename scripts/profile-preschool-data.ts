import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type CountRow = { count: number };

type DistRow = {
  key: string;
  count: number;
};

function asInt(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

function pct(n: number, d: number) {
  return d ? `${((n / d) * 100).toFixed(1)}%` : "0.0%";
}

async function main() {
  const [schoolCount, sourceCount, headStartCount, ncesCount] = await Promise.all([
    db.school.count(),
    db.providerSourceRecord.count(),
    db.providerSourceRecord.count({ where: { source: "HEAD_START" } }),
    db.providerSourceRecord.count({ where: { source: "NCES_PK" } }),
  ]);

  const schoolCompleteness = {
    minAge: await db.school.count({ where: { minAge: { not: null } } }),
    maxAge: await db.school.count({ where: { maxAge: { not: null } } }),
    openingHours: await db.school.count({ where: { openingHours: { not: null } } }),
    closingHours: await db.school.count({ where: { closingHours: { not: null } } }),
    minEnrollment: await db.school.count({ where: { minEnrollment: { not: null } } }),
    maxEnrollment: await db.school.count({ where: { maxEnrollment: { not: null } } }),
    minRatio: await db.school.count({ where: { minStudentTeacherRatio: { not: null } } }),
    maxRatio: await db.school.count({ where: { maxStudentTeacherRatio: { not: null } } }),
  };

  const [multiSourceRows] = (await db.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT "schoolId"
      FROM "ProviderSourceRecord"
      WHERE "schoolId" IS NOT NULL
      GROUP BY "schoolId"
      HAVING COUNT(DISTINCT "source") > 1
    ) t
  `) as CountRow[];

  const [headStartFundedSlotsRows] = (await db.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "ProviderSourceRecord"
    WHERE source = 'HEAD_START' AND NULLIF(TRIM(payload->>'funded_slots'),'') IS NOT NULL
  `) as CountRow[];

  const [ncesRatioRows] = (await db.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "ProviderSourceRecord"
    WHERE source = 'NCES_PK' AND NULLIF(TRIM(payload->>'stuteratio'),'') IS NOT NULL
  `) as CountRow[];

  const [ncesPkRows] = (await db.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "ProviderSourceRecord"
    WHERE source = 'NCES_PK' AND COALESCE(NULLIF(TRIM(payload->>'pk'),''),'0') <> '0'
  `) as CountRow[];

  const hsStatus = (await db.$queryRaw`
    SELECT COALESCE(NULLIF(TRIM(payload->>'status'),''),'(null)') AS key, COUNT(*)::int AS count
    FROM "ProviderSourceRecord"
    WHERE source='HEAD_START'
    GROUP BY 1
    ORDER BY 2 DESC
  `) as DistRow[];

  const ncesGradeRanges = (await db.$queryRaw`
    SELECT
      CONCAT(COALESCE(NULLIF(TRIM(payload->>'gslo'),''),'(null)'), ' -> ', COALESCE(NULLIF(TRIM(payload->>'gshi'),''),'(null)')) AS key,
      COUNT(*)::int AS count
    FROM "ProviderSourceRecord"
    WHERE source='NCES_PK'
    GROUP BY 1
    ORDER BY count DESC
    LIMIT 10
  `) as DistRow[];

  const summary = {
    counts: {
      schools: schoolCount,
      providerSourceRecords: sourceCount,
      headStartRecords: headStartCount,
      ncesPkRecords: ncesCount,
      schoolsWithMultipleSources: asInt(multiSourceRows?.count),
    },
    completenessOnSchoolTable: {
      minAge: `${schoolCompleteness.minAge}/${schoolCount} (${pct(schoolCompleteness.minAge, schoolCount)})`,
      maxAge: `${schoolCompleteness.maxAge}/${schoolCount} (${pct(schoolCompleteness.maxAge, schoolCount)})`,
      openingHours: `${schoolCompleteness.openingHours}/${schoolCount} (${pct(schoolCompleteness.openingHours, schoolCount)})`,
      closingHours: `${schoolCompleteness.closingHours}/${schoolCount} (${pct(schoolCompleteness.closingHours, schoolCount)})`,
      minEnrollment: `${schoolCompleteness.minEnrollment}/${schoolCount} (${pct(schoolCompleteness.minEnrollment, schoolCount)})`,
      maxEnrollment: `${schoolCompleteness.maxEnrollment}/${schoolCount} (${pct(schoolCompleteness.maxEnrollment, schoolCount)})`,
      minStudentTeacherRatio: `${schoolCompleteness.minRatio}/${schoolCount} (${pct(schoolCompleteness.minRatio, schoolCount)})`,
      maxStudentTeacherRatio: `${schoolCompleteness.maxRatio}/${schoolCount} (${pct(schoolCompleteness.maxRatio, schoolCount)})`,
    },
    sourceFieldAvailability: {
      headStartFundedSlots: `${asInt(headStartFundedSlotsRows?.count)}/${headStartCount} (${pct(asInt(headStartFundedSlotsRows?.count), headStartCount)})`,
      ncesStudentTeacherRatio: `${asInt(ncesRatioRows?.count)}/${ncesCount} (${pct(asInt(ncesRatioRows?.count), ncesCount)})`,
      ncesPkPositive: `${asInt(ncesPkRows?.count)}/${ncesCount} (${pct(asInt(ncesPkRows?.count), ncesCount)})`,
    },
    distributions: {
      headStartStatus: hsStatus.slice(0, 5),
      ncesTopGradeRanges: ncesGradeRanges,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
