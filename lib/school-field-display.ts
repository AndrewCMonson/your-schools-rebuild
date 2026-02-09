export type DataConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

function confidenceRank(confidence: DataConfidence | null | undefined) {
  if (confidence === "HIGH") return 4;
  if (confidence === "MEDIUM") return 3;
  if (confidence === "LOW") return 2;
  return 1;
}

function meetsConfidenceThreshold(
  confidence: DataConfidence | null | undefined,
  threshold: DataConfidence,
) {
  return confidenceRank(confidence) >= confidenceRank(threshold);
}

export function getAgeRangeText(
  minAge: number | null,
  maxAge: number | null,
  confidence: DataConfidence | null | undefined,
) {
  if (minAge === null || maxAge === null) return "Not available yet";
  if (!meetsConfidenceThreshold(confidence, "MEDIUM")) return "Not available yet";
  return `${minAge} - ${maxAge}`;
}

export function getHoursText(
  openingHours: string | null,
  closingHours: string | null,
  confidence: DataConfidence | null | undefined,
) {
  if (!openingHours || !closingHours) return "Not available yet";
  if (!meetsConfidenceThreshold(confidence, "HIGH")) return "Not available yet";
  return `${openingHours} - ${closingHours}`;
}

export function getEnrollmentText(
  minEnrollment: number | null,
  maxEnrollment: number | null,
  preschoolEnrollmentCount: number | null,
  schoolWideEnrollment: number | null,
  confidence: DataConfidence | null | undefined,
) {
  if (!meetsConfidenceThreshold(confidence, "MEDIUM")) return "Not available yet";

  if (minEnrollment !== null || maxEnrollment !== null) {
    return `${minEnrollment ?? "?"} - ${maxEnrollment ?? "?"}`;
  }
  if (preschoolEnrollmentCount !== null) {
    return `${preschoolEnrollmentCount} (pre-K count)`;
  }
  if (schoolWideEnrollment !== null) {
    return `${schoolWideEnrollment} (school-wide)`;
  }

  return "Not available yet";
}

export function getRatioText(
  minRatio: number | null,
  maxRatio: number | null,
  schoolWideRatio: number | null,
  confidence: DataConfidence | null | undefined,
) {
  if (!meetsConfidenceThreshold(confidence, "HIGH")) return "Not available yet";

  if (minRatio !== null || maxRatio !== null) {
    return `${minRatio ?? "?"} - ${maxRatio ?? "?"}`;
  }
  if (schoolWideRatio !== null) {
    return `${schoolWideRatio.toFixed(2)} (school-wide)`;
  }

  return "Not available yet";
}
