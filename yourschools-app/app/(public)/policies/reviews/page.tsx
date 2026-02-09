import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Policy",
  description:
    "YourSchools review rules, moderation standards, and enforcement process.",
  alternates: {
    canonical: "/policies/reviews",
  },
  openGraph: {
    url: "/policies/reviews",
  },
};

export default function ReviewPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Review policy</h1>
      <div className="surface space-y-3 p-6 text-sm leading-7 md:text-base">
        <p>Each user may submit one review per school. Reviews must be factual, experience-based, and free of profanity.</p>
        <p>Flagged reviews enter moderation review. Admins can keep, hide, or remove content based on policy and evidence.</p>
        <p>School representatives may submit a response during moderation, but final publish status is admin-controlled.</p>
      </div>
    </section>
  );
}
