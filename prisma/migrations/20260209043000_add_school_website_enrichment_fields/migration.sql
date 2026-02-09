ALTER TABLE "School"
  ADD COLUMN "websiteDataConfidence" "DataConfidence" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "websiteDataSource" TEXT,
  ADD COLUMN "websiteLastVerifiedAt" TIMESTAMP(3);
