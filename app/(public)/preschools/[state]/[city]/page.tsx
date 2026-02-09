import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSiteUrl } from "@/lib/site-url";
import { slugToWords, titleCaseWords } from "@/lib/location-slugs";

interface CityLandingPageProps {
  params: Promise<{ state: string; city: string }>;
}

function normalizeStateCode(value: string) {
  return slugToWords(value).replace(/\s+/g, "").toUpperCase();
}

function normalizeCityLabel(value: string) {
  return titleCaseWords(slugToWords(value));
}

export async function generateMetadata({ params }: CityLandingPageProps): Promise<Metadata> {
  const { state, city } = await params;
  const stateCode = normalizeStateCode(state);
  const cityLabel = normalizeCityLabel(city);
  const schoolCount = await db.school.count({
    where: {
      state: stateCode,
      city: {
        contains: cityLabel,
        mode: "insensitive",
      },
    },
  });

  if (schoolCount === 0) {
    return {
      title: `Preschools in ${cityLabel}, ${stateCode}`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `Preschools in ${cityLabel}, ${stateCode}`;
  return {
    title,
    description: `Compare preschool options in ${cityLabel}, ${stateCode} by tuition, age range, verification status, and parent reviews.`,
    alternates: {
      canonical: `/preschools/${state}/${city}`,
    },
    openGraph: {
      title: `${title} | YourSchools`,
      url: `/preschools/${state}/${city}`,
    },
  };
}

export default async function CityLandingPage({ params }: CityLandingPageProps) {
  const { state, city } = await params;
  const stateCode = normalizeStateCode(state);
  const cityLabel = normalizeCityLabel(city);

  const schools = await db.school.findMany({
    where: {
      state: stateCode,
      city: {
        contains: cityLabel,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      state: true,
      zipcode: true,
      minTuition: true,
      maxTuition: true,
      minAge: true,
      maxAge: true,
      offersDaycare: true,
      isVerified: true,
      averageRating: true,
      reviewCount: true,
    },
    orderBy: [{ isVerified: "desc" }, { averageRating: "desc" }, { name: "asc" }],
    take: 60,
  });

  if (schools.length === 0) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const landingUrl = `${siteUrl.origin}/preschools/${state}/${city}`;
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How do I compare preschools in ${cityLabel}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use tuition, age range, reviews, and verification status together. Start with your non-negotiables, then compare details side-by-side.",
        },
      },
      {
        "@type": "Question",
        name: "What does verified mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Verified means a school representative completed claim review and was approved by platform admins.",
        },
      },
    ],
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl.origin}/` },
      { "@type": "ListItem", position: 2, name: "Schools", item: `${siteUrl.origin}/schools` },
      { "@type": "ListItem", position: 3, name: `Preschools in ${cityLabel}, ${stateCode}`, item: landingUrl },
    ],
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />

      <div className="surface space-y-4 p-6">
        <Badge variant="secondary" className="w-fit">City Guide</Badge>
        <h1 className="text-3xl font-bold md:text-4xl">Preschools in {cityLabel}, {stateCode}</h1>
        <p className="max-w-3xl text-muted-foreground">
          Compare {schools.length} listed schools in {cityLabel}. Review tuition ranges, ages served, daycare availability,
          verification status, and parent ratings before you shortlist.
        </p>
        <Link href={`/schools?town=${encodeURIComponent(cityLabel)}&verified=true`}>
          <Button size="sm" variant="outline">View Verified in Search</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{school.name}</h2>
                  <p className="text-sm text-muted-foreground">{school.city}, {school.state} {school.zipcode}</p>
                </div>
                {school.isVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Tuition ${school.minTuition ?? "?"} - ${school.maxTuition ?? "?"}</Badge>
                <Badge variant="secondary">Ages {school.minAge ?? "?"} - {school.maxAge ?? "?"}</Badge>
                <Badge variant="secondary">{school.offersDaycare ? "Daycare" : "No daycare listed"}</Badge>
                <Badge variant="secondary">{school.averageRating?.toFixed(1) ?? "New"} ★ ({school.reviewCount})</Badge>
              </div>
              <Link href={`/schools/${school.slug}`}>
                <Button size="sm" className="w-full">View School Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
