# SEO Implementation Plan (Based on `docs/SEO_TODO.md`)

This plan converts the SEO TODO checklist into implementation phases with concrete tasks and acceptance criteria for `yourschools-app`.

## Scope and Current-State Summary

The app already has:
- dynamic canonical/host support via `getSiteUrl()` in `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/lib/site-url.ts`
- dynamic `robots.txt` in `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/robots.ts`
- dynamic `sitemap.xml` in `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/sitemap.ts`
- base JSON-LD support via `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/components/seo/json-ld.tsx`
- per-school metadata in `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/[slug]/page.tsx`
- CI pipeline with typecheck/unit/build in `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/.github/workflows/ci.yml`

Primary gaps versus TODO:
- no per-school OG image selection
- no Breadcrumb JSON-LD
- no indexation policy for parameterized search pages
- public pages still use `force-dynamic` heavily
- no city/state landing pages or editorial content pages
- no SEO KPI instrumentation/dashboard path
- no zero-result search tracking

## Phase 0: Launch Blockers (Day 0)

1. Environment and webmaster setup
- Set `NEXT_PUBLIC_SITE_URL=https://yourschools.co` in prod environment.
- Verify Google Search Console property and submit `/sitemap.xml`.
- Verify Bing Webmaster Tools property and submit `/sitemap.xml`.

2. Runtime checks
- Confirm `/robots.txt` returns expected rules in production.
- Confirm `/sitemap.xml` host URLs use `https://yourschools.co`.
- Confirm `/schools/[slug]` pages return HTTP 200 unauthenticated.

Acceptance criteria:
- Search Console and Bing properties verified.
- Sitemaps submitted with no host/canonical mismatch warnings.
- Crawl test shows school pages are public and indexable.

## Phase 1: Core Technical SEO (Day 1-2)

1. Per-school OpenGraph image selection
- On school pages, use first school image when available.
- Fallback to default OG image endpoint.
- File target: `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/[slug]/page.tsx`

2. Breadcrumb JSON-LD
- Add `BreadcrumbList` schema:
  - Home
  - Schools
  - Current school
- Reuse `JsonLd` component.
- File target: `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/[slug]/page.tsx`

3. Schema hygiene
- Keep organization/school-like schema restricted to fields we store reliably.
- Ensure no fabricated fields (e.g., avoid unsupported schema types).
- File target: `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/[slug]/page.tsx`

4. Parameterized indexing policy decision
- Choose and implement:
  - Option A: canonical all query variants to `/schools`
  - Option B: index static route variants and noindex query variants
- Recommended: Option A for now.
- File targets:
  - `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/page.tsx`
  - Optional route creation for static facets if Option B is selected.

5. CI SEO check
- Add a dedicated SEO check script:
  - metadata/canonical/sitemap shape validation
  - existing `tests/e2e/seo.spec.ts`
- Wire into CI after build or in a dedicated job.
- File targets:
  - `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/package.json`
  - `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/.github/workflows/ci.yml`

Acceptance criteria:
- School pages emit valid OG image and breadcrumbs schema.
- Chosen query-indexing policy is fully consistent.
- CI fails on canonical/sitemap/robots regressions.

## Phase 2: Crawl Efficiency and Performance (Day 2-5)

1. Reduce `force-dynamic` on public pages
- Replace with ISR where possible:
  - `/`
  - `/schools`
  - `/schools/[slug]`
  - `/compare`
- Introduce conservative `revalidate` intervals.

2. Cache list queries
- Cache expensive list/marker lookups for `/schools` search where query signatures repeat.
- Candidate targets:
  - `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/lib/schools.ts`

3. Image runtime hygiene
- Ensure all placeholder/remote images are valid and whitelisted.
- Remove SVG/remote warning risk and optimize fallback assets.

4. Core Web Vitals audit
- Measure LCP/CLS/INP for:
  - `/`
  - `/schools`
  - `/schools/[slug]`
- Capture baseline and after metrics.

Acceptance criteria:
- Public pages cache predictably and do not require full dynamic rendering.
- CWV metrics improve or stay within good thresholds.
- No runtime image warnings in production logs.

## Phase 3: Content and Information Architecture (Week 1-2)

1. City/state landing pages
- Add indexable routes with unique copy + internal links to schools.
- Suggested route shape: `/preschools/{state}/{city}`

2. Editorial intent pages
- Create:
  - how to choose a preschool
  - tuition by city
  - what verified means
- Add byline, updated date, and internal links.

3. FAQ blocks + schema
- Add FAQ sections only where real Q/A content exists.
- Emit FAQ schema for those pages.

4. Internal linking improvements
- Home -> top cities -> filtered school pages.
- School detail -> nearby alternatives.

Acceptance criteria:
- New content hubs are crawlable and internally linked from top-level pages.
- FAQ schema validates in Rich Results Test where implemented.

## Phase 4: Trust, E-E-A-T, and AI Discoverability (Week 2)

1. About/methodology page
- Explain data sources, verification, moderation, rating logic.

2. Policy and issue-reporting surfaces
- Add visible:
  - reviews policy
  - claims/verification policy
  - report issue path

3. `llms.txt` maintenance workflow
- Add update checklist tied to new page launches.
- Keep top URLs and indexable scope current.
- File target: `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/llms.txt/route.ts`

4. Entity facts consistency on school pages
- Ensure plain-text factual fields always present:
  - name, full address, city/state/zip, ages, tuition, hours, verification.

Acceptance criteria:
- Trust pages are linked site-wide.
- School pages consistently expose factual summaries in plain text and JSON-LD.

## Phase 5: Measurement and Feedback Loop (Week 2+)

1. KPI instrumentation
- Track:
  - indexed pages, impressions, clicks
  - branded vs non-branded queries
  - school page CTR
  - conversion to signup/favorite/review

2. Zero-result search tracking
- Capture query/filter combinations that produce no results.
- Feed into ingestion/content backlog.
- Target area:
  - `/Users/andrewmonson/coding-projects/your-schools-rebuild/your-schools-codex/yourschools-app/app/(public)/schools/page.tsx`
  - analytics pipeline endpoint or event sink

Acceptance criteria:
- Weekly report includes SEO and in-app search-quality KPIs.
- Zero-result report drives explicit backlog items.

## Execution Order (Recommended)

1. Phase 0 (blocking)
2. Phase 1 (indexation correctness)
3. Phase 2 (crawl + performance)
4. Phase 3 (content growth)
5. Phase 4 (trust + AI discoverability)
6. Phase 5 (measurement loop)

## Risk Notes

- Over-indexing query pages can dilute crawl budget; keep policy explicit.
- Schema overreach can hurt trust; only emit fields with reliable data.
- Excessive dynamic rendering on public pages will increase TTFB and reduce crawl efficiency.

## Definition of Done

- Search engines can reliably crawl and index intended public pages.
- Metadata and structured data are valid and stable.
- Public pages are fast and cacheable.
- Content hubs and internal links support non-branded discovery.
- SEO impact is measurable through recurring KPI tracking.
