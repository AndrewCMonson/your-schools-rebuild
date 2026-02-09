import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { getSchoolBySlug } from "@/lib/schools";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FavoriteButton } from "@/components/schools/favorite-button";
import { ReviewForm } from "@/components/schools/review-form";
import { ClaimForm } from "@/components/schools/claim-form";
import { ReviewFlagForm } from "@/components/schools/review-flag-form";
import { SchoolMap } from "@/components/schools/school-map";
import { CompareButton } from "@/components/schools/compare-button";
import { SchoolGallery } from "@/components/schools/school-gallery";
import { FitSummary } from "@/components/schools/fit-summary";
import { ParentPlanCard } from "@/components/schools/parent-plan-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getAgeRangeText,
  getEnrollmentText,
  getHoursText,
  getRatioText,
} from "@/lib/school-field-display";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

interface SchoolPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = await db.school.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
  });
  if (!school) {
    return { title: "School Not Found" };
  }

  const siteUrl = getSiteUrl();
  const ogImage = school.images[0]?.url ?? `${siteUrl.origin}/opengraph-image`;

  return {
    title: school.name,
    description: school.description ?? `Explore tuition, reviews, and details for ${school.name}.`,
    alternates: {
      canonical: `/schools/${school.slug}`,
    },
    openGraph: {
      title: `${school.name} | YourSchools`,
      description: school.description ?? undefined,
      url: `${siteUrl.origin}/schools/${school.slug}`,
      siteName: "YourSchools",
      type: "website",
      images: [
        {
          url: ogImage,
        },
      ],
    },
  };
}

