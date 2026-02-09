"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  getAgeRangeText,
  getEnrollmentText,
  getRatioText,
} from "@/lib/school-field-display";

interface SchoolOption {
  id: string;
  name: string;
}

interface ComparedSchool {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  zipcode: string;
  minTuition: number | null;
  maxTuition: number | null;
  minAge: number | null;
  maxAge: number | null;
  preschoolEnrollmentCount: number | null;
  schoolWideEnrollment: number | null;
  schoolWideStudentTeacherRatio: number | null;
  ageDataConfidence: DataConfidence;
  enrollmentDataConfidence: DataConfidence;
  ratioDataConfidence: DataConfidence;
  offersDaycare: boolean;
  isVerified: boolean;
  averageRating: number | null;
  reviewCount: number;
  website: string | null;
}

const MAX_COMPARE = 4;
type DataConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export function CompareWorkspace({
  schools,
  options,
}: {
  schools: ComparedSchool[];
  options: SchoolOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const ids = useMemo(
    () => (params.get("ids") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    [params],
  );

  const pushIds = (nextIds: string[]) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("yourschools:compareIds", nextIds.join(","));
    }
    if (nextIds.length === 0) {
      router.push("/compare");
      return;
    }
    router.push(`/compare?ids=${nextIds.join(",")}`);
  };

  useEffect(() => {
    if (ids.length > 0 || typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem("yourschools:compareIds");
    if (!stored) return;
    const storedIds = stored.split(",").map((value) => value.trim()).filter(Boolean).slice(0, MAX_COMPARE);
    if (storedIds.length > 0) {
      router.replace(`/compare?ids=${storedIds.join(",")}`);
    }
  }, [ids, router]);

  const addSchool = (schoolId: string) => {
    if (!schoolId) return;
    const next = [...new Set([...ids, schoolId])].slice(0, MAX_COMPARE);
    pushIds(next);
  };

  const removeSchool = (schoolId: string) => {
    pushIds(ids.filter((id) => id !== schoolId));
  };

  return (
    <div className="space-y-6">
      <div className="surface space-y-3 p-4">
        <h2 className="text-xl font-semibold">Compare schools</h2>
        <p className="text-sm text-muted-foreground">Select up to 4 schools to review side-by-side.</p>
        <form
          action={(formData) => {
            addSchool(String(formData.get("schoolId") ?? ""));
          }}
          className="flex flex-wrap gap-2"
        >
          <select name="schoolId" className="h-10 min-w-[260px] rounded-md border border-border bg-white/90 px-3 text-sm">
            <option value="">Choose school to add</option>
            {options.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">Add to compare</Button>
        </form>
      </div>

      {schools.length === 0 ? (
        <div className="surface p-6 text-sm text-muted-foreground">
          No schools selected. Use any Compare button from search results or school pages.
        </div>
      ) : (
        <>
          {(() => {
            const tuitionBest = Math.min(...schools.map((s) => s.minTuition ?? Number.MAX_SAFE_INTEGER));
            const ratingBest = Math.max(...schools.map((s) => s.averageRating ?? 0));
            return (
          <div className="surface overflow-x-auto p-4">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Metric</th>
                  {schools.map((school) => (
                    <th key={school.id} className="min-w-[240px] px-3 py-2 text-left font-semibold">{school.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-medium">Location</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-location`} className="rounded-md bg-muted/50 px-3 py-2">
                      {school.city}, {school.state} {school.zipcode}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Rating</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-rating`} className={`rounded-md px-3 py-2 ${(school.averageRating ?? 0) === ratingBest && ratingBest > 0 ? "bg-green-100" : "bg-muted/50"}`}>
                      {school.averageRating?.toFixed(1) ?? "New"} ({school.reviewCount} reviews)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Tuition</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-tuition`} className={`rounded-md px-3 py-2 ${(school.minTuition ?? Number.MAX_SAFE_INTEGER) === tuitionBest ? "bg-green-100" : "bg-muted/50"}`}>
                      ${school.minTuition ?? "?"} - ${school.maxTuition ?? "?"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Age Range</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-age`} className="rounded-md bg-muted/50 px-3 py-2">
                      {getAgeRangeText(school.minAge, school.maxAge, school.ageDataConfidence)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Enrollment</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-enrollment`} className="rounded-md bg-muted/50 px-3 py-2">
                      {getEnrollmentText(
                        null,
                        null,
                        school.preschoolEnrollmentCount,
                        school.schoolWideEnrollment,
                        school.enrollmentDataConfidence,
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Teacher ratio</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-ratio`} className="rounded-md bg-muted/50 px-3 py-2">
                      {getRatioText(null, null, school.schoolWideStudentTeacherRatio, school.ratioDataConfidence)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Daycare</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-daycare`} className="rounded-md bg-muted/50 px-3 py-2">
                      {school.offersDaycare ? "Yes" : "No"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Verified</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-verified`} className="rounded-md bg-muted/50 px-3 py-2">
                      {school.isVerified ? "Yes" : "No"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium">Actions</td>
                  {schools.map((school) => (
                    <td key={`${school.id}-actions`} className="rounded-md bg-muted/50 px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/schools/${school.slug}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeSchool(school.id)}>
                          Remove
                        </Button>
                        {school.website ? (
                          <a href={school.website} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="outline">Website</Button>
                          </a>
                        ) : null}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
            );
          })()}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {schools.map((school) => (
              <article key={school.id} className="surface space-y-3 p-4">
                <h3 className="text-lg font-semibold">{school.name}</h3>
                <p className="text-sm text-muted-foreground">{school.city}, {school.state} {school.zipcode}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
