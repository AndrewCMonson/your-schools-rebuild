import { DataConfidence, IngestionSource } from "@prisma/client";
import { fetchRemoteJson } from "@/lib/ingestion/http";
import type { CsvAdapter, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import { makeFallbackSourceId, normalizeText, normalizeZip, parseOptionalNumber } from "@/lib/ingestion/utils";

const FL_API_BASE_URL = process.env.FL_LICENSE_API_BASE_URL ?? "https://caresapi.myflfamilies.com";
const FL_TOKEN_USERNAME = process.env.FL_LICENSE_TOKEN_USERNAME ?? "publicSearch@myflfamilies.com";
const FL_TOKEN_PASSWORD = process.env.FL_LICENSE_TOKEN_PASSWORD ?? "Cares1234!";
const FL_CLIENT_ID = process.env.FL_LICENSE_CLIENT_ID ?? "carespwaclient";
const FL_CLIENT_SECRET = process.env.FL_LICENSE_CLIENT_SECRET ?? "29D28345-C513-47C7-BEA1-EF5125AA03B0";
const FL_SEARCH_LAT = Number.parseFloat(process.env.FL_LICENSE_REFERENCE_LAT ?? "27.994402");
const FL_SEARCH_LNG = Number.parseFloat(process.env.FL_LICENSE_REFERENCE_LNG ?? "-81.760254");
const FL_MAX_QUERIES = Number.parseInt(process.env.FL_LICENSE_MAX_QUERIES ?? "450", 10);

const DEFAULT_FL_COUNTY_SEEDS = [
  "Alachua",
  "Baker",
  "Bay",
  "Bradford",
  "Brevard",
  "Broward",
  "Calhoun",
  "Charlotte",
  "Citrus",
  "Clay",
  "Collier",
  "Columbia",
  "DeSoto",
  "Dixie",
  "Duval",
  "Escambia",
  "Flagler",
  "Franklin",
  "Gadsden",
  "Gilchrist",
  "Glades",
  "Gulf",
  "Hamilton",
  "Hardee",
  "Hendry",
  "Hernando",
  "Highlands",
  "Hillsborough",
  "Holmes",
  "Indian River",
  "Jackson",
  "Jefferson",
  "Lafayette",
  "Lake",
  "Lee",
  "Leon",
  "Levy",
  "Liberty",
  "Madison",
  "Manatee",
  "Marion",
  "Martin",
  "Miami-Dade",
  "Monroe",
  "Nassau",
  "Okaloosa",
  "Okeechobee",
  "Orange",
  "Osceola",
  "Palm Beach",
  "Pasco",
  "Pinellas",
  "Polk",
  "Putnam",
  "St. Johns",
  "St. Lucie",
  "Santa Rosa",
  "Sarasota",
  "Seminole",
  "Sumter",
  "Suwannee",
  "Taylor",
  "Union",
  "Volusia",
  "Wakulla",
  "Walton",
  "Washington",
];

type FlApiTokenResponse = {
  access_token?: string;
};

type FlSearchFilterOption = {
  name?: string;
};

type FlSearchResult = {
  providerName?: string;
  dba?: string;
  providerType?: string;
  licenseStatus?: string;
  providerPhone?: string;
  licenseNumber?: string;
  alternateProviderNumber?: string;
  emailAddress?: string;
  capacity?: number | string;
  licenseExpirationDate?: string;
  city?: string;
  county?: string;
  state?: string;
  zipCode?: string;
  fullAddress?: string;
  mondayHours?: string;
  tuesdayHours?: string;
  wednesdayHours?: string;
  thursdayHours?: string;
  fridayHours?: string;
  saturdayHours?: string;
  sundayHours?: string;
  latitude?: number | string;
  longitude?: number | string;
  service?: Array<{ name?: string }>;
  program?: Array<{ name?: string }>;
};

type FlSearchResponse = Array<{
  publicSearches?: FlSearchResult[];
  filters?: {
    city?: FlSearchFilterOption[];
  };
}>;

function parseSeedTerms() {
  const envTerms = process.env.FL_LICENSE_SEARCH_TERMS;
  if (!envTerms) return DEFAULT_FL_COUNTY_SEEDS;
  return envTerms
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function parseOpeningClosingHours(result: FlSearchResult) {
  const dailyHours = [
    result.mondayHours,
    result.tuesdayHours,
    result.wednesdayHours,
    result.thursdayHours,
    result.fridayHours,
    result.saturdayHours,
    result.sundayHours,
  ].filter((value): value is string => Boolean(value));

  for (const value of dailyHours) {
    const matches = [...value.matchAll(/(\d{1,2}:\d{2}\s*[AP]M)/gi)].map((match) => match[1].toUpperCase());
    if (matches.length >= 2) {
      return {
        openingHours: matches[0],
        closingHours: matches[1],
      };
    }
  }

  return { openingHours: undefined, closingHours: undefined };
}

function inferAges(result: FlSearchResult) {
  const services = (result.service ?? []).map((entry) => (entry.name ?? "").toLowerCase());
  if (services.some((entry) => entry.includes("infant"))) {
    return { minAge: 0, maxAge: undefined, confidence: DataConfidence.LOW };
  }
  return { minAge: undefined, maxAge: undefined, confidence: DataConfidence.UNKNOWN };
}

function mapFlResult(result: FlSearchResult): NormalizedPreschoolRecord | null {
  const name = normalizeText(result.providerName) || normalizeText(result.dba);
  const address = normalizeText(result.fullAddress);
  const city = normalizeText(result.city);
  const state = normalizeText(result.state) || "FL";
  const zipcode = normalizeZip(result.zipCode);

  if (!name || !address || !city || !state || !zipcode) return null;

  const sourceRecordId =
    normalizeText(result.licenseNumber) ||
    normalizeText(result.alternateProviderNumber) ||
    makeFallbackSourceId([name, address, city, state, zipcode]);

  const capacity = parseOptionalNumber(result.capacity);
  const { openingHours, closingHours } = parseOpeningClosingHours(result);
  const { minAge, maxAge, confidence } = inferAges(result);

  return {
    source: IngestionSource.FL_LICENSE,
    sourceRecordId,
    name,
    address,
    city,
    state: "FL",
    zipcode,
    phone: normalizeText(result.providerPhone) || undefined,
    email: normalizeText(result.emailAddress) || undefined,
    licenseNumber: normalizeText(result.licenseNumber) || undefined,
    licenseStatus: normalizeText(result.licenseStatus) || normalizeText(result.providerType) || undefined,
    expiresDate:
      result.licenseExpirationDate && !Number.isNaN(new Date(result.licenseExpirationDate).getTime())
        ? new Date(result.licenseExpirationDate)
        : undefined,
    minAge,
    maxAge,
    preschoolEnrollmentCount: capacity ?? undefined,
    openingHours: openingHours || undefined,
    closingHours: closingHours || undefined,
    lat: parseOptionalNumber(result.latitude) ?? undefined,
    lng: parseOptionalNumber(result.longitude) ?? undefined,
    offersDaycare: true,
    ageSource: minAge !== undefined || maxAge !== undefined ? `${IngestionSource.FL_LICENSE}.service` : undefined,
    hoursSource: openingHours && closingHours ? `${IngestionSource.FL_LICENSE}.hours` : undefined,
    enrollmentSource: capacity !== null ? `${IngestionSource.FL_LICENSE}.capacity` : undefined,
    ageConfidence: confidence,
    hoursConfidence: openingHours && closingHours ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    enrollmentConfidence: capacity !== null ? DataConfidence.HIGH : DataConfidence.UNKNOWN,
    raw: {
      ...result,
      serviceNames: (result.service ?? []).map((entry) => entry.name).filter(Boolean),
      programNames: (result.program ?? []).map((entry) => entry.name).filter(Boolean),
    },
  };
}

async function fetchFlToken() {
  const basicToken = Buffer.from(`${FL_TOKEN_USERNAME}:${FL_TOKEN_PASSWORD}`).toString("base64");
  const url = `${FL_API_BASE_URL}/api/user/token`;
  const payload = {
    grant_type: "password client_credentials",
    scope: "openid userprofile caresapi offline_access",
    clientId: FL_CLIENT_ID,
    clientSecret: FL_CLIENT_SECRET,
  };

  const response = await fetchRemoteJson<FlApiTokenResponse>(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.access_token) {
    throw new Error("missing access token");
  }

  return response.access_token;
}

async function fetchFlProviders(accessToken: string, searchText: string) {
  const params = new URLSearchParams({
    searchText,
    latitude: String(FL_SEARCH_LAT),
    longitude: String(FL_SEARCH_LNG),
  });

  const url = `${FL_API_BASE_URL}/api/publicSearch/Search?${params.toString()}`;
  const response = await fetchRemoteJson<FlSearchResponse>(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const firstBlock = Array.isArray(response) ? response[0] : undefined;
  return {
    records: firstBlock?.publicSearches ?? [],
    cities: (firstBlock?.filters?.city ?? [])
      .map((entry) => normalizeText(entry.name))
      .filter((value): value is string => Boolean(value)),
  };
}

export const flLicenseAdapter: CsvAdapter = {
  source: IngestionSource.FL_LICENSE,
  async loadRecords() {
    try {
      const token = await fetchFlToken();
      const seedTerms = parseSeedTerms();
      const seenTerms = new Set<string>();
      const queue = [...seedTerms];
      const normalizedById = new Map<string, NormalizedPreschoolRecord>();

      let queryCount = 0;
      while (queue.length > 0 && queryCount < FL_MAX_QUERIES) {
        const searchText = queue.shift();
        if (!searchText) continue;
        const dedupeKey = searchText.trim().toLowerCase();
        if (!dedupeKey || seenTerms.has(dedupeKey)) continue;
        seenTerms.add(dedupeKey);
        queryCount += 1;

        const { records, cities } = await fetchFlProviders(token, searchText);
        for (const city of cities) {
          const cityKey = city.toLowerCase();
          if (!seenTerms.has(cityKey)) {
            queue.push(city);
          }
        }

        for (const record of records) {
          const mapped = mapFlResult(record);
          if (!mapped) continue;
          normalizedById.set(mapped.sourceRecordId, mapped);
        }
      }

      return Array.from(normalizedById.values());
    } catch (error) {
      throw new Error(
        `FL license ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  },
};
