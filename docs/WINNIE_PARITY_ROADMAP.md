# Winnie Parity Roadmap (Incremental Implementation)

Last updated: 2026-02-09

## Goal

Build a focused path to reach competitive parity with Winnie where it matters most:
1. Parent conversion (`search -> school detail -> request info/tour`)
2. Provider value (`leads -> response workflow -> profile quality`)
3. Supply/data quality moat (fresh availability + reliable licensing/profile data)
4. Monetization path (sponsored placements, then jobs/growth products)

Build explicit product advantages beyond parity:
1. Trust transparency moat (field-level source, confidence, freshness visible to parents)
2. Quality-weighted ranking moat (freshness + responsiveness + completeness, not just spend)
3. Faster provider operations (lowest-friction inbox and update workflows in category)
4. Stronger data reliability (coverage telemetry + stale-data controls + auditability)

## Better-Than-Winnie Pillars (Non-Negotiable)

1. Source transparency on profiles
   - show where key facts came from (`provider`, `license`, `ingested`) and when updated
2. Confidence-aware UX
   - render high-confidence facts prominently and degrade uncertain facts clearly
3. Freshness-first search
   - opening availability and response behavior materially influence ranking
4. Trust-safe monetization
   - sponsored placement never overrides minimum quality thresholds

## Planning Assumptions

1. Team capacity: ~2-4 engineers, 2-week sprints.
2. Existing baseline: search/discovery, school profiles, claims/verification, portal, ingestion, and SEO foundations already exist.
3. This plan targets an initial 6-month delivery window with measurable checkpoints.

## Success Metrics (Define Before Build)

Track weekly and by cohort:
1. Parent funnel
   - Search to school detail CTR
   - School detail to `Request Info` conversion
   - `Request Info` to `Tour Requested` conversion
2. Provider performance
   - Median first-response time
   - % inquiries answered in 24h
   - % profiles updated in last 30 days
3. Marketplace quality
   - % listings with fresh openings status (<= 14 days old)
   - % listings with licensing metadata
   - Zero-result searches (count + top intents)
4. Revenue readiness
   - # schools eligible for sponsored listings
   - Sponsored click-through and lead lift (later phases)
5. Differentiation metrics
   - % key profile fields with source + freshness shown to parents
   - % search impressions where ranking includes freshness/responsiveness signal
   - parent trust metric (profile detail interactions with transparency modules)
   - provider action time to update openings (median minutes from login)

## Roadmap (Now / Next / Later)

## Now (Phase 1-2): Core Conversion + Lead Workflow

### Phase 1 (Sprints 1-2): Inquiry Capture + Inbox MVP

Problem:
Parents can review schools, but there is no direct lead handoff loop to providers.

Deliverables:
1. Parent CTA: `Request Info` on school detail and cards.
2. New domain entities:
   - `Inquiry`
   - `InquiryMessage`
   - `InquiryStatusHistory`
3. Provider inbox in portal:
   - list inquiries
   - mark status (`NEW`, `CONTACTED`, `TOUR_SCHEDULED`, `CLOSED`)
   - add internal notes
4. Notifications:
   - email alert to school admins on new inquiry
5. Admin visibility:
   - basic inquiry dashboard (volume, unresponded backlog)
6. Better-than parity:
   - capture `response due by` timestamps for SLA enforcement from day one
   - define quality gating contract now for future sponsored inventory eligibility

Acceptance criteria:
1. Parent can submit inquiry without errors and sees confirmation.
2. Assigned school admins can view/respond to inquiries scoped to their school.
3. Every status change is audit-logged.
4. Median response-time metric can be computed from stored timestamps.
5. Inquiry events are analytics-ready for quality-weighted ranking inputs.

Dependencies:
1. SMTP reliability and templates.
2. School membership scoping (already present).

Effort:
1. Medium (2-4 weeks)

### Phase 2 (Sprints 3-4): Response SLA + Trust Badges

Problem:
Parents need quality signals that a school is responsive, not just listed.

Deliverables:
1. Response SLA metrics:
   - first response time
   - response rate (7d/30d)
