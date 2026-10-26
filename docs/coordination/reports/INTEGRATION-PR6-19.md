# PR #6–#19 release-candidate integration and QA handoff

Date: 2026-10-26
Branch: `integration/release-candidate` (never merged to `main`)

## Integration preparation
- PR #6 targets `main` from this same integration branch. It was **not merged**.
- PR #7–#19 supplied 41 distinct files staged onto the release candidate in commit [8073a361](https://github.com/ODU33104/TimeTree-MCP/commit/8073a361739fc2000fef53c70b4a2c99d2006b09).
- The feature PR branches were **not GitHub-merged/closed**. Their changes were staged directly for coordinated QA to avoid merging unverified drafts to `main`.
- No README, translation or icon files were changed.

## MCP registration
- Added `src/tools/ux-read-tools.ts` with three API-backed **read-only** MCP adapters: `search_events_across_calendars`, `find_available_slots`, `detect_event_conflicts`.
- Registered adapters in `src/tools/index.ts`, allowlisted the three names in `src/utils/tool-access.ts`, and synchronized `mcpb/manifest.json`.
- These adapters read only explicitly selected calendars (1–5 IDs), bound input windows to 31 days, expand supported recurring occurrences, fail closed on unsupported recurrence/truncation, and return privacy-minimized outputs; they do not mutate calendar data. No live provider test was run.
- Updated `src/index.ts` to repair invalid escaped line separators, filter tool discovery and tool calls in opt-in stdio read-only mode (`TIMETREE_READ_ONLY=true`), and sanitize unexpected tool errors.
- Tightened default-deny remote tool-name permissions in `src/remote/security.ts`. Remote transport must still pass security review and is not claimed to be deployed.
- **Not registered**: batch preview/undo, credential onboarding, and other unreviewed or write-adjacent feature modules. These remain standalone staged modules.

## QA evidence (actual GitHub Actions runs)
- [CI run 40297874210](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874210): Node.js 22 and 24 both completed `npm ci`, `npm run typecheck`, `npm test` (includes production build and test build): **172 tests passed, 0 failed** on both runtimes.
- [Release QA run 40297874196](https://github.com/ODU33104/TimeTree-MCP/actions/runs/40297874196): build, typecheck and tests passed; the final dependency security audit blocked the gate.
- The full workflow outcomes are **FAILURE**, not success, because `npm audit --audit-level=high` detects remaining advisories. Do not merge until reviewed.

## Unresolved blocking issues
- `body-parser` high-severity denial-of-service advisory [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828), fix reported available via `npm audit fix`.
- `zod` high-severity oversized constrained-collection memory exhaustion [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Audit suggests Zod 4.6.7 with **major-version incompatibility** to current Zod 3 APIs; do not force-upgrade without compatibility QA.
- Additional audit findings: `fast-uri` (moderate), `ip-address` (moderate), `esbuild` (report also flags vulnerable versions).
- Real TimeTree credentials, live remote MCP, mobile client connection, read-only production access, write/delete and rollback behavior are **not** end-to-end verified.
- Multiple unreviewed planning modules are compiled and unit-tested but **not MCP registered**.

## Coordinator-only decisions
- NEEDS_COORDINATOR_DECISION: approve a tested Zod major-version migration and refreshed lockfile, or an explicitly justified temporary audit exception with compensating input-size controls. The gate must remain blocked for now.
- Review production remote access and credential consumption separately before enabling public integration.
- After audit remediation, re-run release QA plus isolated read-only live testing, then controlled mutation tests before considering PR #6 merge to main.

## Implementation follow-up
- Added `tests/ux-mcp-tools.test.mjs` covering new adapters, recurrence expansion, safe failures and selected-calendar scope.
- Repaired strict TypeScript errors in files staged from worker PRs, preserved sanitized numeric TimeTree response code in `src/utils/http-client.ts`, and corrected new feature test imports from `dist/` to `.test-dist/`.
- All implementation and fixes above are committed on `integration/release-candidate` only.
