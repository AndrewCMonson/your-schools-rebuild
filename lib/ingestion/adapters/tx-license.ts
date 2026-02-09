import { DataConfidence, IngestionSource } from "@prisma/client";
import { fetchRemoteJson } from "@/lib/ingestion/http";
import type { CsvAdapter, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import { normalizeText, normalizeZip, parseOptionalNumber } from "@/lib/ingestion/utils";

const TX_API_BASE_URL = process.env.TX_LICENSE_API_BASE_URL ?? "https://childcare.hhs.texas.gov/__endpoint";
const TX_PAGE_SIZE = Number.parseInt(process.env.TX_LICENSE_PAGE_SIZE ?? "1000", 10);
const TX_MAX_PAGES = Number.parseInt(process.env.TX_LICENSE_MAX_PAGES ?? "0", 10);

type TxTokenResponse = {
  data?: {
    token?: string;
  };
};

type TxProvider = {
  providerId?: number;
  providerNum?: number;
  agencyNum?: number;
  branchNumber?: number;
  providerName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  providerType?: string;
  issuanceType?: string;
  providerWrkngHours?: string;
  ttlCpcty?: number | string;
  agesServed?: string;
  latitude?: number | string;
  longitude?: number | string;
  providerEmail?: string;
  programType?: string;
};

type TxProviderResponse = {
  response?: TxProvider[];
  totalCount?: number;
};

function parseAgeRange(value: string | undefined) {
  if (!value) return {} as { minAge?: number; maxAge?: number };
  const lower = value.toLowerCase();
  const numbers = [...lower.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length === 0) return {};

  const hasWeeks = lower.includes("week");
  const hasMonths = lower.includes("month");
  const toYears = (n: number) => {
    if (hasWeeks) return Number((n / 52).toFixed(1));
    if (hasMonths) return Number((n / 12).toFixed(1));
    return n;
  };

  return {
    minAge: toYears(numbers[0]),
    maxAge: toYears(numbers[numbers.length - 1]),
  };
}

function parseOpeningClosingHours(hoursText: string | undefined) {
  if (!hoursText) return { openingHours: undefined, closingHours: undefined };
  const matches = [...hoursText.matchAll(/(\d{1,2}:\d{2}\s*[AP]M)/gi)].map((match) => match[1].toUpperCase());
  return {
    openingHours: matches[0],
    closingHours: matches[1],
  };
}

function mapTxProvider(provider: TxProvider): NormalizedPreschoolRecord | null {
  const name = normalizeText(provider.providerName);
  const address = normalizeText(provider.addressLine1);
  const city = normalizeText(provider.city);
  const state = normalizeText(provider.state) || "TX";
  const zipcode = normalizeZip(provider.zipCode);

  if (!name || !address || !city || !state || !zipcode || provider.providerId === undefined) return null;

  const { minAge, maxAge } = parseAgeRange(provider.agesServed);
  const { openingHours, closingHours } = parseOpeningClosingHours(provider.providerWrkngHours);
  const capacity = parseOptionalNumber(provider.ttlCpcty);

  return {
    source: IngestionSource.TX_LICENSE,
    sourceRecordId: String(provider.providerId),
    name,
    address,
    city,
    state: "TX",
    zipcode,
    phone: normalizeText(provider.phoneNumber) || undefined,
    email: normalizeText(provider.providerEmail) || undefined,
    licenseNumber: provider.providerNum ? String(provider.providerNum) : String(provider.providerId),
    licenseStatus: normalizeText(provider.issuanceType) || normalizeText(provider.providerType) || undefined,
    minAge,
    maxAge,
    preschoolEnrollmentCount: capacity ?? undefined,
    openingHours: openingHours || undefined,
    closingHours: closingHours || undefined,
    lat: parseOptionalNumber(provider.latitude) ?? undefined,
    lng: parseOptionalNumber(provider.longitude) ?? undefined,
    offersDaycare: provider.programType === "DC",
    ageSource: minAge !== undefined || maxAge !== undefined ? `${IngestionSource.TX_LICENSE}.ages_served` : undefined,
    hoursSource: openingHours && closingHours ? `${IngestionSource.TX_LICENSE}.hours` : undefined,
    enrollmentSource: capacity !== null ? `${IngestionSource.TX_LICENSE}.capacity` : undefined,
    ageConfidence:
      minAge !== undefined || maxAge !== undefined ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    hoursConfidence: openingHours && closingHours ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    enrollmentConfidence: capacity !== null ? DataConfidence.HIGH : DataConfidence.UNKNOWN,
    raw: provider,
  };
}

function buildTxRequestBody(pageNumber: number, pageSize: number) {
  return {
    operationNumber: "",
    operationName: "",
    providerName: "",
    address: "",
    city: "",
    sortColumn: "",
    sortOrder: "ASC",
    pageSize,
    pageNumber,
    includeApplicants: false,
    providerAdrressOpt: "",
    nearMeAddress: "",
    commuteFromAddress: "",
    commuteToAddress: "",
    latLong: [],
    radius: "",
    providerTypes: [],
    primaryCaregiverFirstName: "",
    primaryCaregiverMiddleName: "",
    primaryCaregiverLastName: "",
    issuanceTypes: [],
    agesServed: [],
    mealOptions: [],
    schedulesServed: [],
    programProvided: [],
    isAccredited: "",
    providerWrkngDays: "",
    providerWrkngHrs: "",
  };
}

async function fetchTxToken() {
  const response = await fetchRemoteJson<TxTokenResponse>(`${TX_API_BASE_URL}/public/security/token`);
  const token = normalizeText(response.data?.token);
  if (!token) {
    throw new Error("missing token");
  }
  return token;
}

async function fetchTxPage(token: string, pageNumber: number, pageSize: number) {
  return fetchRemoteJson<TxProviderResponse>(`${TX_API_BASE_URL}/ps/daycare/providers`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildTxRequestBody(pageNumber, pageSize)),
  });
}

export const txLicenseAdapter: CsvAdapter = {
  source: IngestionSource.TX_LICENSE,
  async loadRecords() {
    try {
      const token = await fetchTxToken();
      const seenById = new Map<string, NormalizedPreschoolRecord>();

      let page = 1;
      let totalCount = Number.POSITIVE_INFINITY;
      let seenCount = 0;

      while (seenCount < totalCount) {
        if (TX_MAX_PAGES > 0 && page > TX_MAX_PAGES) break;
        const pageResponse = await fetchTxPage(token, page, TX_PAGE_SIZE);
        const pageRecords = pageResponse.response ?? [];
        totalCount = pageResponse.totalCount ?? pageRecords.length;
        if (pageRecords.length === 0) break;

        for (const provider of pageRecords) {
          const mapped = mapTxProvider(provider);
          if (!mapped) continue;
          seenById.set(mapped.sourceRecordId, mapped);
        }

        seenCount += pageRecords.length;
        page += 1;
      }

      return Array.from(seenById.values());
    } catch (error) {
      throw new Error(
        `TX license ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  },
};
