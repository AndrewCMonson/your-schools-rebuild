import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export async function GET() {
  const siteUrl = getSiteUrl();

  const body = [
    "# YourSchools (yourschools.co)",
    "",
    "YourSchools helps parents search and compare early education schools.",
    "",
    "Important URLs:",
    `- Homepage: ${siteUrl.origin}/`,
    `- School search: ${siteUrl.origin}/schools`,
    `- Compare: ${siteUrl.origin}/compare`,
    `- How to choose a preschool: ${siteUrl.origin}/guides/choose-preschool`,
    `- Preschool tuition guide: ${siteUrl.origin}/guides/preschool-tuition`,
    `- Verified schools guide: ${siteUrl.origin}/guides/verified-schools`,
    `- About and methodology: ${siteUrl.origin}/about`,
    `- Reviews policy: ${siteUrl.origin}/policies/reviews`,
    `- Claims and verification policy: ${siteUrl.origin}/policies/claims-verification`,
    `- Report an issue: ${siteUrl.origin}/report-issue`,
    `- Sitemap: ${siteUrl.origin}/sitemap.xml`,
    "",
    "Notes:",
    "- Each school has a public detail page at /schools/{slug}.",
    "- City discovery pages are available at /preschools/{state}/{city}.",
    "- Authenticated areas (/portal, /admin, /profile) are not intended for indexing.",
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
