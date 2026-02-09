import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DataConfidence, IngestionSource } from "@prisma/client";
import { fetchRemoteText } from "@/lib/ingestion/http";
import type { CsvAdapter, NormalizedPreschoolRecord } from "@/lib/ingestion/types";
import { normalizeText, normalizeZip, parseOptionalNumber } from "@/lib/ingestion/utils";

const VA_SEARCH_URL =
  process.env.VA_LICENSE_SEARCH_URL ?? "https://www.dss.virginia.gov/facility/search/cc2.cgi";
const VA_DETAIL_BASE_URL = process.env.VA_LICENSE_DETAIL_BASE_URL ?? "https://www.dss.virginia.gov";
const VA_DETAIL_CONCURRENCY = Number.parseInt(process.env.VA_LICENSE_DETAIL_CONCURRENCY ?? "8", 10);
const VA_MAX_DETAILS = Number.parseInt(process.env.VA_LICENSE_MAX_DETAILS ?? "0", 10);
const execFileAsync = promisify(execFile);

type VaListingRecord = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phone?: string;
};

async function fetchVaText(url: string, init?: RequestInit & { headers?: Record<string, string> }) {
  try {
    return await fetchRemoteText(url, init);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("fetch failed")) {
      throw error;
    }

    const args = ["--silent", "--show-error", "--location", "--fail", "--max-time", "60"];
    const method = init?.method ?? "GET";
    args.push("-X", method);

    const headers = init?.headers ?? {};
    for (const [key, value] of Object.entries(headers)) {
      args.push("-H", `${key}: ${value}`);
    }

    if (typeof init?.body === "string" && init.body.length > 0) {
      args.push("--data", init.body);
    }

    args.push(url);

    const { stdout } = await execFileAsync("curl", args, { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeHtml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAgeRange(value: string | undefined) {
  if (!value) return {} as { minAge?: number; maxAge?: number };
  const lower = value.toLowerCase();
  const numbers = [...lower.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length === 0) return {};

  const hasMonths = lower.includes("month");
  const toYears = (n: number) => (hasMonths ? Number((n / 12).toFixed(1)) : n);

  const minAge = toYears(numbers[0]);
  const maxAge = toYears(numbers[numbers.length - 1]);

  return {
    minAge: Number.isFinite(minAge) ? minAge : undefined,
    maxAge: Number.isFinite(maxAge) ? maxAge : undefined,
  };
}

function extractLabeledValue(html: string, label: string) {
  const pattern = new RegExp(
    `<td[^>]*>\\s*(?:<[^>]+>\\s*)*${escapeRegExp(label)}\\s*:?[\\s\\S]*?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
    "i",
  );
  const match = html.match(pattern);
  if (!match) return undefined;
  const cleaned = stripHtml(match[1]);
  return cleaned.length > 0 ? cleaned : undefined;
}

function parseOpeningClosingHours(hoursText: string | undefined) {
  if (!hoursText) return { openingHours: undefined, closingHours: undefined };
  const matches = [...hoursText.matchAll(/(\d{1,2}:\d{2}\s*[ap]\.?m\.?)/gi)].map((m) =>
    m[1].replace(/\./g, "").toUpperCase(),
  );
  return {
    openingHours: matches[0],
    closingHours: matches[1],
  };
}

function parseListingRows(html: string) {
  const rows: VaListingRecord[] = [];
  const rowPattern =
    /<tr>\s*<td[^>]*>\s*<a[^>]*rm=Details;ID=(\d+)[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const id = match[1];
    const name = normalizeText(stripHtml(match[2]));
    const addressCellHtml = match[3];
    const phone = normalizeText(stripHtml(match[4]));

    if (!id || !name || !addressCellHtml) continue;

    const addressParts = addressCellHtml
      .split(/<br\s*\/?>/i)
      .map((part) => stripHtml(part))
      .filter((part) => part.length > 0);

    const streetPart = addressParts[0] ?? "";
    const cityStateZipPart = addressParts[addressParts.length - 1] ?? "";
    const cityStateZip = cityStateZipPart.match(/(.+?),\s*([A-Z]{2})\s+(\d{5})/i);
    if (!cityStateZip) continue;

    const city = normalizeText(cityStateZip[1]);
    const state = normalizeText(cityStateZip[2]);
    const zipcode = normalizeZip(cityStateZip[3]);
    const address = normalizeText(streetPart);

    if (!address || !city || !state || !zipcode) continue;

    rows.push({
      id,
      name,
      address,
      city,
      state,
      zipcode,
      phone: phone || undefined,
    });
  }

  return rows;
}

async function mapVaRecordFromDetail(listing: VaListingRecord): Promise<NormalizedPreschoolRecord> {
  const detailUrl = `${VA_DETAIL_BASE_URL}/facility/search/cc2.cgi?rm=Details;ID=${listing.id}`;
  const detailHtml = await fetchVaText(detailUrl);

  const facilityType = extractLabeledValue(detailHtml, "Facility Type");
  const licenseType = extractLabeledValue(detailHtml, "License Type");
  const expirationDate = extractLabeledValue(detailHtml, "Expiration Date");
  const businessHours = extractLabeledValue(detailHtml, "Business Hours");
  const capacity = extractLabeledValue(detailHtml, "Capacity");
  const ages = extractLabeledValue(detailHtml, "Ages");
  const licenseFacilityId = extractLabeledValue(detailHtml, "License/Facility ID#");

  const { minAge, maxAge } = parseAgeRange(ages);
  const { openingHours, closingHours } = parseOpeningClosingHours(businessHours);

  const enrollment = parseOptionalNumber(capacity);
  const expiresDate = expirationDate ? new Date(expirationDate) : undefined;

  return {
    source: IngestionSource.VA_LICENSE,
    sourceRecordId: listing.id,
    name: listing.name,
    address: listing.address,
    city: listing.city,
    state: "VA",
    zipcode: listing.zipcode,
    phone: listing.phone,
    licenseNumber: licenseFacilityId || listing.id,
    licenseStatus: licenseType || facilityType,
    expiresDate: expiresDate && !Number.isNaN(expiresDate.getTime()) ? expiresDate : undefined,
    minAge,
    maxAge,
    preschoolEnrollmentCount: enrollment ?? undefined,
    openingHours: openingHours || undefined,
    closingHours: closingHours || undefined,
    offersDaycare: true,
    ageSource: minAge !== undefined && maxAge !== undefined ? `${IngestionSource.VA_LICENSE}.ages` : undefined,
    hoursSource: openingHours && closingHours ? `${IngestionSource.VA_LICENSE}.business_hours` : undefined,
    enrollmentSource: enrollment !== null ? `${IngestionSource.VA_LICENSE}.capacity` : undefined,
    ageConfidence:
      minAge !== undefined && maxAge !== undefined ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    hoursConfidence: openingHours && closingHours ? DataConfidence.MEDIUM : DataConfidence.UNKNOWN,
    enrollmentConfidence: enrollment !== null ? DataConfidence.HIGH : DataConfidence.UNKNOWN,
    raw: {
      listing,
      facilityType,
      licenseType,
      businessHours,
      capacity,
      ages,
      expirationDate,
    },
  };
}

async function runWithConcurrency<T, U>(items: T[], concurrency: number, worker: (item: T) => Promise<U>) {
  const safeConcurrency = Math.max(1, Number.isFinite(concurrency) ? concurrency : 1);
  const results: U[] = [];
  let index = 0;

  const workers = Array.from({ length: Math.min(safeConcurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
}

export const vaLicenseAdapter: CsvAdapter = {
  source: IngestionSource.VA_LICENSE,
  async loadRecords() {
    try {
      const searchHtml = await fetchVaText(VA_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ rm: "Search" }).toString(),
      });

      const listings = parseListingRows(searchHtml);
      if (listings.length === 0) return [];

      const selectedListings = VA_MAX_DETAILS > 0 ? listings.slice(0, VA_MAX_DETAILS) : listings;
      return runWithConcurrency(selectedListings, VA_DETAIL_CONCURRENCY, mapVaRecordFromDetail);
    } catch (error) {
      throw new Error(
        `VA license ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  },
};
