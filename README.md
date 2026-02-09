# YourSchools Rebuild

Production-grade Next.js App Router rebuild for `yourschools.co`.

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS + shadcn-style component primitives
- NextAuth credentials auth
- PostgreSQL + Prisma
- Google Maps embed/geocoding-ready
- GitHub Actions CI
- Vitest + Playwright

## Features Included

- Public search by zip/town/name with filters
- Address geosearch + distance sorting
- Interactive Google Map with clustered school pins
- Public school profile pages with SEO metadata
- Favorites (auth required)
- Reviews (auth required, one per user per school)
- Zero-tolerance profanity blocking for review submission
- Review flagging + admin moderation queue
- Claim school form + admin approval workflow + verified badge
- Search history for authenticated users
- Password reset request + tokenized reset flow
- S3/R2 presigned upload pipeline for school images (admin)
- Scheduled geocode updater endpoint for cron
- Scheduled preschool ingestion pipeline (Head Start + NCES + VA/FL/TX direct adapters)
- Scheduled website enrichment pipeline with confidence scoring
- Admin Data Quality dashboard with coverage + dedupe telemetry

## Quick Start

1. Copy env file:
   - `cp .env.example .env.local`
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations:
   - `npm run prisma:migrate`
5. Seed synthetic data:
   - `npm run prisma:seed`
6. Start app:
   - `npm run dev`

### Optional local Docker Postgres

```bash
docker run --name yourschools-postgres \\
  -e POSTGRES_USER=yourschools \\
  -e POSTGRES_PASSWORD=yourschools \\
  -e POSTGRES_DB=yourschools \\
  -p 5433:5432 -d postgres:16
```

## Default Seed Admin

- Email: `admin@yourschools.co`
- Password: `ChangeMe123!`

Change this immediately in non-local environments.

## Testing

- Unit tests: `npm run test:unit`
- E2E tests: `npm run test:e2e`
- Full test suite: `npm run test`

## Deployment

See `docs/CREDENTIALS_SETUP.md` for full credential and deployment setup.

## Preschool Ingestion

- Configure ingestion sources in `.env.local`:
  - `HEAD_START_DATA_URL`
  - `NCES_PK_DATA_URL`
  - `NCES_PK_MAX_ROWS` (optional cap for incremental rollout)
  - VA direct source:
    - `VA_LICENSE_SEARCH_URL`
    - `VA_LICENSE_DETAIL_BASE_URL`
    - `VA_LICENSE_DETAIL_CONCURRENCY` (optional)
    - `VA_LICENSE_MAX_DETAILS` (optional)
  - FL direct source:
    - `FL_LICENSE_API_BASE_URL`
    - `FL_LICENSE_TOKEN_USERNAME`
    - `FL_LICENSE_TOKEN_PASSWORD`
    - `FL_LICENSE_CLIENT_ID`
    - `FL_LICENSE_CLIENT_SECRET`
    - `FL_LICENSE_REFERENCE_LAT` / `FL_LICENSE_REFERENCE_LNG` (optional)
    - `FL_LICENSE_SEARCH_TERMS` (optional comma-separated seeds)
    - `FL_LICENSE_MAX_QUERIES` (optional)
  - TX direct source:
    - `TX_LICENSE_API_BASE_URL`
    - `TX_LICENSE_PAGE_SIZE` (optional)
    - `TX_LICENSE_MAX_PAGES` (optional)
  - Website enrichment:
    - `WEBSITE_ENRICHMENT_SEARCH_PROVIDER` (optional, default `DUCKDUCKGO`)
    - `WEBSITE_ENRICHMENT_MAX_CANDIDATES` (optional)
    - `WEBSITE_ENRICHMENT_PAGE_TIMEOUT_MS` (optional)
- Trigger cron endpoint:
  - `GET /api/cron/ingest/preschools`
  - header: `Authorization: Bearer <CRON_SECRET>`
  - optional query: `?sources=HEAD_START,NCES_PK,VA_LICENSE,FL_LICENSE,TX_LICENSE`
  - `GET /api/cron/enrich/websites`
  - optional query: `?dryRun=true&limit=25&maxCandidates=5`
