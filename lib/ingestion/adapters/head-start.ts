import { DataConfidence, IngestionSource } from "@prisma/client";
import { parseCsvRecords, pickValue } from "@/lib/ingestion/csv";
import { fetchRemoteText } from "@/lib/ingestion/http";
import type { CsvAdapter, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import {
  isTruthy,
  makeFallbackSourceId,
  normalizeState,
  normalizeText,
  normalizeZip,
  parseOptionalNumber,
} from "@/lib/ingestion/utils";

function mapHeadStartRecord(row: Record<string, string>): NormalizedPreschoolRecord | null {
  const name = normalizeText(
    pickValue(row, ["service_location_name", "center_name", "program_name", "site_name", "name"]),
  );
  const address = normalizeText(
    pickValue(row, ["address_line_one", "address_line_two", "address", "address_1", "street", "location_address"]),
  );
  const city = normalizeText(pickValue(row, ["city", "location_city"]));
  const state = normalizeState(pickValue(row, ["state", "st", "location_state"]));
  const zipcode = normalizeZip(pickValue(row, ["zip", "zipcode", "postal_code"]));

  if (!name || !address || !city || !state || !zipcode) {
    return null;
  }

  const sourceRecordId =
    normalizeText(pickValue(row, ["service_location_id", "center_id", "location_id", "program_id", "id"])) ||
    makeFallbackSourceId([
      pickValue(row, ["grant_number"]),
      name,
      address,
      zipcode,
    ]);

  return {
    source: IngestionSource.HEAD_START,
    sourceRecordId,
    name,
    address,
    city,
    state,
    zipcode,
    phone:
      normalizeText(
        pickValue(row, ["service_location_phone_number", "registration_phone_number", "phone", "telephone"]),
      ) || undefined,
    website: normalizeText(pickValue(row, ["website", "web_url", "url"])) || undefined,
    licenseNumber: normalizeText(pickValue(row, ["grant_number", "license_number", "license_no"])) || undefined,
    licenseStatus:
      normalizeText(pickValue(row, ["status", "license_status"])) || undefined,
    minAge: parseOptionalNumber(pickValue(row, ["min_age", "minimum_age"])),
    maxAge: parseOptionalNumber(pickValue(row, ["max_age", "maximum_age"])),
    preschoolEnrollmentCount: parseOptionalNumber(pickValue(row, ["funded_slots"])),
    offersDaycare:
      isTruthy(pickValue(row, ["offers_daycare", "daycare", "full_day"])) ?? true,
    ageConfidence: DataConfidence.UNKNOWN,
    hoursConfidence: DataConfidence.UNKNOWN,
    enrollmentConfidence: DataConfidence.HIGH,
    ratioConfidence: DataConfidence.UNKNOWN,
    enrollmentSource: "HEAD_START.funded_slots",
    lat: parseOptionalNumber(pickValue(row, ["latitude", "lat"])),
    lng: parseOptionalNumber(pickValue(row, ["longitude", "lng", "lon"])),
    raw: row,
  };
}

export const headStartAdapter: CsvAdapter = {
  source: IngestionSource.HEAD_START,
  async loadRecords() {
    const sourceUrl = process.env.HEAD_START_DATA_URL;
    if (!sourceUrl) {
      throw new Error("HEAD_START_DATA_URL is not configured.");
    }

    const csv = await fetchRemoteText(sourceUrl);
    const rows = parseCsvRecords(csv);

    return rows
      .map((row) => mapHeadStartRecord(row))
      .filter((row): row is NormalizedPreschoolRecord => row !== null);
  },
};
