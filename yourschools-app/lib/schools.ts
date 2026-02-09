import { db } from "@/lib/db";
import { geocodeAddress, haversineMiles } from "@/lib/geocoding";
import { buildSearchTerm, normalizeQuery } from "@/lib/search/query";
import { calculateSchoolRelevance } from "@/lib/search/relevance";

export type SchoolSearchInput = {
  q?: string;
  zipcode?: string;
  town?: string;
  daycare?: string;
  verified?: string;
  minTuition?: string;
  maxTuition?: string;
  minAge?: string;
  maxAge?: string;
  address?: string;
  sort?: string;
};

const CARD_RESULT_LIMIT = 60;
const MAP_MARKER_LIMIT = 20000;
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 5;
const MARKER_CACHE_TTL_MS = 1000 * 60 * 5;
const searchCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof runSchoolSearch>> }>();
const markerCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof runSchoolMarkerSearch>> }>();

function toCacheKey(input: SchoolSearchInput) {
  return JSON.stringify(
    Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce<Record<string, string | undefined>>((acc, [key, value]) => {
        acc[key] = value?.trim() || undefined;
        return acc;
      }, {}),
  );
}

function readCachedValue<T>(store: Map<string, { expiresAt: number; value: T }>, key: string): T | null {
  const cached = store.get(key);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return cached.value;
}

function writeCachedValue<T>(
  store: Map<string, { expiresAt: number; value: T }>,
  key: string,
  ttlMs: number,
  value: T,
) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function parseBoolean(value?: string) {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function buildSchoolSearchWhere(input: SchoolSearchInput) {
  const q = input.q?.trim();
  const zipcode = input.zipcode?.trim();
  const town = input.town?.trim();
  const daycare = parseBoolean(input.daycare);
  const verified = parseBoolean(input.verified);
  const minTuition = input.minTuition ? Number(input.minTuition) : undefined;
  const maxTuition = input.maxTuition ? Number(input.maxTuition) : undefined;
  const minAge = input.minAge ? Number(input.minAge) : undefined;
  const maxAge = input.maxAge ? Number(input.maxAge) : undefined;

  return {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
              { zipcode: { contains: q } },
            ],
          }
        : {},
      zipcode ? { zipcode: { startsWith: zipcode } } : {},
      town ? { city: { contains: town, mode: "insensitive" as const } } : {},
      daycare !== undefined ? { offersDaycare: daycare } : {},
      verified !== undefined ? { isVerified: verified } : {},
      minTuition !== undefined ? { minTuition: { gte: minTuition } } : {},
      maxTuition !== undefined ? { maxTuition: { lte: maxTuition } } : {},
      minAge !== undefined ? { minAge: { gte: minAge } } : {},
      maxAge !== undefined ? { maxAge: { lte: maxAge } } : {},
    ],
  };
}

async function runSchoolSearch(input: SchoolSearchInput) {
  const q = input.q?.trim();
  const zipcode = input.zipcode?.trim();
  const town = input.town?.trim();
  const daycare = parseBoolean(input.daycare);
  const verified = parseBoolean(input.verified);
  const minTuition = input.minTuition ? Number(input.minTuition) : undefined;
  const maxTuition = input.maxTuition ? Number(input.maxTuition) : undefined;
  const minAge = input.minAge ? Number(input.minAge) : undefined;
  const maxAge = input.maxAge ? Number(input.maxAge) : undefined;
  const address = input.address?.trim();
  const sort = input.sort?.trim() || "relevance";

  const geocodedOrigin = address ? await geocodeAddress(address) : null;
  const normalizedQ = normalizeQuery(q ?? "");
  const normalizedTown = normalizeQuery(town ?? "");
  const where = buildSchoolSearchWhere(input);

  const schools = await db.school.findMany({
    where,
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
    orderBy: [
      {
        isVerified: "desc",
      },
      {
        averageRating: "desc",
      },
      {
        name: "asc",
      },
    ],
    take: CARD_RESULT_LIMIT,
  });
  const totalCount = await db.school.count({ where });

  const schoolsWithDistance = schools.map((school) => {
    const distanceMiles =
      geocodedOrigin && school.lat !== null && school.lng !== null
        ? haversineMiles(geocodedOrigin, { lat: school.lat, lng: school.lng })
        : null;

    const relevanceScore = calculateSchoolRelevance({
      schoolName: school.name,
      city: school.city,
      zipcode: school.zipcode,
      averageRating: school.averageRating,
      isVerified: school.isVerified,
      q: normalizedQ,
      town: normalizedTown,
      zipcodeFilter: zipcode,
    });

    return {
      ...school,
      distanceMiles,
      relevanceScore,
    };
  });

  const sorted = [...schoolsWithDistance];
  if (sort === "distance") {
    sorted.sort((a, b) => {
      if (a.distanceMiles === null) return 1;
      if (b.distanceMiles === null) return -1;
      return a.distanceMiles - b.distanceMiles;
    });
  } else if (sort === "rating") {
    sorted.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
  } else if (sort === "tuition_low") {
    sorted.sort((a, b) => (a.minTuition ?? Number.MAX_SAFE_INTEGER) - (b.minTuition ?? Number.MAX_SAFE_INTEGER));
  } else if (sort === "tuition_high") {
    sorted.sort((a, b) => (b.maxTuition ?? 0) - (a.maxTuition ?? 0));
  } else {
    sorted.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      if ((b.averageRating ?? 0) !== (a.averageRating ?? 0)) {
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
  }

  const term = normalizeQuery(
    buildSearchTerm({
      q,
      zipcode,
      town,
      daycare,
      verified,
      minTuition,
      maxTuition,
      minAge,
      maxAge,
    }),
  );

  return { schools: sorted, totalCount, term, geocodedOrigin };
}

export async function searchSchools(input: SchoolSearchInput) {
  const cacheKey = toCacheKey(input);
  const cached = readCachedValue(searchCache, cacheKey);
  if (cached) {
    return cached;
  }

  const result = await runSchoolSearch(input);
  writeCachedValue(searchCache, cacheKey, SEARCH_CACHE_TTL_MS, result);
  return result;
}

async function runSchoolMarkerSearch(input: SchoolSearchInput) {
  const where = buildSchoolSearchWhere(input);
  return await db.school.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      lat: true,
      lng: true,
      city: true,
      state: true,
    },
    orderBy: [{ isVerified: "desc" }, { name: "asc" }],
    take: MAP_MARKER_LIMIT,
  });
}

export async function searchSchoolMarkers(input: SchoolSearchInput) {
  const cacheKey = toCacheKey(input);
  const cached = readCachedValue(markerCache, cacheKey);
  if (cached) {
    return cached;
  }

  const result = await runSchoolMarkerSearch(input);
  writeCachedValue(markerCache, cacheKey, MARKER_CACHE_TTL_MS, result);
  return result;
}

export async function getSchoolBySlug(slug: string) {
  return db.school.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
