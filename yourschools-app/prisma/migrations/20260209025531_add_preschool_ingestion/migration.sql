-- CreateEnum
CREATE TYPE "IngestionSource" AS ENUM ('HEAD_START', 'NCES_PK');

-- CreateEnum
CREATE TYPE "IngestionRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" TEXT NOT NULL,
    "source" "IngestionSource" NOT NULL,
    "status" "IngestionRunStatus" NOT NULL,
    "recordsSeen" INTEGER NOT NULL DEFAULT 0,
    "recordsUpserted" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionError" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "recordKey" TEXT,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderSourceRecord" (
    "id" TEXT NOT NULL,
    "source" "IngestionSource" NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "schoolId" TEXT,
    "state" TEXT,
    "licenseNumber" TEXT,
    "checksum" TEXT,
    "payload" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "status" TEXT,
    "issuingAgency" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiresDate" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionRun_source_startedAt_idx" ON "IngestionRun"("source", "startedAt");

-- CreateIndex
CREATE INDEX "IngestionRun_status_startedAt_idx" ON "IngestionRun"("status", "startedAt");

-- CreateIndex
CREATE INDEX "IngestionError_runId_createdAt_idx" ON "IngestionError"("runId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderSourceRecord_schoolId_idx" ON "ProviderSourceRecord"("schoolId");

-- CreateIndex
CREATE INDEX "ProviderSourceRecord_state_licenseNumber_idx" ON "ProviderSourceRecord"("state", "licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSourceRecord_source_sourceRecordId_key" ON "ProviderSourceRecord"("source", "sourceRecordId");

-- CreateIndex
CREATE INDEX "License_schoolId_idx" ON "License"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "License_state_licenseNumber_key" ON "License"("state", "licenseNumber");

-- AddForeignKey
ALTER TABLE "IngestionError" ADD CONSTRAINT "IngestionError_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSourceRecord" ADD CONSTRAINT "ProviderSourceRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
