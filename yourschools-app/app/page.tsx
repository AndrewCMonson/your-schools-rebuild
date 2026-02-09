import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { slugifySegment, titleCaseWords } from "@/lib/location-slugs";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
  },
};

export default async function HomePage() {
  const [schoolCount, reviewCount, verifiedCount, topCities] = await Promise.all([
    db.school.count(),
    db.review.count({ where: { status: "PUBLISHED" } }),
    db.school.count({ where: { isVerified: true } }),
    db.school.groupBy({
      by: ["city", "state"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          city: "desc",
        },
      },
      take: 8,
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 md:px-8 md:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-7">
          <Badge variant="secondary" className="w-fit">Built by parents, for parents</Badge>
          <h1 className="text-balance text-4xl font-extrabold leading-tight md:text-6xl">
            School discovery that feels as serious as the decision itself.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            Compare early education programs by tuition, care availability, verified status,
            and transparent parent reviews. Search freely. Save and review when signed in.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/schools">
              <Button size="lg">Start Searching</Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline">Create Account</Button>
            </Link>
          </div>
        </div>
        <div className="surface relative overflow-hidden p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">At a glance</p>
              <h2 className="mt-2 text-3xl font-bold">Decision-ready school profiles</h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Zip, town, and school-name search</li>
              <li>• Verified badge with claim workflow</li>
              <li>• Profanity zero tolerance moderation</li>
              <li>• Public SEO pages for each school</li>
            </ul>
            <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-semibold">Live platform trust signals</p>
              <p>{schoolCount} school profiles indexed</p>
              <p>{verifiedCount} verified school profiles</p>
              <p>{reviewCount} parent reviews published</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-bold">Browse by city</h2>
        <div className="flex flex-wrap gap-2">
          {topCities.map((item) => {
            const city = titleCaseWords(item.city);
            const state = item.state.toUpperCase();
            return (
              <Link key={`${item.state}-${item.city}`} href={`/preschools/${slugifySegment(state)}/${slugifySegment(city)}`}>
                <Button variant="outline" size="sm">{city}, {state}</Button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Link href="/guides/choose-preschool" className="surface p-4">
          <h3 className="font-semibold">How to choose a preschool</h3>
          <p className="mt-2 text-sm text-muted-foreground">A parent-first shortlist and tour framework.</p>
        </Link>
        <Link href="/guides/preschool-tuition" className="surface p-4">
          <h3 className="font-semibold">Tuition guide</h3>
          <p className="mt-2 text-sm text-muted-foreground">How to compare cost realistically across schools.</p>
        </Link>
        <Link href="/guides/verified-schools" className="surface p-4">
          <h3 className="font-semibold">Verified schools guide</h3>
          <p className="mt-2 text-sm text-muted-foreground">How verification works and what it means.</p>
        </Link>
      </div>
    </section>
  );
}
