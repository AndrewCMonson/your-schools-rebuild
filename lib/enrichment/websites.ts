import { DataConfidence } from "@prisma/client";
import { db } from "@/lib/db";

const DEFAULT_MAX_CANDIDATES = Number.parseInt(process.env.WEBSITE_ENRICHMENT_MAX_CANDIDATES ?? "5", 10);
const DEFAULT_PAGE_TIMEOUT_MS = Number.parseInt(process.env.WEBSITE_ENRICHMENT_PAGE_TIMEOUT_MS ?? "12000", 10);
const SEARCH_PROVIDER = (process.env.WEBSITE_ENRICHMENT_SEARCH_PROVIDER ?? "DUCKDUCKGO").toUpperCase();

const BLOCKED_HOSTS = [
  "google.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "linkedin.com",
  "wikipedia.org",
  "yelp.com",
  "yellowpages.com",
  "care.com",
  "greatschools.org",
  "mapquest.com",
  "opencorporates.com",
];

type EnrichmentCandidate = {
  url: string;
  score: number;
  confidence: DataConfidence;
  reason: string[];
};

type SchoolForEnrichment = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  websiteDataConfidence: DataConfidence;
};

export type WebsiteEnrichmentResult = {
  processed: number;
  updated: number;
  skipped: number;
  noCandidate: number;
  errors: number;
  records: Array<{
    schoolId: string;
    schoolName: string;
    status: "UPDATED" | "SKIPPED" | "NO_CANDIDATE" | "ERROR";
    website?: string;
    confidence?: DataConfidence;
    reason?: string;
  }>;
};

function confidenceRank(confidence: DataConfidence) {
  if (confidence === DataConfidence.HIGH) return 4;
  if (confidence === DataConfidence.MEDIUM) return 3;
  if (confidence === DataConfidence.LOW) return 2;
  return 1;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeUrl(input: string) {
  try {
    const parsed = new URL(input);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDomain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function hasBlockedHost(url: string) {
  const domain = extractDomain(url);
  return BLOCKED_HOSTS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
}

function tokenizeName(name: string) {
  return Array.from(
    new Set(
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 3)
        .filter((token) => !["the", "and", "school", "academy", "center", "child", "care"].includes(token)),
    ),
  );
}

function normalizePhoneDigits(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D+/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function extractPrimaryStreet(address: string) {
  const normalized = address.toLowerCase();
  const firstChunk = normalized.split(",")[0] ?? normalized;
  return firstChunk.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchText(url: string, timeoutMs: number) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "yourschools-enrichment/1.0",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`fetch failed (${response.status})`);
  }

  return response.text();
}

function extractDuckDuckGoLinks(html: string) {
  const links: string[] = [];
  const regex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const rawHref = decodeHtmlEntities(match[1]);
    if (!rawHref) continue;

    let resolved = rawHref;
    if (rawHref.startsWith("/l/?")) {
      const params = new URLSearchParams(rawHref.split("?")[1] ?? "");
      const uddg = params.get("uddg");
      if (uddg) {
        resolved = decodeURIComponent(uddg);
      }
    }

    const sanitized = sanitizeUrl(resolved);
    if (!sanitized) continue;
    links.push(sanitized);
  }

  return Array.from(new Set(links));
}

async function searchWebCandidates(query: string, maxCandidates: number) {
  if (SEARCH_PROVIDER !== "DUCKDUCKGO") {
    throw new Error(`Unsupported WEBSITE_ENRICHMENT_SEARCH_PROVIDER: ${SEARCH_PROVIDER}`);
  }

  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchText(searchUrl, DEFAULT_PAGE_TIMEOUT_MS);
  return extractDuckDuckGoLinks(html).slice(0, maxCandidates);
}

