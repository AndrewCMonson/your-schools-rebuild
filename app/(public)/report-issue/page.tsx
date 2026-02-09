import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Report An Issue",
  description:
    "Report incorrect school data, moderation concerns, or verification issues.",
  alternates: {
    canonical: "/report-issue",
  },
  openGraph: {
    url: "/report-issue",
  },
};

export default function ReportIssuePage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Report an issue</h1>
      <div className="surface space-y-4 p-6 text-sm leading-7 md:text-base">
        <p>Use this channel to report incorrect school details, suspicious claims, moderation concerns, or profile ownership issues.</p>
        <p>Include the school name, profile URL, and a concise description so admin reviewers can resolve quickly.</p>
        <div className="flex flex-wrap gap-2">
          <a href="mailto:support@yourschools.co?subject=Issue%20Report%20-%20YourSchools">
            <Button>Email Support</Button>
          </a>
          <Link href="/schools">
            <Button variant="outline">Back to Search</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
