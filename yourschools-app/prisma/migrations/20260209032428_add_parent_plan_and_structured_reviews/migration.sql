-- CreateEnum
CREATE TYPE "ParentPlanStatus" AS ENUM ('SAVED', 'TOUR_REQUESTED', 'CONTACTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "DataConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MergeMatchMethod" AS ENUM ('SOURCE_ID', 'LICENSE', 'NAME_ADDRESS', 'NEW');

-- AlterTable
ALTER TABLE "ProviderSourceRecord" ADD COLUMN     "matchConfidence" DOUBLE PRECISION,
ADD COLUMN     "matchMethod" "MergeMatchMethod" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "attendanceMonths" INTEGER,
ADD COLUMN     "childAgeYears" INTEGER,
ADD COLUMN     "cons" TEXT,
ADD COLUMN     "pros" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "ageDataConfidence" "DataConfidence" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "ageDataSource" TEXT,
ADD COLUMN     "dataLastNormalizedAt" TIMESTAMP(3),
ADD COLUMN     "enrollmentDataConfidence" "DataConfidence" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "enrollmentDataSource" TEXT,
ADD COLUMN     "hoursDataConfidence" "DataConfidence" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "hoursDataSource" TEXT,
ADD COLUMN     "preschoolEnrollmentCount" INTEGER,
ADD COLUMN     "ratioDataConfidence" "DataConfidence" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "ratioDataSource" TEXT,
ADD COLUMN     "schoolWideEnrollment" INTEGER,
ADD COLUMN     "schoolWideStudentTeacherRatio" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "DataCoverageSnapshot" (
    "id" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "source" "IngestionSource",
    "totalCount" INTEGER NOT NULL,
    "populatedCount" INTEGER NOT NULL,
    "highConfidenceCount" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataCoverageSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentPlanItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "status" "ParentPlanStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "remindAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataCoverageSnapshot_capturedAt_idx" ON "DataCoverageSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "DataCoverageSnapshot_fieldKey_scope_source_idx" ON "DataCoverageSnapshot"("fieldKey", "scope", "source");

-- CreateIndex
CREATE INDEX "ParentPlanItem_userId_status_updatedAt_idx" ON "ParentPlanItem"("userId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ParentPlanItem_userId_schoolId_key" ON "ParentPlanItem"("userId", "schoolId");

-- CreateIndex
CREATE INDEX "ProviderSourceRecord_matchMethod_matchConfidence_idx" ON "ProviderSourceRecord"("matchMethod", "matchConfidence");

-- AddForeignKey
ALTER TABLE "ParentPlanItem" ADD CONSTRAINT "ParentPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentPlanItem" ADD CONSTRAINT "ParentPlanItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
