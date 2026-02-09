# Dual Admin + Future Features Task Plan

## Phase 0: RBAC Foundation
- [x] Add `SchoolMembership` model and migration
- [x] Add `AuditLog` model and migration
- [x] Add school-level permission helpers
- [x] Enforce scoped access in school-edit/image actions
- [x] Auto-provision school membership on claim approval

## Phase 1: Site Admin Expansion
- [x] Add membership assignment UI for site admin
- [x] Add membership revoke/suspend UI
- [x] Add audit log panel in site admin
- [x] Show school response context in moderation queue

## Phase 2: School Portal
- [x] Add `/portal` dashboard for school admins
- [x] Add `/portal/schools/[schoolId]` profile editor
- [x] Add school-scoped image management + reorder
- [x] Add school response workflow for review flags
- [x] Add page-view analytics cards per school

## Phase 3: Search/Map Improvements
- [x] Add relevance scoring improvements for text search
- [x] Keep address geosearch + distance sorting
- [x] Add compare workflow entry points from school cards/details

## Phase 4: Parent Decision Tools
- [x] Add `/compare` workspace for side-by-side schools
- [x] Add saved compare list interactions

## Phase 5: Delivery and Ops
- [x] Extend unit tests for RBAC/actions/search utilities
- [x] Extend E2E tests for site-admin and school-admin flows
- [x] Update docs with combined credentials + deployment checklist
