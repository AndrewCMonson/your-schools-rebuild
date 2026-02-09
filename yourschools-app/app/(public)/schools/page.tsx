import { searchSchoolMarkers, searchSchools } from "@/lib/schools";
import { SchoolSearchForm } from "@/components/school-search-form";
import { SearchResultsExplorer } from "@/components/schools/search-results-explorer";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { Prisma } from "@prisma/client";

interface SchoolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: SchoolsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const normalized = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const hasQueryFilters = Object.values(normalized).some(Boolean);

  return {
    title: "Search Schools",
    description:
      "Search early education schools by school name, town/city, or zipcode. Filter by daycare availability, tuition range, age range, and verified status.",
    alternates: {
      canonical: "/schools",
    },
    openGraph: {
      url: "/schools",
    },
    robots: hasQueryFilters
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  const params = await searchParams;
  const normalized = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const { schools, totalCount, term, geocodedOrigin } = await searchSchools(normalized);
  const mapSchools = await searchSchoolMarkers(normalized);
  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || process.env.GOOGLE_MAPS_MAP_ID || "";
  const activeFilters = Object.entries(normalized).filter(([, value]) => Boolean(value));
  const shouldTrackSearch = Boolean(term) || activeFilters.length > 0;

  const session = await getServerSession(authOptions);
  if (shouldTrackSearch) {
    const baseData = {
      query: term || "filtered-search",
      zipcode: normalized.zipcode,
      town: normalized.town,
      schoolName: normalized.q,
      filtersJson: {
        ...normalized,
        resultCount: totalCount,
        hasResults: totalCount > 0,
      },
    };

    try {
      await db.searchHistory.create({
        data: {
          ...baseData,
          userId: session?.user?.id,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        await db.searchHistory.create({
          data: baseData,
        });
      }
    }
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I search without creating an account?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can search and view school profiles publicly. Accounts are only required for favorites, reviews, and planning features.",
        },
      },
      {
        "@type": "Question",
        name: "What does a verified school mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Verified schools have completed a claim workflow and were approved by the platform administrator.",
        },
      },
      {
        "@type": "Question",
        name: "How is distance sorting calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Distance sorting uses your entered address (or map center) and calculates miles from each school's coordinates.",
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <JsonLd data={faqLd} />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Search Schools</h1>
        <p className="text-muted-foreground">Public search is open. Sign in to save favorites and leave reviews.</p>
      </div>

      <SchoolSearchForm />

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map(([key, value]) => {
            const next = new URLSearchParams(normalized as Record<string, string>);
            next.delete(key);
            return (
              <Link key={key} href={`/schools?${next.toString()}`}>
                <Badge variant="secondary" className="cursor-pointer">
                  {key}: {value}
                </Badge>
              </Link>
            );
          })}
          <Link href="/schools">
            <Button size="sm" variant="outline">Clear all</Button>
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          Found {totalCount} result{totalCount === 1 ? "" : "s"}{term ? ` for "${term}"` : ""}.
        </p>
      </div>

      {schools.length === 0 ? (
        <div className="surface space-y-4 p-10 text-center text-muted-foreground">
          <p>No schools matched these filters.</p>
          <p className="text-sm">
            Try removing one filter, searching by town instead of address, or using a nearby zipcode.
          </p>
        </div>
      ) : (
        <SearchResultsExplorer
          schools={schools}
          mapSchools={mapSchools}
          geocodedOrigin={geocodedOrigin}
          mapApiKey={mapApiKey}
          mapId={mapId}
          activeFilters={{
            daycare: normalized.daycare,
            verified: normalized.verified,
            minTuition: normalized.minTuition,
            maxTuition: normalized.maxTuition,
            minAge: normalized.minAge,
            maxAge: normalized.maxAge,
          }}
        />
      )}

      <div className="surface space-y-3 p-6">
        <h2 className="text-xl font-semibold">Search tips for parents</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Start broad with city or zipcode, then narrow with tuition and age range.</li>
          <li>Use verified-only when you need schools with confirmed ownership.</li>
          <li>Shortlist schools in compare, then review details side-by-side.</li>
        </ul>
      </div>
    </section>
  );
}
