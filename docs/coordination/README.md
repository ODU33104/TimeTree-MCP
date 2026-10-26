# Parallel development control room

**Coordinator:** the originating ChatGPT session. This repository is the sole source of truth for task instructions, handoffs, evidence and decisions. Do not create GitHub Issues. Do not contact the human user; questions go to the coordinator through the workstream report in Git.

## Operating rules
- Work in your assigned branch and owned paths. Never modify another workstream's files without a recorded handoff.
- Each worker updates its own `docs/coordination/reports/<stream>.md` with completed work, commits, risks, test status and requests to the coordinator.
- Send coordinator questions as `NEEDS_COORDINATOR_DECISION` in the report; do not ask the user.
- Do not commit passwords, session cookies, access tokens, private calendar data or real account identifiers.
- Never claim integration, mobile compatibility, tests or deployments that were not verified.
- Keep upstream MIT attribution and clearly label this as an unofficial fork.
- Batch development into substantive milestones. Run unit and integration tests near milestone completion; do not stop feature development solely because full integration tests are pending.
- Merge only after coordinator review; keep unverified work on branches.

## Workstreams (4 parallel workers + coordinator)
1. **AUTH**: `work/auth-credential-onboarding`; owns `src/client/auth.ts`, `src/utils/http-client.ts`, credential onboarding and security docs. Design for no secrets in AI prompts; never add an unauthenticated remote bridge.
2. **REMOTE**: `work/remote-mcp-transport`; owns `src/remote/**`, remote entry point and deployment docs. Default-deny authentication, origin checks, read-only default and per-user isolation. Coordinate dependencies with AUTH; no public deployment without review.
3. **TOOLS**: `work/tool-quality`; owns `src/tools/**`, `src/utils/recurrence.ts`, tool contract tests. Focus on calendar/event recurrence, safe mutation behavior and clear Japanese tool descriptions.
4. **DOCS-BRAND**: `work/docs-brand`; owns `README.md`, `README.ja.md`, `README.ko.md`, `docs/assets/icon.svg`, screenshots/branding and installation docs. Ensure all supported languages say the same truthful thing.
5. **COORDINATOR**: integration, `src/index.ts`, `src/utils/tool-access.ts`, CI, release strategy, QA gate, cross-stream conflicts and `docs/coordination/**` instructions.

## Existing branches / avoid duplicate work
- `docs/fork-readme-refresh` (PR #1): initial 3-language fork attribution; DOCS-BRAND should incorporate rather than discard it.
- `audit/initial-inventory` (PR #2): initial audit; no Issues needed.
- `fix/fork-update-source` (PR #3): update URL changes and tests; coordinator reviews release-link validity.
- `fix/http-credential-boundary` (PR #4): credential origin, redirect and logging fixes; AUTH incorporates.
- `security/mcp-tool-boundary`: read-only mode and safe error responses; coordinator integrates.

## Acceptance gate
Build and typecheck, automated unit tests, regression and security tests, no secret exposure in logs/tool outputs, documented deployment boundary, read-only live test first, then write/delete against an isolated test calendar. A real iPhone ChatGPT test requires an actually supported remote MCP connection and is not currently verified.
