# SEO TODO List (Human + AI Search)

This is the actionable checklist to make YourSchools discoverable in Google/Bing *and* by AI assistants.

## Launch blockers (do now)

- [ ] Set `NEXT_PUBLIC_SITE_URL=https://yourschools.co` in production (ensures correct canonicals/OG/sitemap host).
- [ ] Create Google Search Console property and verify domain; submit `/sitemap.xml`.
- [ ] Create Bing Webmaster Tools property; submit `/sitemap.xml`.
- [ ] Ensure `robots.txt` is reachable and not overridden by platform headers.
- [ ] Confirm school detail pages return 200 (not auth-gated) and contain unique text for each school.

## Technical SEO (next 1–2 days)

- [ ] Add per-school `openGraph.images` using a real school photo when available (fallback to default).
- [ ] Add Breadcrumbs JSON-LD on school pages (Home → Schools → School).
- [ ] Add `School`-style schema only where accurate (avoid types you can’t support with real fields).
- [ ] Filter sitemap entries to *public* schools only (exclude drafts/incomplete records if those exist).
- [ ] Decide indexing policy for parameterized search pages:
  - Option A: canonical to `/schools` (current) and accept discovery via internal links.
  - Option B: allow selected “static” filter pages (e.g. `/schools/verified`, `/schools/daycare`) and noindex querystring variants.
- [ ] Add a lightweight “SEO build check” in CI: `npm run typecheck && npm run test:unit` (and optionally e2e).

## Performance & crawl efficiency (this week)

- [ ] Reduce `force-dynamic` usage on public pages where possible (prefer ISR with `revalidate`).
- [ ] Add caching for the `/schools` list query (server-side) where safe to reduce TTFB.
- [ ] Fix Next/Image warnings about remote SVG placeholders (either switch to PNG placeholders or allow SVG safely) to avoid runtime errors and improve CWV.
- [ ] Audit Core Web Vitals (LCP/CLS/INP) on:
  - `/`
  - `/schools`
  - `/schools/{slug}`

## Content & information architecture (highest ROI)

- [ ] Create city/state landing pages with unique copy + internal links to schools (e.g. “Preschools in Virginia Beach, VA”).
- [ ] Add editorial pages that match search intent:
  - “How to choose a preschool”
  - “Typical preschool tuition by city”
  - “What ‘verified’ means on YourSchools”
- [ ] Add FAQ sections on key pages (and FAQ schema when the content is truly Q/A).
- [ ] Strengthen internal linking:
  - From home → top cities → school search pre-filtered
  - From school pages → nearby/alternative schools

## Trust & E‑E‑A‑T (ongoing)

- [ ] Add an “About / Methodology” page explaining data sources, verification, moderation, and how ratings work.
- [ ] Add author/organization transparency for guides (who wrote it, last updated).
- [ ] Add “Report an issue” and visible policies (reviews, claims, verification).

## AI discoverability (ongoing)

- [ ] Keep `llms.txt` current with top entry points and what’s indexable.
- [ ] Ensure every school page clearly states entity facts in plain text:
  - Name, full address, city/state/zip, ages served, tuition range, hours, verification status.
- [ ] Add citations/attribution where you can (data source/provenance for claims).

## Measurement

- [ ] Define KPI dashboard:
  - Indexed pages, impressions, clicks (GSC)
  - Branded vs non-branded queries
  - School page CTR, conversion to signup/favorite/review
- [ ] Track “zero result” searches in-app to guide content creation and data ingestion.

