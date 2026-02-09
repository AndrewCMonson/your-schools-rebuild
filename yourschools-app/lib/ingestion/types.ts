import { DataConfidence, IngestionSource } from "@prisma/client";

export type NormalizedPreschoolRecord = {
  source: IngestionSource;
  sourceRecordId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone?: string;
  website?: string;
  email?: string;
  description?: string;
  openingHours?: string;
  closingHours?: string;
  licenseNumber?: string;
  licenseStatus?: string;
  issuingAgency?: string;
  effectiveDate?: Date;
  expiresDate?: Date;
  minAge?: number;
  maxAge?: number;
  preschoolEnrollmentCount?: number;
  schoolWideEnrollment?: number;
  schoolWideStudentTeacherRatio?: number;
  offersDaycare?: boolean;
  ageConfidence?: DataConfidence;
  hoursConfidence?: DataConfidence;
  enrollmentConfidence?: DataConfidence;
  ratioConfidence?: DataConfidence;
  ageSource?: string;
  hoursSource?: string;
  enrollmentSource?: string;
  ratioSource?: string;
  lat?: number;
  lng?: number;
  raw: Record<string, unknown>;
};

export type IngestionResult = {
  runId: string;
  source: IngestionSource;
  status: "SUCCEEDED" | "FAILED";
  recordsSeen: number;
  recordsUpserted: number;
  recordsSkipped: number;
};

export type CsvAdapter = {
  source: IngestionSource;
  loadRecords: () => Promise<NormalizedPreschoolRecord[]>;
};
