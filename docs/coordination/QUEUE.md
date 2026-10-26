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

## Third wave — competitive advantage beyond official TimeTree AI (2026-10-26)

Official TimeTree Web AI Chat beta already supports conversational create/edit/delete/search, batch entry from pasted emails, batch label edits and confirmation cards. Do **not** claim those are unique. Official Schedule Context Engine is a future external-agent vision, not an available integration API. Do not use undocumented official AI endpoints.

| Priority | Item ID | Task | Owned paths | Acceptance |
| --- | --- | --- | --- | --- |
| 14 | UX-SMART-BRIEF | Privacy-first daily/weekly briefing engine: actionable upcoming schedule, conflicts, preparation suggestions and provenance; no LLM secret handling | `src/features/briefing/**`, `tests/ux-briefing*.test.mjs` | Deterministic summaries with source event IDs, timezone and opt-in controls |
| 15 | UX-TRAVEL-BUFFER | Commute/buffer planner using user-provided travel durations (no invented geolocation/ETA) | `src/features/travel-buffer/**`, `tests/ux-travel-buffer*.test.mjs` | Flags impossible back-to-back travel, all-day and DST handling |
| 16 | UX-UNDO-PLAN | Compensating-action and rollback-plan generation for previewed multi-event edits; clearly mark non-atomic remote mutations | `src/features/undo/**`, `tests/ux-undo*.test.mjs` | Idempotency keys, partial-failure recovery, no auto-execution |
| 17 | UX-SHARE-SLOTS | Privacy-preserving shareable availability suggestions without exposing event titles or participants | `src/features/share-slots/**`, `tests/ux-share-slots*.test.mjs` | Busy-only export, opt-in and expiration semantics |
| 18 | UX-NATURAL-PARSER | Locale-aware Japanese/multilingual date-expression normalization with explicit ambiguity resolution and timezone correctness | `src/features/natural-date/**`, `tests/ux-natural-date*.test.mjs` | No silent interpretation of ambiguous dates; tests for JP, EN, DST |
| 19 | UX-OFFICIAL-COMPAT | Track documented official AI/SCE capabilities and permitted integration surfaces; no scraping secrets, no unsupported API calls | `docs/official-ai-compatibility.md`, `tests/official-compat*.test.mjs` | Source-linked capability matrix, gap analysis, safe interoperability plan |

**Coordination:** UX-TOOL-INTEGRATION remains coordinator-only and must not be claimed by general workers. The first-wave PRs #7–#13 are draft and must pass QA before merge. Third-wave features must remain isolated typed modules until integration review.

## Release-blocking follow-up — 2026-10-26 (Actions budget: do not run CI during iteration)

| Priority | Item ID | Task | Owned paths | Acceptance |
| --- | --- | --- | --- | --- |
| P0 | DEP-AUDIT-REMEDIATE | Remediate dependency advisories in body-parser, zod, fast-uri, ip-address and esbuild. Avoid unsafe Zod major migration without compatibility review. Run local install/typecheck/tests/audit, record exact output. **Do not trigger GitHub Actions**. | `package.json`, `package-lock.json`, `docs/security-dependency-audit.md`, `tests/dependency-compat*.test.mjs` | Audit high findings resolved or documented with approved risk decision, 172+ tests preserved |
| P0 | REMOTE-ONBOARD-INTEGRATE | Wire authenticated loopback MCP HTTP transport and private local onboarding into package entrypoints; reject remote credential exposure, fail closed on public bind, preserve read-only default. No deployment or live credentials. | `src/remote-server.ts`, `src/onboarding/**`, `src/credentials/**`, `tests/remote-integration*.test.mjs`, `docs/remote-setup.md` | Local HTTP smoke and security tests, documented iPhone access limitation, no external exposure |
| P1 | UX-ADAPTER-EXPAND | Add safe read-only MCP adapters for smart briefing, travel buffer, and privacy-preserving availability sharing, with schema validation, explicit calendar selection and deterministic tests. Coordinate tool registry ownership with coordinator; do not modify `src/index.ts` or `src/tools/index.ts`. | `src/tools/ux-insight-tools.ts`, `tests/ux-insight-tools*.test.mjs` | Adapter modules + tests ready for coordinator registration; no mutation |
| P1 | MUTATION-CONFIRM-GATE | Define and implement safe plan-preview/confirm contract for batch changes and undo planning, with explicit confirmation token, expiry and partial-failure handling; no remote writes until coordinator review. | `src/features/mutation-gate/**`, `tests/mutation-gate*.test.mjs`, `docs/mutation-safety.md` | Testable no-write-by-default API; no unapproved mutation |

**Dispatch policy:** these four tasks are independent worker assignments. First claim wins; three general sessions can run concurrently. README/branding worker receives none. Reserve GitHub Actions for a single release gate after dependency remediation and integrated QA; use local tests while iterating. Coordinator owns final tool registration and `main` merge.
