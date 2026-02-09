export type SearchFilters = {
  q?: string;
  zipcode?: string;
  town?: string;
  daycare?: boolean;
  verified?: boolean;
  minTuition?: number;
  maxTuition?: number;
  minAge?: number;
  maxAge?: number;
};

export function buildSearchTerm(filters: SearchFilters): string {
  return [filters.q, filters.zipcode, filters.town].filter(Boolean).join(" ").trim();
}

export function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}
