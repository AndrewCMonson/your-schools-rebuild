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

function hasPreK(lowGrade: string) {
  const normalized = normalizeText(lowGrade).toUpperCase();
  return normalized === "PK" || normalized === "UG";
}

function parseGradeCode(raw: string | undefined) {
  const normalized = normalizeText(raw).toUpperCase();
  if (!normalized) return undefined;
  if (normalized === "UG") return -2;
  if (normalized === "PK") return -1;
  if (normalized === "TK") return -1;
  if (normalized === "KG" || normalized === "K") return 0;

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return undefined;
  return numeric;
}

function isLikelyPreschoolCampus(row: Record<string, string>) {
  const lowGradeValue = pickValue(row, ["low_grade", "lowest_grade_offered", "gslo"]);
  const highGradeValue = pickValue(row, ["high_grade", "highest_grade_offered", "gshi"]);
  const lowGrade = parseGradeCode(lowGradeValue);
  const highGrade = parseGradeCode(highGradeValue);

  if (lowGrade !== undefined && lowGrade > 0) {
    return false;
  }

  if (highGrade !== undefined && highGrade > 0) {
    return false;
  }

  const schoolLevel = normalizeText(pickValue(row, ["school_level"])).toLowerCase();
  if (schoolLevel && ["elementary", "middle", "high", "secondary"].some((term) => schoolLevel.includes(term))) {
    return false;
  }

  return true;
}

function hasPreKIndicator(row: Record<string, string>) {
  const pk = normalizeText(pickValue(row, ["pk"])).toUpperCase();
  if (!pk) return false;
  if (["1", "YES", "Y", "TRUE", "PK"].includes(pk)) return true;

  const asNumber = Number(pk);
  return Number.isFinite(asNumber) && asNumber > 0;
}

function mapNcesRecord(row: Record<string, string>): NormalizedPreschoolRecord | null {
  const lowGrade = pickValue(row, ["low_grade", "lowest_grade_offered"]);
  if (!hasPreK(lowGrade) && !hasPreKIndicator(row)) return null;
  if (!isLikelyPreschoolCampus(row)) return null;

  const name = normalizeText(pickValue(row, ["school_name", "name", "sch_name", "school"]));
  const address = normalizeText(
    pickValue(row, [
      "street",
      "street_address",
      "mstree",
      "address",
      "location_address",
      "lstreet1",
      "lstreet2",
    ]),
  );
  const city = normalizeText(pickValue(row, ["city", "mcity", "lcity"]));
  const state = normalizeState(pickValue(row, ["state", "mstate", "lstate", "stabr"]));
  const zipcode = normalizeZip(pickValue(row, ["zip", "mzip", "zipcode", "lzip"]));

  if (!name || !address || !city || !state || !zipcode) {
    return null;
  }

  const sourceRecordId =
    normalizeText(pickValue(row, ["ncessch", "school_id", "id"])) ||
    makeFallbackSourceId([name, address, zipcode]);

  return {
    source: IngestionSource.NCES_PK,
    sourceRecordId,
    name,
    address,
    city,
    state,
    zipcode,
    phone: normalizeText(pickValue(row, ["phone", "telephone"])) || undefined,
    website:
      normalizeText(pickValue(row, ["website", "web_url", "school_url"])) || undefined,
    description: "Public school pre-K program",
    offersDaycare: false,
    minAge: 3,
    maxAge: 5,
    preschoolEnrollmentCount: parseOptionalNumber(pickValue(row, ["pk"])),
    schoolWideEnrollment:
      parseOptionalNumber(pickValue(row, ["total"])) ??
      parseOptionalNumber(pickValue(row, ["member"])),
    schoolWideStudentTeacherRatio: parseOptionalNumber(pickValue(row, ["stuteratio"])),
    ageConfidence: DataConfidence.LOW,
    hoursConfidence: DataConfidence.UNKNOWN,
    enrollmentConfidence: DataConfidence.MEDIUM,
    ratioConfidence: DataConfidence.LOW,
    ageSource: "NCES_PK.grade_span_inference",
    enrollmentSource: "NCES_PK.pk",
    ratioSource: "NCES_PK.stuteratio",
    lat: parseOptionalNumber(pickValue(row, ["latitude", "lat", "latcod", "y"])),
    lng: parseOptionalNumber(pickValue(row, ["longitude", "lon", "lng", "loncod", "x"])),
    raw: row,
  };
}

export const ncesPkAdapter: CsvAdapter = {
  source: IngestionSource.NCES_PK,
  async loadRecords() {
    const sourceUrl = process.env.NCES_PK_DATA_URL;
    if (!sourceUrl) {
      throw new Error("NCES_PK_DATA_URL is not configured.");
    }

    const csv = await fetchRemoteText(sourceUrl);
    const rows = parseCsvRecords(csv);

    const maxRecords = Number(process.env.NCES_PK_MAX_ROWS ?? "0");
    const mapped = rows
      .map((row) => mapNcesRecord(row))
      .filter((row): row is NormalizedPreschoolRecord => row !== null);

    if (maxRecords > 0) {
      return mapped.slice(0, maxRecords);
    }

    return mapped;
  },
};
