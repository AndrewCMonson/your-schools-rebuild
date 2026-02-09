# SEO Playbook (YourSchools)

This doc focuses on technical SEO for both traditional crawlers and AI assistants.

## Technical SEO checklist

- Canonicals: each indexable route sets `alternates.canonical` to itself (avoid a global canonical in `app/layout.tsx`).
- Indexing: authenticated routes are `noindex, nofollow` (route group layouts: `app/(auth)/layout.tsx`, `app/(app)/layout.tsx`).
- Sitemap: `app/sitemap.ts` includes key routes + school detail pages and is cached via `revalidate`.
- Robots: `app/robots.ts` allows public crawling and disallows private + API routes.
- Social previews: `app/opengraph-image.tsx` provides a default OG image; pages set `openGraph.url`.
- Structured data: JSON-LD is rendered for `Organization`, `WebSite`, and each school detail page.
- Icons/manifest: `app/icon.svg` and `app/manifest.ts` improve rich previews and installability.

## AI discovery (“AI search”) basics

- Keep public pages crawlable and content-rich (LLMs and search engines need text, headings, and stable URLs).
- Prefer explicit entities and fields (school name, address, city/state/zip) and include Schema.org JSON-LD.
- Add `llms.txt` for human/AI browsing hints: `app/llms.txt/route.ts`.

## What to monitor

- Google Search Console: Coverage, Pages, Sitemaps, Enhancements (schema), and Core Web Vitals.
- Bing Webmaster Tools: Index coverage + crawl issues.
- Logs: `robots.txt` and `sitemap.xml` fetch frequency; 5xx spikes.
- Content drift: ensure school pages have non-empty descriptions and accurate address/geo data.

## Local SEO notes (future)

- Add location landing pages (city/state): `/schools/virginia-beach-va`, etc., with unique content + internal links.
- Add “best of” and guide content (FAQs, pricing explanations, verified claims) to build topical authority.

