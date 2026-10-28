# Calendar integration readiness — 2026-10-29

Independent review only. No existing claim or owner code modified.

## Integration order (all HOLD until verified)

1. PR #27 checklist: missing snapshots now fail closed. Require authorized adapter, completeness evidence, title consent and null-filter test.

2. PR #26 attendance: roster validation and default anonymization now present. Require authenticated allowlist, provider shape verification and explicit name disclosure opt-in.

3. PR #22 iCalendar: check consent for title/description/location, stable UID, recurring expansion, exclusive all-day DTEND and UTF-8 folding.

4. PR #21 what-if move: expand recurring blockers for candidate windows, verify timezone gap/fold and recheck stale preview before any mutation.

5. PR #24 plus stacked #25 QA: integrate only once in dependency order. Validate DST zone-offset contract, recurrence, false positives and negatives.

## Shared coordinator-owned contract

Authenticated selected calendar scope; pagination exhaustion and complete snapshot provenance; no RSVP inference; DST gap/fold and all-day boundaries; preview-first explicit mutation confirmation; privacy defaults and no secret logging.

## Synthetic fixtures

New York 2026-03-08 02:30 -05:00 nonexistent local time; 2026-11-01 01:30 -04:00/-05:00 ambiguous fold; Tokyo all-day exclusive end; recurrence outside initial window; missing page; unauthorized roster; NFKC title collision; stale preview.

## Evidence

Branch: review/calendar-integration-readiness-20261029

Changed files: docs/coordination/reports/CALENDAR-INTEGRATION-READINESS-20261029.md

GitHub review IDs: #21 5690162125, #22 5690162548, #27 5690162955.

GitHub patch/comment reads: PASS.

Node/npm versions: NOT RUN. npm ci/typecheck/test/build/audit: NOT RUN. GitHub Actions: NOT RUN.

No source edits, existing claim edits, main/integration push, merge, deployment, live credentials or paid service.

Remaining: current-head executable QA, complete open PR and Actions history, coordinator adapter authorization tests.