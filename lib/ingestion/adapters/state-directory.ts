import { DataConfidence, IngestionSource } from "@prisma/client";
import { parseCsvRecords, pickValue } from "@/lib/ingestion/csv";
import { fetchRemoteText } from "@/lib/ingestion/http";
import type { CsvAdapter, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import {
  makeFallbackSourceId,
  normalizeState,
  normalizeText,
  normalizeZip,
  parseOptionalNumber,
} from "@/lib/ingestion/utils";

function parseAgeRange(value: string | undefined) {
  if (!value) return {} as { minAge?: number; maxAge?: number };
  const lower = value.toLowerCase();

  const numbers = [...lower.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length === 0) return {};

  const weekMentioned = lower.includes("week");
  const monthMentioned = lower.includes("month");

  const toYears = (n: number) => {
    if (weekMentioned) return Number((n / 52).toFixed(1));
    if (monthMentioned) return Number((n / 12).toFixed(1));
    return n;
  };

  const minAge = toYears(numbers[0]);
  const maxAge = toYears(numbers[numbers.length - 1]);

  return {
    minAge: Number.isFinite(minAge) ? minAge : undefined,
    maxAge: Number.isFinite(maxAge) ? maxAge : undefined,
  };
}

function mapStateDirectoryRecord(
  row: Record<string, string>,
  source: IngestionSource,
  stateAbbr: string,
): NormalizedPreschoolRecord | null {
  const name = normalizeText(
    pickValue(row, ["facility_name", "provider_name", "operation_name", "program_name", "name", "site_name"]),
  );
  const address = normalizeText(
    pickValue(row, [
      "address",
      "address_line_one",
      "address_line_1",
      "street",
      "street1",
      "location_address",
    ]),
  );
  const city = normalizeText(pickValue(row, ["city", "location_city", "mailing_city"]));
  const state = normalizeState(pickValue(row, ["state", "st"])) || stateAbbr;
  const zipcode = normalizeZip(pickValue(row, ["zip", "zipcode", "postal_code", "zip_code"]));

  if (!name || !address || !city || !state || !zipcode) {
    return null;
  }

  const licenseNumber = normalizeText(
    pickValue(row, ["license_number", "license_no", "permit_number", "operation_number", "facility_id"]),
  );

  const sourceRecordId =
    normalizeText(pickValue(row, ["record_id", "id", "facility_id", "operation_id", "provider_id"])) ||
    licenseNumber ||
    makeFallbackSourceId([name, address, city, state, zipcode]);

  const ageText = normalizeText(
    pickValue(row, ["ages_served", "age_range", "age_groups", "ages", "age_range_text"]),
  );
  const parsedAges = parseAgeRange(ageText);

  const openingHours = normalizeText(pickValue(row, ["opening_time", "open_time", "hours_open"]));
  const closingHours = normalizeText(pickValue(row, ["closing_time", "close_time", "hours_close"]));

  const enrollment =
    parseOptionalNumber(pickValue(row, ["capacity", "max_capacity", "max_enrollment", "enrollment"])) ?? undefined;

  const ratio =
    parseOptionalNumber(
      pickValue(row, ["student_teacher_ratio", "teacher_ratio", "ratio", "staff_child_ratio"]),
    ) ?? undefined;

  return {
    source,
    sourceRecordId,
    name,
    address,
    city,
    state,
    zipcode,
    phone: normalizeText(pickValue(row, ["phone", "telephone", "contact_phone"])) || undefined,
    website: normalizeText(pickValue(row, ["website", "url", "web_url"])) || undefined,
    licenseNumber: licenseNumber || undefined,
    licenseStatus: normalizeText(pickValue(row, ["status", "license_status", "permit_status"])) || undefined,
    minAge: parsedAges.minAge,
    maxAge: parsedAges.maxAge,
    preschoolEnrollmentCount: enrollment,
    schoolWideStudentTeacherRatio: ratio,
    hoursSource: openingHours && closingHours ? `${source}.hours` : undefined,
    enrollmentSource: enrollment !== undefined ? `${source}.capacity` : undefined,
    ratioSource: ratio !== undefined ? `${source}.ratio` : undefined,
    ageSource: parsedAges.minAge !== undefined && parsedAges.maxAge !== undefined ? `${source}.age_range` : undefined,
    ageConfidence:
      parsedAges.minAge !== undefined && parsedAges.maxAge !== undefined
        ? DataConfidence.MEDIUM
        : DataConfidence.UNKNOWN,
    hoursConfidence: openingHours && closingHours ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    enrollmentConfidence: enrollment !== undefined ? DataConfidence.HIGH : DataConfidence.UNKNOWN,
    ratioConfidence: ratio !== undefined ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    description: normalizeText(pickValue(row, ["description", "program_description"])) || undefined,
    openingHours: openingHours || undefined,
    closingHours: closingHours || undefined,
    offersDaycare: true,
    lat: parseOptionalNumber(pickValue(row, ["latitude", "lat", "y"])),
    lng: parseOptionalNumber(pickValue(row, ["longitude", "lng", "lon", "x"])),
    raw: {
      ...row,
      normalized_opening_hours: openingHours || null,
      normalized_closing_hours: closingHours || null,
    },
  };
}

export function makeStateDirectoryAdapter(
  source: IngestionSource,
  stateAbbr: string,
  envVarName: string,
): CsvAdapter {
  return {
    source,
    async loadRecords() {
      const sourceUrl = process.env[envVarName];
      if (!sourceUrl) {
        throw new Error(`${envVarName} is not configured.`);
      }

      const csv = await fetchRemoteText(sourceUrl);
      const rows = parseCsvRecords(csv);

      return rows
        .map((row) => mapStateDirectoryRecord(row, source, stateAbbr))
        .filter((row): row is NormalizedPreschoolRecord => row !== null);
    },
  };
}
