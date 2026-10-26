# Cross-persona synthesis — 2026-10-26

Sources: PERSONA-FAMILY.md (6 personas), PERSONA-TEAM.md (8 personas), PERSONA-ACCESS-TRUST.md (8 personas), all on coordination/parallel-workstreams. These are **hypothetical scenarios, not user interviews**. Different scoring formulas across reports must not be numerically compared.

## Prioritized product opportunities
| Priority | Opportunity | Representative user job | Status relative to code | Feasibility/gate |
| --- | --- | --- | --- | --- |
| P0 | Provenance, freshness, completeness and explicit calendar scope | Know what was actually checked, when and whose calendar | NEW common tool-result envelope | Feasible for authenticated read tools; provider pagination/ACL validation required |
| P0 | Safe preview, explicit approval and uncertainty after mutation | Never accidentally edit/delete entire series or duplicate on retry | ENHANCE batch-preview/undo/mutation-gate | Needs authenticated server-side single-use confirmation, identity binding, provider read-after-write |
| P0 | Plain-language accessible agenda, compact/expanded mode | Understand today without overwhelming output or leaking sensitive titles | ENHANCE standalone briefing | Feasible locally, client accessibility testing required |
| P1 | Ambiguous date/time and timezone clarification | Correctly interpret “next Friday evening” across locales/DST | ENHANCE natural-date | Feasible locally with deterministic fixtures; no silent guesses |
| P1 | Family pickup/volunteer shift coverage gaps | See uncovered responsibilities, propose candidates without asserting consent | NEW planner built on registered availability/conflicts | Selected accessible calendars only; assignment is proposal, not RSVP |
| P1 | Overnight shifts and user-supplied travel/recovery buffers | Avoid post-night-shift or travel conflicts | ENHANCE travel-buffer/conflicts | Feasible locally with explicit durations and timezone/DST tests |
| P1 | Privacy-safe busy-only availability | Share suitable windows without titles or participants | ENHANCE share-slots | Local export feasible; hosted link revocation not yet supported |
| P1 | Paste-to-preview import for school/team notices | Convert user-provided messages to drafts without duplicate events | ENHANCE natural-date/templates/batch preview | Manual supplied text only; approval before write |
| P2 | Explicit responsibility handoff ledger | Track proposed/accepted assignments without fake acknowledgements | NEW | Requires local state and trusted actor provenance |
| P2 | Accessible bilingual confirmation and localized time display | Confirm meeting across timezones | NEW presentation contract | Feasible locally, UI client behavior platform-dependent |

## Cross-cutting safety requirements
- Never treat calendar titles/comments/imported notices as trusted instructions.
- Never infer consent, RSVP, attendance, notification delivery or access to another person's private calendar.
- All reads must use explicit authorized calendar IDs and bound windows; show partial/truncated state and fetched-at.
- Preview-only by default; write approvals bind exact target, diff, actor and expiry and are single-use server-side.
- Timeouts after writes are uncertain outcomes, not automatic retries.
- No credential collection via chat; no unreviewed remote multi-user exposure.
- No claim of live ETA, push notification, hosted revocation, official AI internals or mobile ChatGPT connectivity without verification.

## Proposed next engineering sequence
1. Resolve release-blocking dependency audit and preserve local verification evidence; avoid Actions until final release gate.
2. Add provenance/freshness/completeness and accessible summary to existing registered read-only tools. Prioritize source integrity before more registrations.
3. Add locale/timezone ambiguity and overnight-shift test fixtures, and privacy-safe busy-only export as read-only adapters.
4. Validate real-user needs with interviews (2–3 participants per representative segment) and synthetic no-write usability trials.
5. Only after security review, build server-side mutation approval and reliable retry reconciliation.

## Current delivery boundary
Original 29 tools + 3 new read-only MCP tools registered in integration/release-candidate; many prototypes are not registered. Earlier 172 tests passed on Node 22 and 24, but overall release gate failed on dependency audit. No verified live iPhone/ChatGPT remote connector. Do not merge main or advertise production readiness.

## Recommended follow-up tasks (do not start CI)
- UX-TRUST-ENVELOPE: source IDs, fetch timestamps, completeness/truncation indicators for three read-only MCP adapters, test privacy and pagination behavior.
- UX-ACCESSIBLE-BRIEF: compact/expanded private-by-default summaries with deterministic output and VoiceOver-friendly text structure.
- UX-FAMILY-COVERAGE: read-only coverage-gap proposals, no inferred assignee acceptance; tests for missing calendars and overnight shifts.
- UX-LOCALE-GUARD: locale/timezone ambiguity handling, DST folds/gaps and cross-border confirmation fixtures.

Coordinator must review tool-registration ownership and current release blockers before dispatch. README/icon remain dedicated stream.
