# Data Quality + Coverage Implementation Plan

This plan tracks execution for confidence-gated school data, dedupe/merge telemetry, and coverage visibility.

## Phase 1 (Implemented)

1. Extend schema for confidence/provenance metadata on key fields
- Status: completed
- Added: field confidence/source metadata for age, hours, enrollment, and ratio.

2. Add dedupe merge telemetry at source-record level
- Status: completed
- Added: `matchMethod` and `matchConfidence` on source rows.

3. Add coverage snapshot storage
- Status: completed
- Added: `DataCoverageSnapshot` table and refresh action.

4. Build admin dashboard for coverage + dedupe summaries
- Status: completed
- Route: `/admin/data-quality`

5. Confidence-gate user-facing field rendering
- Status: completed
- Applied on school profile and compare views.

## Phase 2 (Next)

1. Source-level state coverage
- Status: pending
- Goal: coverage by state + source for age/hours/enrollment/ratio.

2. Merge review queue for low-confidence matches
- Status: pending
- Goal: queue records where `matchMethod=NAME_ADDRESS` and confidence below threshold.

3. Scheduled coverage snapshots
- Status: pending
- Goal: nightly cron route to rebuild snapshots and detect regressions.

4. Provider-verified overrides
- Status: pending
- Goal: allow school admins to supply hours/enrollment/ratio with audit and moderation.

## Dedupe Rules

1. `SOURCE_ID` exact match
2. `LICENSE` exact match (`state + licenseNumber`)
3. `NAME_ADDRESS` normalized exact match
4. `NEW` when no match

## Display Thresholds

1. Age range: `MEDIUM`+
2. Hours: `HIGH`
3. Enrollment: `MEDIUM`+
4. Ratio: `HIGH`
