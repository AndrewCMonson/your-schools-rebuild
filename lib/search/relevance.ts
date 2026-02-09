import { normalizeQuery } from "@/lib/search/query";

interface ScoreInput {
  schoolName: string;
  city: string;
  zipcode: string;
  averageRating: number | null;
  isVerified: boolean;
  q?: string;
  town?: string;
  zipcodeFilter?: string;
}

export function calculateSchoolRelevance(input: ScoreInput): number {
  const normalizedQ = normalizeQuery(input.q ?? "");
  const normalizedTown = normalizeQuery(input.town ?? "");
  const nameNorm = normalizeQuery(input.schoolName);
  const cityNorm = normalizeQuery(input.city);

  let score = 0;

  if (normalizedQ) {
    if (nameNorm === normalizedQ) score += 120;
    else if (nameNorm.startsWith(normalizedQ)) score += 90;
    else if (nameNorm.includes(normalizedQ)) score += 70;

    if (cityNorm === normalizedQ) score += 60;
    else if (cityNorm.includes(normalizedQ)) score += 35;

    if (input.zipcode === normalizedQ) score += 75;
    else if (input.zipcode.startsWith(normalizedQ)) score += 45;
  }

  if (input.zipcodeFilter) {
    if (input.zipcode === input.zipcodeFilter) score += 80;
    else if (input.zipcode.startsWith(input.zipcodeFilter)) score += 40;
  }

  if (normalizedTown) {
    if (cityNorm === normalizedTown) score += 70;
    else if (cityNorm.includes(normalizedTown)) score += 45;
  }

  if (input.isVerified) score += 15;
  score += Math.round((input.averageRating ?? 0) * 6);

  return score;
}
