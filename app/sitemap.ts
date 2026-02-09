import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { slugifySegment } from "@/lib/location-slugs";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const schools = await db.school.findMany({
    where: {
      slug: { not: "" },
      name: { not: "" },
      city: { not: "" },
      state: { not: "" },
      address: { not: "" },
    },
    select: {
      slug: true,
      city: true,
      state: true,
      updatedAt: true,
    },
  });

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl.origin}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl.origin}/schools`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl.origin}/compare`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl.origin}/guides`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/guides/choose-preschool`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/guides/preschool-tuition`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/guides/verified-schools`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl.origin}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl.origin}/policies/reviews`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl.origin}/policies/claims-verification`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl.origin}/report-issue`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const schoolPages = schools.map((school: (typeof schools)[number]) => ({
    url: `${siteUrl.origin}/schools/${school.slug}`,
    lastModified: school.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const cityPagesMap = new Map<string, Date>();
  for (const school of schools) {
    const stateSlug = slugifySegment(school.state);
    const citySlug = slugifySegment(school.city);
    if (!stateSlug || !citySlug) {
      continue;
    }
    const cityUrl = `${siteUrl.origin}/preschools/${stateSlug}/${citySlug}`;
    const existing = cityPagesMap.get(cityUrl);
    if (!existing || school.updatedAt > existing) {
      cityPagesMap.set(cityUrl, school.updatedAt);
    }
  }
  const cityPages: MetadataRoute.Sitemap = Array.from(cityPagesMap.entries()).map(([url, lastModified]) => ({
    url,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...staticPages, ...cityPages, ...schoolPages];
}
