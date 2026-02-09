import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/layout/providers";
import { getSiteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "YourSchools | Find the right school for your child",
    template: "%s | YourSchools",
  },
  description:
    "Search and compare early education schools by location, tuition, reviews, and verified claims.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "YourSchools | Find the right school for your child",
    description:
      "Search and compare early education schools by location, tuition, reviews, and verified claims.",
    type: "website",
    siteName: "YourSchools",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = getSiteUrl();

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "YourSchools",
    url: siteUrl.origin,
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "YourSchools",
    url: siteUrl.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl.origin}/schools?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <JsonLd data={organizationLd} />
          <JsonLd data={websiteLd} />
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
