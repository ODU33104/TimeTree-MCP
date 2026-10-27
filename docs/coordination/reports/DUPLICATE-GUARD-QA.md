# DUPLICATE-GUARD independent QA — PR #24
Date: 2026-10-27
Branch: `qa/duplicate-guard-20261027`
Draft PR: https://github.com/ODU33104/TimeTree-MCP/pull/25
Target: https://github.com/ODU33104/TimeTree-MCP/pull/24
Test commit: `39a724a5801ff8d83f718920d69362607041b0a9`

## Ownership and scope
PR #24 owns `src/features/duplicate-guard/index.ts`. Its paused report says NOT TYPECHECKED/TESTED/AUDITED. This QA branch is based on its work branch and changes only `tests/duplicate-guard-qa.test.mjs` and this report; no comparator reimplementation.

## Test matrix
Ten synthetic Node test cases: Japanese NFKC/punctuation, English case/fullwidth, multilingual translation false negative, punctuation false positive, offset-equivalent instants, malformed/naive timestamps, DST repeated wall times, all-day, recurrence expansion and identity, cross-calendar isolation, 2000-event/10-calendar/100-result bounds, output privacy and token redaction.

## Execution and status
- `npm ci`: NOT RUN (GitHub connector environment; no local checked-out repository/dependency installation).
- `npm run typecheck`: NOT RUN.
- `npm run test:build`: NOT RUN.
- `node --test tests/duplicate-guard-qa.test.mjs`: NOT RUN (requires compiled `.test-dist`).
- `npm audit --audit-level=high`: NOT RUN.
- GitHub Actions: NOT RUN, not triggered by this worker.
- No test PASS is claimed; previous '8 PASS' is not reused.

## Static review findings / release blockers
1. Normalization removes all punctuation and symbols, allowing false positives such as `A-B` vs `AB`. Transliteration/translation equivalents (e.g. `会議` vs `meeting`) are false negatives. Candidate-only labeling is appropriate; never auto-block or auto-delete.
2. `timeZone` is validated but not used to interpret all-day calendar dates; DST and all-day semantics depend on upstream correct offsets. The test suite covers explicit-offset instants, not actual provider timezone normalization.
3. `snapshotComplete: true` is a caller assertion only, not evidence of complete provider pagination or authorized calendar selection. Do not claim no duplicates globally from `no-match-in-snapshot`.
4. `eventId` and `calendarId` remain in output: opaque IDs are not guaranteed non-sensitive. A caller must enforce per-user isolation and redact logs.
5. Comparator scans at most 2000 events and 10 calendars. Large snapshots are rejected, not paginated.
6. Recurrence series are rejected until expanded, but occurrence identity uniqueness and series exceptions need provider fixture verification.

## Required next gate
Run `npm ci && npm run typecheck && npm run test:build && node --test tests/duplicate-guard-qa.test.mjs && npm audit --audit-level=high` in a checked-out branch. Record exact PASS/FAIL counts and fix tests only if expectations are wrong. Do not merge PR #24 or register an MCP tool until review, authorization boundary, provider fixtures and QA pass.

## 2026-10-27 follow-up review
Added Gregorian invalid-day/leap-year and IANA DST wall-time regression cases in commit `3899fd72b6a40e4bb162151c1762d04ccc2c9701`. The current offset-only comparator **accepts** the nonexistent `2026-03-08 02:30 -05:00` New York wall time; test documents this limitation, not a fix. `2026-02-30` is rejected by strict date validation already present on PR #24. No implementation change to PR #24. New tests authored; `npm ci`, `npm run typecheck`, `npm run build`, `npm test`, `node --test tests/duplicate-guard-qa.test.mjs`: NOT RUN (no verified local checkout). Integration HOLD pending IANA DST validation and actual execution. PR #25 remains based on PR #24 head.
