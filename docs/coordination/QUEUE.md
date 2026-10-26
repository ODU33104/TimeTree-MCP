# Work queue — any non-DOCS worker may claim any unclaimed item

The dispatcher is `instructions/worker-dispatch.md`. This is a prioritized queue. Claim atomically by creating `claims/<item-id>.md` on this branch. The README / branding / translations worker is **excluded** from this queue.

| Priority | Item ID | Task | Owned paths | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | REMOTE-HTTP | Build actual authenticated MCP Streamable HTTP endpoint with bounded body, safe request lifecycle, origin checks and default read-only tool allowlist; no public deployment | `src/remote/**`, `src/remote-server.ts`, `tests/remote-http*.test.mjs` | Typecheckable HTTP transport, fail-closed tests, local usage instructions in `docs/remote-*.md` |
| 2 | AUTH-ONBOARD | Implement out-of-chat credential onboarding and secure local credential storage contract; never expose secrets via tools or logs | `src/credentials/**`, `src/onboarding/**`, `tests/credential*.test.mjs`, `docs/security-*.md` | Local secret entry, safe permissions, redaction, expiry/rotation documentation |
| 3 | QA-SECURITY | Repair and expand security regression tests for existing release candidate; check API error-code compatibility and tool names | `tests/security*.test.mjs`, `tests/http*.test.mjs`, `tests/tool-access*.test.mjs`, `docs/qa-*.md` | Tests verify redirects, hostile origin, redaction, allowlist; do not claim run without execution |
| 4 | TOOLS-RECURRENCE | Improve recurring-event mutation contracts and prevent accidental broad changes | `src/tools/recurring-event-tools.ts`, `tests/recurring*.test.mjs` | Validate occurrence timestamp, scope, and failure behavior; maintain compatibility |
| 5 | TOOL-CONTRACTS | Audit all 29 tool schemas, validate dangerous mutation parameters, improve tool error contracts | `src/tools/**` except `recurring-event-tools.ts`, `tests/tool-contract*.test.mjs` | Specific input validation and negative tests, no silent destructive actions |
| 6 | RELEASE-QA | Add deterministic release gate and CI verification for integrated branch, without using live credentials | `.github/workflows/**`, `scripts/verify-*.mjs`, `docs/release-qa.md` | Build, typecheck, test, audit and security checks documented and reproducible |

## Work allocation
All non-DOCS sessions use the **same dispatcher URL**; no session names are needed. Git claim creation arbitrates collisions. The coordinator owns `src/index.ts`, `src/utils/tool-access.ts`, final integration and merges. For changes to those paths, put a coordinator request in your report. Tasks touching overlapping files must be serialized by their claim order. If blocked, skip to another task.

## Reporting
Each worker updates its own claim and commits a report to `docs/coordination/reports/<item-id>.md` on its task branch. Coordinator periodically reads claims, reviews branches, updates STATUS and merges only verified work.

## Next wave — usability differentiation (claim only after earlier dependencies)

| Priority | Item ID | Task | Owned paths | Acceptance |
| --- | --- | --- | --- | --- |
| 7 | UX-SEARCH | Search events across accessible calendars by date range, keywords and optional calendar filters, with pagination and timezone-safe handling | `src/features/search/**`, `tests/ux-search*.test.mjs` | Read-only search with deterministic fixtures; no private data in logs |
| 8 | UX-AVAILABILITY | Calculate free/busy slots across selected calendars, configurable duration, working hours and timezone | `src/features/availability/**`, `tests/ux-availability*.test.mjs` | Conflict-free suggestions from fixtures; no mutation |
| 9 | UX-BATCH-PREVIEW | Build dry-run planner for multi-event create/update/delete with explicit diff and confirmation contract; no mutation without approval | `src/features/batch/**`, `tests/ux-batch*.test.mjs` | Preview-first plan, rejects destructive actions without confirmation, handles partial failure |
| 10 | UX-TEMPLATES | Reusable event templates and safe bulk scheduling plans | `src/features/templates/**`, `tests/ux-templates*.test.mjs` | Template validation, timezone and recurrence correctness, preview before write |
| 11 | UX-CONFLICTS | Detect overlapping events and suggest alternatives without modifying calendars | `src/features/conflicts/**`, `tests/ux-conflicts*.test.mjs` | Multi-calendar overlaps, all-day/timezone edge cases |
| 12 | UX-ONBOARD | Secure local credential entry command wired to credential vault and server consumer contract; never accept secrets via MCP tool arguments | `src/onboarding/**`, `src/credentials/**`, `tests/ux-onboard*.test.mjs` | Private local input, permissions and rotation; explicit coordinator integration handoff |
| 13 | UX-TOOL-INTEGRATION | Wire approved search/availability/batch/templates features into MCP tool registration after QA | coordinator-owned `src/index.ts`, `src/tools/index.ts`, `docs/coordination/**` | New tools discoverable and permission-gated, regression suite green |

**Dispatcher note:** UX-TOOL-INTEGRATION is coordinator-only. Other UX tasks may be claimed by any non-DOCS worker. New modules should expose typed functions and fixtures, not edit `src/index.ts` or existing tool registry. Do not claim the user-facing functionality works until integrated.
