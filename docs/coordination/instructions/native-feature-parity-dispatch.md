# NATIVE-FEATURE-PARITY — implement TimeTree-first everyday MCP value

Date: 2026-10-26. Read [TimeTree product feature coverage](../TIMETREE-FEATURE-COVERAGE-20261026.md) and current candidate tools `integration/release-candidate/src/tools/index.ts` first. Use official TimeTree Help/News for app behavior, not guesses about private provider endpoints. The TimeTree Connect App API discontinued; **do not invent endpoints or assume authorization for public or live multi-user use**.

One development chat chooses ONE distinct task using an atomic claim to avoid collisions:

## TIME-PARITY-CHECKLIST (P1)
- Build **read-only** checklist progress / uncompleted-items summary from existing `get_events` / `list_memos` response shapes, with filtering by selected calendar and optional event/memo scope.
- Explicitly distinguish missing/unavailable checklist data vs an empty checklist; support item counts and privacy-minimized output (titles opt-in). No automatic item-completion mutation.
- Handle duplicate IDs across calendars, malformed/null/overlarge checklists, long/empty titles, mixed completed/uncompleted items, timezone and all-day edge cases.
- Owned files: `src/features/checklist-summary/**`, `tests/native-checklist*.test.mjs`, `docs/features/checklist-summary.md`.

## TIME-PARITY-ATTENDANCE (P1)
- Build **read-only** event participation/virtual-member summary from already exposed attendees / virtual_user_attendees and explicitly scoped `get_calendar_members` / `get_calendar_virtual_members` data.
- Distinguish actual TimeTree attendance from virtual member association and **do not invent RSVP status, attendance confirmation, join/leave or notification delivery**.
- Unknown, removed or inaccessible member IDs should be labeled unknown; never assume consent or reveal private member data across calendars. Use optional anonymized output.
- Owned files: `src/features/attendance-summary/**`, `tests/native-attendance*.test.mjs`, `docs/features/attendance-summary.md`.

## Common execution rules

1. Work on a task branch from `integration/release-candidate` (which has the candidate tool registry and models), **not main**. Do not push to the integration base branch itself because pushes trigger Actions.
2. Implement typed, dependency-light pure functions, synthetic fixtures and negative-path tests. If local environment permits, run `npm ci`, `npm run typecheck`, `npm test`, `npm audit --audit-level=high`. If DNS prevents this, run any globally installed `tsc`/Node tests that genuinely exercise submitted code and mark remaining checks **NOT RUN**. No CI/Actions during iteration.
3. Do not modify `src/index.ts`, `src/tools/index.ts`, `src/utils/tool-access.ts`, `README*`, `mcpb/manifest.json`, package lockfile, or existing authentication; coordinator handles MCP registration after review.
4. Report **real** source files, exact commit SHA, test logs/results, known constraints, unsupported TimeTree API features and proposed future adapter contract in `docs/coordination/reports/<TASK-ID>.md` on task branch; create a draft PR to `integration/release-candidate`.
5. Keep non-affiliation, permissions, no credentials, no public deployment, no live user data, no paid services, and no main merge. These prototypes are not user-callable until registered and checked.

## Future native feature discovery track (documentation only)

Maintain a separate candidate backlog, not reverse-engineered implementations, for join/leave event participation, calendar invites/settings, albums/photo upload, stickers, public calendars, premium attachment handling, notification settings, device widgets and external imports. For each, state provider rights, account role, app plan, data model, rate/privacy implications, **verified** API surface and an explicit NO-GO if no permitted endpoint exists. Prioritize safely supported parity over superficial tool count.
