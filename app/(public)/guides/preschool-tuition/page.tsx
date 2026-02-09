import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typical Preschool Tuition By City",
  description:
    "How to interpret preschool tuition ranges by city and use cost context to shortlist realistic options.",
  alternates: {
    canonical: "/guides/preschool-tuition",
  },
  openGraph: {
    url: "/guides/preschool-tuition",
  },
};

export default function PreschoolTuitionGuidePage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Guide · Updated February 9, 2026 · By YourSchools Editorial</p>
        <h1 className="text-3xl font-bold md:text-4xl">Typical preschool tuition by city</h1>
        <p className="text-muted-foreground">Use tuition ranges as a planning tool, not a final decision signal by itself.</p>
      </header>
      <article className="surface space-y-4 p-6 text-sm leading-7 md:text-base">
        <p>Tuition can vary dramatically by neighborhood, schedule type, and included services. Compare ranges against your budget and required care hours.</p>
        <p>When you review profiles, evaluate cost together with ratings, program transparency, and verified status to avoid over-indexing on price alone.</p>
        <p>In search, use minimum and maximum tuition filters to narrow quickly, then review shortlisted schools in compare mode.</p>
      </article>
    </section>
  );
}
