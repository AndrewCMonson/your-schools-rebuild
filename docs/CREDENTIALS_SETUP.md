# Credentials + Deployment Checklist

This is the single source for launch credentials, seeded access accounts, and production deployment steps for `yourschools.co`.

## Seeded Access Credentials (Local/Initial Bootstrap)

Run `npm run prisma:seed` to create these accounts:

1. Site Admin
- Email: `admin@yourschools.co`
- Password: `ChangeMe123!`

2. School Admin
- Email: `schooladmin@yourschools.co`
- Password: `ChangeMe123!`
- Scope: seeded with active membership on one school

3. Parent Test User
- Email: `parent@yourschools.co`
- Password: `ChangeMe123!`

Required post-deploy action: change all default passwords immediately.

## Required Environment Variables

Copy `.env.example` and provide values for all of the following:

1. Core
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

2. Google
- `GOOGLE_MAPS_API_KEY`
- `GOOGLE_GEOCODING_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

3. Object storage
- `S3_REGION`
- `S3_BUCKET_NAME`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

4. Email
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

5. Monitoring and jobs
- `SENTRY_DSN`
- `CRON_SECRET`
- `HEAD_START_DATA_URL`
- `NCES_PK_DATA_URL`
- `NCES_PK_MAX_ROWS` (optional)
- `VA_LICENSE_SEARCH_URL` (optional override)
- `VA_LICENSE_DETAIL_BASE_URL` (optional override)
- `VA_LICENSE_DETAIL_CONCURRENCY` (optional)
- `VA_LICENSE_MAX_DETAILS` (optional)
- `FL_LICENSE_API_BASE_URL` (optional override)
- `FL_LICENSE_TOKEN_USERNAME` (optional override)
- `FL_LICENSE_TOKEN_PASSWORD` (optional override)
- `FL_LICENSE_CLIENT_ID` (optional override)
- `FL_LICENSE_CLIENT_SECRET` (optional override)
- `FL_LICENSE_REFERENCE_LAT` / `FL_LICENSE_REFERENCE_LNG` (optional)
- `FL_LICENSE_SEARCH_TERMS` (optional comma-separated seed terms)
- `FL_LICENSE_MAX_QUERIES` (optional)
- `TX_LICENSE_API_BASE_URL` (optional override)
- `TX_LICENSE_PAGE_SIZE` (optional)
- `TX_LICENSE_MAX_PAGES` (optional)
- `WEBSITE_ENRICHMENT_SEARCH_PROVIDER` (optional, default `DUCKDUCKGO`)
- `WEBSITE_ENRICHMENT_MAX_CANDIDATES` (optional)
- `WEBSITE_ENRICHMENT_PAGE_TIMEOUT_MS` (optional)

## Credential Provisioning Steps

1. Database
- Create Postgres instance (Neon or Supabase).
- Copy connection string into `DATABASE_URL` (`sslmode=require` in production).

2. Auth secret
- Generate with `openssl rand -base64 32`.
- Set value to `NEXTAUTH_SECRET`.
- Set `NEXTAUTH_URL=https://yourschools.co` in production.

3. Google Maps and Geocoding
- Create Google Cloud project.
- Enable Maps JavaScript API and Geocoding API.
- Create two keys (or one shared key if preferred):
  - server-side key for `GOOGLE_MAPS_API_KEY` and/or `GOOGLE_GEOCODING_API_KEY`
  - browser key for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Restrict browser key by referrer to `https://yourschools.co/*`.

4. S3/R2 storage
- Create bucket for school images.
- Create least-privilege IAM credentials with object write/read.
- Fill storage env vars.

5. SMTP
- Provision transactional email provider.
- Set SMTP vars and `EMAIL_FROM=noreply@yourschools.co`.

6. Sentry
- Create project and copy DSN to `SENTRY_DSN`.

7. Cron secret
- Generate random token for `CRON_SECRET`.
- Use same secret in scheduler calls to `/api/cron/geocode`.

## Step-by-Step Deployment Checklist

1. Preflight
- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run test:e2e`

2. Vercel project setup
- Import repository to Vercel.
- Set framework to Next.js.
- Add all environment variables above for Production/Preview as needed.

3. Domain setup
- Attach `yourschools.co` to Vercel project.
- Configure DNS records as prompted by Vercel.
- Confirm SSL issued and active.

4. Database rollout
- Ensure production DB is reachable from Vercel.
- Run Prisma migrations against production DB.
- Seed only if you want synthetic bootstrap data in production.

5. Deploy
- Trigger production deployment from `main`.
- Confirm build succeeds and health pages load.

6. Post-deploy verification
- Validate anonymous routes: `/`, `/schools`, `/schools/[slug]`, `/compare`.
- Validate auth routes: signup, login, forgot/reset password.
- Validate parent flows: review submission, favorites, compare.
- Validate school portal flows: `/portal`, school profile edits, image upload attach, flag responses.
- Validate site admin flows: `/admin` claims, flags, memberships, audit logs.
- Validate sitemap and indexing:
  - `/robots.txt`
  - `/sitemap.xml`

7. Cron setup
- Schedule periodic call to `GET /api/cron/geocode`.
- Send header `Authorization: Bearer <CRON_SECRET>`.
- Schedule periodic call to `GET /api/cron/ingest/preschools`.
- Optional targeted runs:
  - `GET /api/cron/ingest/preschools?sources=HEAD_START`
  - `GET /api/cron/ingest/preschools?sources=NCES_PK`
  - `GET /api/cron/ingest/preschools?sources=VA_LICENSE`
  - `GET /api/cron/ingest/preschools?sources=FL_LICENSE`
  - `GET /api/cron/ingest/preschools?sources=TX_LICENSE`
- Schedule periodic call to `GET /api/cron/enrich/websites`.
- Optional dry run:
  - `GET /api/cron/enrich/websites?dryRun=true&limit=25`

8. CI
- Existing GitHub Actions workflow runs: typecheck, lint, unit tests, build.
- If later enabling Vercel deploy from Actions, add:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## Security Hardening Checklist

1. Rotate seeded/default passwords.
2. Restrict Google and storage credentials to least privilege.
3. Enforce DB backups and retention.
4. Keep `NEXTAUTH_SECRET` and `CRON_SECRET` unique per environment.
5. Keep production environment values only in Vercel/project secret stores.
