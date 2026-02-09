import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & Methodology",
  description:
    "How YourSchools sources school data, applies verification and moderation, and calculates ratings.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">About YourSchools</h1>
        <p className="text-muted-foreground">Built to help families make better preschool decisions with clear, structured comparisons.</p>
      </header>
      <article className="surface space-y-4 p-6 text-sm leading-7 md:text-base">
        <h2 className="text-xl font-semibold">Data methodology</h2>
        <p>School records are assembled from ingestion pipelines and curated admin workflows. Structured fields are normalized and surfaced directly in profiles.</p>
        <h2 className="text-xl font-semibold">Verification and claims</h2>
        <p>Schools can claim profiles through a claim request with supporting information. Claims are reviewed by admins before verification status is granted.</p>
        <h2 className="text-xl font-semibold">Ratings and moderation</h2>
        <p>Ratings are aggregated from published reviews. Review flags route to moderation, and profanity policy is strict.</p>
      </article>
    </section>
  );
}
