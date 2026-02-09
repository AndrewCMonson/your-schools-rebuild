import { db } from "@/lib/db";
import { CompareWorkspace } from "@/components/schools/compare-workspace";
import type { Metadata } from "next";

interface ComparePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ComparePageProps): Promise<Metadata> {
  const params = await searchParams;
  const idsRaw = Array.isArray(params.ids) ? params.ids[0] : params.ids;
  const hasCompareIds = Boolean(idsRaw?.trim());

  return {
    title: "Compare Schools",
    description:
      "Compare up to four schools side-by-side across tuition, ages served, verification status, and parent reviews.",
    alternates: {
      canonical: "/compare",
    },
    openGraph: {
      url: "/compare",
    },
    robots: hasCompareIds
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

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const idsRaw = Array.isArray(params.ids) ? params.ids[0] : params.ids;
  const ids = (idsRaw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 4);

  const [schools, options] = await Promise.all([
    ids.length
      ? db.school.findMany({
          where: { id: { in: ids } },
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
            preschoolEnrollmentCount: true,
            schoolWideEnrollment: true,
            schoolWideStudentTeacherRatio: true,
            ageDataConfidence: true,
            enrollmentDataConfidence: true,
            ratioDataConfidence: true,
            offersDaycare: true,
            isVerified: true,
            averageRating: true,
            reviewCount: true,
            website: true,
          },
        })
      : Promise.resolve([]),
    db.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const byId = new Map(schools.map((school) => [school.id, school]));
  const orderedSchools = ids.map((id) => byId.get(id)).filter(Boolean) as typeof schools;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold">School Compare</h1>
      <CompareWorkspace schools={orderedSchools} options={options} />
    </section>
  );
}