2. Public trust badges on school pages:
   - `Responds within X hours` (only when sample size threshold met)
3. Provider inbox improvements:
   - quick filters: `new`, `stale`, `needs response`
   - overdue indicator
4. Parent plan linkage:
   - convert inquiry to parent plan states (`CONTACTED`, `TOUR_REQUESTED`) where user is known
5. Better-than parity:
   - publish badge methodology page for response metrics and sample thresholds
   - add "last updated" for responsiveness badge calculations

Acceptance criteria:
1. Badge logic excludes noisy/low-volume schools.
2. Portal users can find stale inquiries quickly.
3. Parent conversion events are traceable in analytics.
4. Parent-facing trust documentation is live and linked from badges.

Dependencies:
1. Phase 1 inquiry data model.

Effort:
1. Small/Medium (1-3 weeks)

## Next (Phase 3-4): Openings Freshness + Provider Analytics

### Phase 3 (Sprints 5-6): Openings and Availability Freshness

Problem:
Winnie-like workflows rely on "openings now" confidence, which currently does not exist.

Deliverables:
1. Availability model:
   - `hasOpenings` (boolean/enum)
   - `openingsDetails` (optional text/age bands)
   - `openingsUpdatedAt`
   - `openingsSource` (`PROVIDER`, `INGESTION`, `ADMIN`)
2. Provider UI:
   - update openings quickly from portal
   - set expected next update date
3. Parent UX:
   - search filter `Openings Now`
   - freshness labels (`Updated 3 days ago`)
4. Data guardrails:
   - stale status if outdated beyond threshold (for example 14 days)
   - reminder nudges to provider admins
5. Better-than parity:
   - parent-facing source + freshness chip on openings (`Provider updated 5 days ago`)
   - ranking boost only for fresh openings data, not stale self-reports

Acceptance criteria:
1. Openings filter returns deterministic results.
2. Stale listings are clearly labeled and not shown as fresh.
3. Update reminders trigger and are tracked.
4. Ranking behavior for openings is explainable and test-covered.

Dependencies:
1. Inquiry funnel (to prioritize high-intent schools for nudges).
2. Notification pipeline.

Effort:
1. Medium (2-4 weeks)

### Phase 4 (Sprints 7-8): Provider Funnel Analytics + Ops Dashboard

Problem:
Providers need evidence that profile quality and responsiveness produce outcomes.

Deliverables:
1. Provider analytics cards:
   - profile views
   - inquiries received
   - response time
   - conversion to tour/apply states
2. Admin analytics:
   - market-level conversion funnel by city/state
   - outlier detection (high views, low conversion)
3. Data-quality linkage:
   - profile completeness score shown in portal
   - recommendations to improve ranking/conversion
4. Better-than parity:
   - provider "next best action" recommendations generated from conversion bottlenecks
   - transparency module engagement tracked as a trust KPI

Acceptance criteria:
1. School admins can see 30d trend snapshots.
2. Completeness score is reproducible from schema fields.
3. Admin can identify top 20 underperforming listings.
4. At least one automated recommendation is surfaced for each low-performing listing.

Dependencies:
1. Inquiry + openings instrumentation.

Effort:
1. Small/Medium (1-3 weeks)

## Later (Phase 5-6): Monetization + Expansion

### Phase 5 (Sprints 9-10): Sponsored Listings MVP

Problem:
Need a monetization layer once conversion and trust are stable.

Deliverables:
1. Sponsored placement model and targeting controls.
2. Ranking injection rules with explicit ad labeling.
3. Budget/credit tracking (MVP, manual top-up acceptable).
4. Provider reporting:
   - sponsored impressions
   - clicks
   - inquiries attributable
5. Better-than parity:
   - sponsored eligibility requires minimum freshness + responsiveness + profile completeness
   - parent UI includes "Why am I seeing this?" disclosure for promoted placements

Acceptance criteria:
1. Ads are clearly labeled and policy-compliant.
2. Organic ranking and sponsored logic can be toggled independently.
3. Finance/export fields exist for invoicing reconciliation.
4. Sponsored listings failing quality thresholds are auto-suppressed.

