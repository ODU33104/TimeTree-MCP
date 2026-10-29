# UX-CONFLICTS report

Branch: `work/UX-CONFLICTS`
Claim: `docs/coordination/claims/UX-CONFLICTS.md`

## Changes
- `src/features/conflicts/index.ts`: pure multi-calendar half-open interval conflict detector and bounded alternative slot suggestion.
- `tests/ux-conflicts.test.mjs`: cross-calendar, adjacent, all-day, merged intervals, and invalid-input fixtures.
- Commit: https://github.com/ODU33104/TimeTree-MCP/commit/95c72a88af55cf69aa8e6a70e8672ab765fc597a

## Verification / limitations
- Build and tests **not executed**.
- Caller must normalize local times and all-day events to absolute UTC intervals; DST handling and per-calendar permissions belong to integration.
- Does not fetch or mutate private calendars; no real account data used.
- NEEDS_COORDINATOR_DECISION: integrate after fixtures, timezone normalization, and privacy review; no user-facing tool registration in this branch.