export default async function SchoolDetailPage({ params, searchParams }: SchoolPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const school = await getSchoolBySlug(slug);

  if (!school) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const reviewSortRaw = Array.isArray(query.reviewSort) ? query.reviewSort[0] : query.reviewSort;
  const reviewSort = reviewSortRaw ?? "newest";

  await db.schoolPageView.create({
    data: {
      schoolId: school.id,
      source: "school_detail",
    },
  });

  let isFavorite = false;
  let planItem: { status: "SAVED" | "TOUR_REQUESTED" | "CONTACTED" | "APPLIED"; notes: string | null; remindAt: Date | null } | null = null;
  if (session?.user?.id) {
    const favorite = await db.favorite.findUnique({
      where: {
        userId_schoolId: {
          userId: session.user.id,
          schoolId: school.id,
        },
      },
      select: { id: true },
    });

    isFavorite = Boolean(favorite);
    planItem = await db.parentPlanItem.findUnique({
      where: {
        userId_schoolId: {
          userId: session.user.id,
          schoolId: school.id,
        },
      },
      select: {
        status: true,
        notes: true,
        remindAt: true,
      },
    });
  }

  const sortedReviews = [...school.reviews].sort((a, b) => {
    if (reviewSort === "highest") return b.rating - a.rating;
    if (reviewSort === "lowest") return a.rating - b.rating;
    if (reviewSort === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const siteUrl = getSiteUrl();
  const schoolUrl = `${siteUrl.origin}/schools/${school.slug}`;

  const hasGeo = school.lat !== null && school.lat !== undefined && school.lng !== null && school.lng !== undefined;

  const schoolLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: school.name,
    url: schoolUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: school.address,
      addressLocality: school.city,
      addressRegion: school.state,
      postalCode: school.zipcode,
      addressCountry: "US",
    },
    geo: hasGeo ? { "@type": "GeoCoordinates", latitude: school.lat, longitude: school.lng } : undefined,
    aggregateRating:
      school.reviewCount && school.averageRating
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(school.averageRating),
            reviewCount: Number(school.reviewCount),
          }
        : undefined,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl.origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Schools",
        item: `${siteUrl.origin}/schools`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: school.name,
        item: schoolUrl,
      },
    ],
  };
  const nearbySchools = await db.school.findMany({
    where: {
      id: { not: school.id },
      city: school.city,
      state: school.state,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      state: true,
      averageRating: true,
    },
    orderBy: [{ averageRating: "desc" }, { name: "asc" }],
    take: 3,
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <JsonLd data={schoolLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="surface space-y-3 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold md:text-4xl">{school.name}</h1>
          {school.isVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Not verified</Badge>}
        </div>
        <p className="text-muted-foreground">{school.address}, {school.city}, {school.state} {school.zipcode}</p>
        <p className="max-w-4xl text-sm md:text-base">{school.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge>Rating: {school.averageRating?.toFixed(1) ?? "New"}</Badge>
          <Badge variant="secondary">{school.reviewCount} reviews</Badge>
          <Badge variant="secondary">Tuition ${school.minTuition ?? "?"} - ${school.maxTuition ?? "?"}</Badge>
          <FavoriteButton schoolId={school.id} isFavorite={isFavorite} disabled={!session?.user} />
          <CompareButton schoolId={school.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <SchoolGallery schoolName={school.name} images={school.images} />
          <FitSummary
            school={{
              minAge: school.minAge,
              maxAge: school.maxAge,
              minTuition: school.minTuition,
              maxTuition: school.maxTuition,
              offersDaycare: school.offersDaycare,
              averageRating: school.averageRating,
              reviewCount: school.reviewCount,
              isVerified: school.isVerified,
              openingHours: school.openingHours,
              closingHours: school.closingHours,
            }}
          />
          <Card>
            <CardHeader>
              <CardTitle>School profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <p><strong>Age range:</strong> {getAgeRangeText(school.minAge, school.maxAge, school.ageDataConfidence)}</p>
              <p><strong>Daycare:</strong> {school.offersDaycare ? "Yes" : "No"}</p>
              <p><strong>Hours:</strong> {getHoursText(school.openingHours, school.closingHours, school.hoursDataConfidence)}</p>
              <p>
                <strong>Enrollment:</strong>{" "}
                {getEnrollmentText(
                  school.minEnrollment,
                  school.maxEnrollment,
                  school.preschoolEnrollmentCount,
                  school.schoolWideEnrollment,
                  school.enrollmentDataConfidence,
                )}
              </p>
              <p>
                <strong>Teacher ratio:</strong>{" "}
                {getRatioText(
                  school.minStudentTeacherRatio,
                  school.maxStudentTeacherRatio,
                  school.schoolWideStudentTeacherRatio,
                  school.ratioDataConfidence,
                )}
              </p>
              <p><strong>Early enrollment:</strong> {school.earlyEnrollment ? "Available" : "Not listed"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nearby alternatives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nearbySchools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No nearby alternatives available yet.</p>
              ) : (
                nearbySchools.map((nearby) => (
                  <div key={nearby.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                    <div>
                      <p className="font-semibold">{nearby.name}</p>
                      <p className="text-xs text-muted-foreground">{nearby.city}, {nearby.state}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{nearby.averageRating?.toFixed(1) ?? "New"} ★</Badge>
                      <Link href={`/schools/${nearby.slug}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Parent reviews</CardTitle>
                <div className="flex gap-2">
                  <Link href={`/schools/${school.slug}?reviewSort=newest`}><Button size="sm" variant={reviewSort === "newest" ? "default" : "outline"}>Newest</Button></Link>
                  <Link href={`/schools/${school.slug}?reviewSort=highest`}><Button size="sm" variant={reviewSort === "highest" ? "default" : "outline"}>Highest</Button></Link>
                  <Link href={`/schools/${school.slug}?reviewSort=lowest`}><Button size="sm" variant={reviewSort === "lowest" ? "default" : "outline"}>Lowest</Button></Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {school.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                sortedReviews.map((review: (typeof school.reviews)[number]) => (
                  <article key={review.id} className="space-y-2 rounded-lg border border-border p-4">
                    <p className="font-semibold">{review.user.name ?? "Parent"} · {review.rating}/5</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {review.childAgeYears !== null ? <Badge variant="secondary">Child age: {review.childAgeYears}</Badge> : null}
                      {review.attendanceMonths !== null ? <Badge variant="secondary">Attendance: {review.attendanceMonths} mo</Badge> : null}
                      {review.pros ? <Badge variant="success">Pro: {review.pros}</Badge> : null}
                      {review.cons ? <Badge variant="warning">Consideration: {review.cons}</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.body}</p>
                    <ReviewFlagForm reviewId={review.id} />
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <SchoolMap lat={school.lat} lng={school.lng} name={school.name} />
          {session?.user ? <ParentPlanCard schoolId={school.id} initial={planItem} /> : null}
          {session?.user ? <ReviewForm schoolId={school.id} /> : <Card className="p-4 text-sm text-muted-foreground">Sign in to leave a review.</Card>}
          {session?.user ? <ClaimForm schoolId={school.id} /> : <Card className="p-4 text-sm text-muted-foreground">Sign in to claim this school.</Card>}
        </div>
      </div>
    </section>
  );
}