Dependencies:
1. Phase 1-4 stable conversion event tracking.
2. Policy/legal review for ad disclosures.

Effort:
1. Medium (2-4 weeks)

### Phase 6 (Sprints 11-12): Jobs/Staffing and Integrations

Problem:
Winnie includes provider growth surfaces beyond listing promotion.

Deliverables:
1. Jobs MVP:
   - school job postings
   - candidate interest flow
   - school-side management status
2. Integration readiness:
   - CSV export for leads/jobs
   - webhook events for inquiry lifecycle
3. Reliability improvements:
   - failed-webhook retry queue
   - operational audit dashboards
4. Better-than parity:
   - integration sync health panel for providers (last sync time, errors, retry status)

Acceptance criteria:
1. Schools can publish/manage roles without admin intervention.
2. Lead and jobs events are exportable.
3. Webhook delivery reliability >= 99% with retries.
4. Provider can self-diagnose integration issues from the portal.

Dependencies:
1. Provider identity and permission model (already available).
2. Notification and queue support.

Effort:
1. Medium/Large (3-6 weeks)

## Detailed Sprint Backlog (First 8 Weeks)

### Sprint 1
1. Schema and migrations for inquiries.
2. Server actions + validation for inquiry creation.
3. School detail `Request Info` UI.
4. Basic provider inbox list screen.
5. Unit tests for validation and RBAC.

### Sprint 2
1. Inquiry detail view + status transitions.
2. Provider notes and activity timeline.
3. Notification emails.
4. Admin inquiry backlog view.
5. E2E flow: parent submit -> provider responds.

### Sprint 3
1. Response SLA aggregation jobs/views.
2. Portal filters (`new`, `stale`, `overdue`).
3. Public responsiveness badge logic.
4. Analytics events for inquiry lifecycle.

### Sprint 4
1. Parent plan integration with inquiry outcomes.
2. Dashboard cards for response metrics.
3. Publish response badge methodology + trust docs.
4. Hardening and bugfix sprint.

### Sprint 5
1. Openings schema + migrations + provider update UI.
2. Openings freshness chip on school profiles.
3. Stale data reminder job.

### Sprint 6
1. `Openings Now` filter + ranking integration.
2. Ranking explainability tests and observability.
3. Provider update prompts for stale listings.

## Cross-Cutting Engineering Requirements

1. Observability
   - add events for each funnel step
   - add error rate and latency monitors on write paths
2. Security and abuse prevention
   - rate-limit inquiry submission
   - anti-spam heuristics and moderation queue
3. Data governance
   - audit logs for provider/admin field overrides
   - explicit source metadata for trust-sensitive fields
4. Testing gates
   - required unit tests for validations and scoring logic
   - required e2e for happy path + permission boundaries
5. Transparency standards
   - key profile fields should support source + freshness metadata where possible
   - any ranking-affecting trust signal must have documented logic

## Risks and Mitigations

1. Low provider response rates can hurt parent trust.
   - Mitigation: nudges, SLA badge thresholds, stale warnings.
2. Spam inquiries can overload providers.
   - Mitigation: rate limits, duplicate suppression, abuse scoring.
3. Incomplete availability data can mislead ranking.
   - Mitigation: freshness gating + confidence labels.
4. Monetization too early can degrade trust.
   - Mitigation: only launch sponsored after conversion and trust baselines are stable.
5. Opaque ranking can reduce parent trust.
   - Mitigation: publish explainers and maintain auditable ranking factors.

## Out of Scope (For This Roadmap Window)

1. Full CRM replacement.
2. End-to-end enrollment/payment processing.
3. Native mobile apps.

## Decision Checkpoints

1. End of Sprint 2:
   - Is inquiry capture and provider response loop stable?
2. End of Sprint 4:
   - Are response metrics and trust badges improving conversion?
3. End of Sprint 8:
   - Is openings freshness high enough to market `Openings Now` confidently?
4. End of Sprint 10:
   - Is sponsored MVP ready without harming user trust metrics?
