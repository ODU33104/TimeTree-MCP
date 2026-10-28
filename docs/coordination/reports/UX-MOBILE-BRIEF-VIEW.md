# UX-MOBILE-BRIEF-VIEW — wave 3 implementation handoff
Date: 2026-10-29. Status: ready-for-review (standalone synthetic prototype only).
## Scope
PR #29 mobile agenda / family-summary scenario. Reuses the `UX-SMART-BRIEF` output shape conceptually (kind/at), but does NOT edit its owner files or register a tool. Caller must supply a previously authorized and explicitly scoped snapshot. No TimeTree access, no real users, no mobile connector.
## Changes
- `src/features/mobile-brief-view/index.mjs`: pure JA/EN short text fallback, title/participant redaction, explicit requested-vs-authorized scope, freshness and partial/stale indicators, timezone formatting, item truncation, fail-closed invalid items.
- `tests/ux-mobile-brief-view.test.mjs`: 10 synthetic Node built-in test cases.
## Evidence
- Atomic claim commit on coordination: `7136d188a7f9742743d486ca948e581af1cb7f4e`.
- Branch: `task/ux-mobile-brief-view-20261029`.
- Source commit: `f4b2a955eedb4fb69f0b21f73c8c982b63f60076`; test commit: `27111aa4d2b414f367836c3abcd8e861cb575069`.
- Local development prototype, Node v22.16.0, `node --test /mnt/data/mobile-brief/view.test.mjs`: **10 PASS, 0 FAIL**. This local prototype was semantically equivalent but not an exact checkout of the GitHub commit.
- **Committed test file against committed module: NOT RUN** (no checked-out repository). Full npm tests/typecheck/audit: NOT RUN. Actions: NOT RUN.
## Coordinator acceptance / limitations
- Check out exact PR head and run `node --test tests/ux-mobile-brief-view.test.mjs`; verify the 10/10 result before accepting.
- Adapter must map `BriefItem` to `calendarId` from a validated event provenance map; the existing `BriefItem` has no calendar ID. Reject missing/ambiguous provenance. Never pass raw unauthorized items.
- Caller must determine whether pagination is complete, source timestamp is trustworthy, and access was consented. Formatter cannot independently verify these facts.
- No title output even if input contains titles; no write/approval capability. Do not imply all family members are free or all calendars checked.
- Test DST fold/gap, screen-reader behavior and actual smartphone rendering at integration stage; standalone formatter does not resolve calendar-day boundaries.
- No README/icon changes, registry changes, main merge, deployment, secrets or real TimeTree calls.
