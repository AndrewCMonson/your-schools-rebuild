import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claims & Verification Policy",
  description:
    "How school ownership claims are evaluated and how verified badges are assigned.",
  alternates: {
    canonical: "/policies/claims-verification",
  },
  openGraph: {
    url: "/policies/claims-verification",
  },
};

export default function ClaimsPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Claims & verification policy</h1>
      <div className="surface space-y-3 p-6 text-sm leading-7 md:text-base">
        <p>Schools can submit claim requests with role details, contact information, and ownership proof. Claims are reviewed by admins.</p>
        <p>Approved claims can unlock profile management access and verified status. Rejected claims remain unverified.</p>
        <p>Verification confirms account relationship to a school profile. It does not represent platform endorsement.</p>
      </div>
    </section>
  );
}
