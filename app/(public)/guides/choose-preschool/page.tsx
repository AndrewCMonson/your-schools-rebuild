import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "How To Choose A Preschool",
  description:
    "A practical parent checklist for evaluating preschool options by fit, tuition, schedule, class quality, and trust signals.",
  alternates: {
    canonical: "/guides/choose-preschool",
  },
  openGraph: {
    url: "/guides/choose-preschool",
  },
};

export default function ChoosePreschoolGuidePage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the most important preschool factors to compare first?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Start with non-negotiables: budget, schedule, age fit, and commute. Then compare classroom quality, ratios, and parent review quality.",
        },
      },
      {
        "@type": "Question",
        name: "Should I prioritize verified schools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Verified status helps with profile accountability. Use it as one trust signal alongside tours, parent feedback, and policy clarity.",
        },
      },
    ],
  };

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <JsonLd data={faqLd} />
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Guide · Updated February 9, 2026 · By YourSchools Editorial</p>
        <h1 className="text-3xl font-bold md:text-4xl">How to choose a preschool</h1>
        <p className="text-muted-foreground">Use this decision framework to shortlist faster without missing critical details.</p>
      </header>
      <article className="surface space-y-4 p-6 text-sm leading-7 md:text-base">
        <h2 className="text-xl font-semibold">1. Define your non-negotiables</h2>
        <p>Document your tuition ceiling, care schedule, acceptable commute, and child age fit before you compare schools.</p>
        <h2 className="text-xl font-semibold">2. Compare quality and outcomes</h2>
        <p>Review parent ratings, class size proxies, and consistency signals like published hours, clear policies, and profile completeness.</p>
        <h2 className="text-xl font-semibold">3. Validate trust and fit in person</h2>
        <p>Tour top options, ask about communication cadence, and confirm details that matter most for your child’s routine.</p>
      </article>
    </section>
  );
}