async function scoreCandidate(school: SchoolForEnrichment, url: string): Promise<EnrichmentCandidate | null> {
  if (hasBlockedHost(url)) return null;

  const reasons: string[] = [];
  let score = 0;

  const domain = extractDomain(url);
  const nameTokens = tokenizeName(school.name);

  if (nameTokens.some((token) => domain.includes(token))) {
    score += 12;
    reasons.push("name token in domain");
  }

  let html = "";
  try {
    html = await fetchText(url, DEFAULT_PAGE_TIMEOUT_MS);
  } catch {
    return null;
  }

  const text = normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).toLowerCase();

  const exactName = school.name.toLowerCase();
  if (text.includes(exactName)) {
    score += 30;
    reasons.push("exact school name on page");
  }

  const matchedTokens = nameTokens.filter((token) => text.includes(token));
  if (matchedTokens.length > 0) {
    score += Math.min(20, matchedTokens.length * 4);
    reasons.push(`name token matches (${matchedTokens.length})`);
  }

  if (text.includes(school.city.toLowerCase())) {
    score += 10;
    reasons.push("city match");
  }

  if (text.includes(school.state.toLowerCase())) {
    score += 6;
    reasons.push("state match");
  }

  const phoneDigits = normalizePhoneDigits(school.phone);
  if (phoneDigits && text.replace(/\D+/g, "").includes(phoneDigits)) {
    score += 25;
    reasons.push("phone match");
  }

  const street = extractPrimaryStreet(school.address);
  if (street && street.length >= 8 && text.includes(street)) {
    score += 18;
    reasons.push("street address match");
  }

  let confidence: DataConfidence = DataConfidence.UNKNOWN;
  if (score >= 65) confidence = DataConfidence.HIGH;
  else if (score >= 45) confidence = DataConfidence.MEDIUM;
  else if (score >= 30) confidence = DataConfidence.LOW;

  if (confidence === DataConfidence.UNKNOWN) return null;

  return {
    url,
    score,
    confidence,
    reason: reasons,
  };
}

function buildQueries(school: SchoolForEnrichment) {
  const base = `"${school.name}" "${school.city}" "${school.state}" preschool`;
  const queries = [base, `${base} ${school.address}`];
  if (school.phone) {
    queries.push(`${base} ${normalizePhoneDigits(school.phone)}`);
  }
  return queries;
}

async function findBestWebsiteCandidate(school: SchoolForEnrichment, maxCandidates: number) {
  const scored = new Map<string, EnrichmentCandidate>();
  for (const query of buildQueries(school)) {
    const candidates = await searchWebCandidates(query, maxCandidates);
    for (const url of candidates) {
      if (scored.has(url)) continue;
      const evaluation = await scoreCandidate(school, url);
      if (!evaluation) continue;
      scored.set(url, evaluation);
    }
    if (Array.from(scored.values()).some((candidate) => candidate.confidence === DataConfidence.HIGH)) {
      break;
    }
  }

  const ordered = Array.from(scored.values()).sort((a, b) => b.score - a.score);
  return ordered[0] ?? null;
}

function shouldUpdateExisting(school: SchoolForEnrichment, candidate: EnrichmentCandidate) {
  if (!school.website) return true;
  return confidenceRank(candidate.confidence) > confidenceRank(school.websiteDataConfidence);
}

export async function runWebsiteEnrichment(options?: {
  limit?: number;
  dryRun?: boolean;
  maxCandidates?: number;
}) {
  const limit = Math.max(1, Math.min(options?.limit ?? 100, 1000));
  const dryRun = options?.dryRun ?? false;
  const maxCandidates = Math.max(1, options?.maxCandidates ?? DEFAULT_MAX_CANDIDATES);

  const schools = await db.school.findMany({
    where: {
      OR: [{ website: null }, { websiteDataConfidence: { in: [DataConfidence.UNKNOWN, DataConfidence.LOW] } }],
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      phone: true,
      website: true,
      websiteDataConfidence: true,
    },
    orderBy: [{ updatedAt: "asc" }],
    take: limit,
  });

  const result: WebsiteEnrichmentResult = {
    processed: 0,
    updated: 0,
    skipped: 0,
    noCandidate: 0,
    errors: 0,
    records: [],
  };

  for (const school of schools) {
    result.processed += 1;
    try {
      const best = await findBestWebsiteCandidate(school, maxCandidates);
      if (!best) {
        result.noCandidate += 1;
        result.records.push({
          schoolId: school.id,
          schoolName: school.name,
          status: "NO_CANDIDATE",
        });
        continue;
      }

      if (!shouldUpdateExisting(school, best)) {
        result.skipped += 1;
        result.records.push({
          schoolId: school.id,
          schoolName: school.name,
          status: "SKIPPED",
          website: best.url,
          confidence: best.confidence,
          reason: "existing website confidence is equal or higher",
        });
        continue;
      }

      if (!dryRun) {
        await db.school.update({
          where: { id: school.id },
          data: {
            website: best.url,
            websiteDataConfidence: best.confidence,
            websiteDataSource: "SEARCH_ENRICHMENT",
            websiteLastVerifiedAt: new Date(),
          },
        });
      }

      result.updated += 1;
      result.records.push({
        schoolId: school.id,
        schoolName: school.name,
        status: "UPDATED",
        website: best.url,
        confidence: best.confidence,
        reason: best.reason.join(", "),
      });
    } catch (error) {
      result.errors += 1;
      result.records.push({
        schoolId: school.id,
        schoolName: school.name,
        status: "ERROR",
        reason: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  return result;
}
