import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What Verified Means On YourSchools",
  description:
    "Learn how school verification works, what it confirms, and how to use it as one trust signal in your decision process.",
  alternates: {
    canonical: "/guides/verified-schools",
  },
  openGraph: {
    url: "/guides/verified-schools",
  },
};

export default function VerifiedSchoolsGuidePage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Guide · Updated February 9, 2026 · By YourSchools Editorial</p>
        <h1 className="text-3xl font-bold md:text-4xl">What “verified” means on YourSchools</h1>
        <p className="text-muted-foreground">Verification indicates accountability, not endorsement.</p>
      </header>
      <article className="surface space-y-4 p-6 text-sm leading-7 md:text-base">
        <p>A verified badge appears when a school claim is submitted, reviewed, and approved by platform admins.</p>
        <p>Verification means the representative identity and relationship to the school were validated through the claim workflow.</p>
        <p>Parents should still combine verified status with tour outcomes, profile completeness, and review quality.</p>
      </article>
    </section>
  );
}
