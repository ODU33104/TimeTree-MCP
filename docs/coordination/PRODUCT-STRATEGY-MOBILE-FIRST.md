# Product strategy: ChatGPT mobile-first TimeTree experience

Date: 2026-10-26. Strategic direction: prioritize ordinary smartphone-only ChatGPT users, without abandoning power-user MCP capabilities. This is a product direction, not a claim that remote ChatGPT/iPhone integration works today.

## North-star user promise
“Connect TimeTree to ChatGPT on a smartphone and manage shared schedules in ordinary language, with clear confirmation before changes.”

## Priority allocation (planning heuristic)
- 50%: smartphone-first conversational flows, readable results, minimal setup, onboarding, family/team use cases.
- 30%: reliability, privacy, authorization, safe write confirmation, error recovery, accessibility and localization.
- 20%: advanced MCP controls, recurring events, bulk operations, extensibility and developer documentation.
Safety and release-blocking security work remain non-negotiable gates, not discretionary budget.

## Smartphone-first experience principles
1. One clear first success: “今日の予定は？” with selected calendar, freshness and concise agenda.
2. Short conversational entrypoints and progressive disclosure, not large technical JSON dumps.
3. Offer quick choices for calendar/date/scope where host supports interactive controls; always support plain text fallback.
4. Confirm create/update/delete with source, target, before/after, timezone and exact scope. No write on ambiguity.
5. Handle copied school notices, group messages, shifts and event schedules as user-supplied drafts, never autonomous inbox access.
6. Private by default: busy-only when sharing, minimal event titles, explicit selected calendars.
7. Plain-language setup and failure recovery, no credentials in chat.
8. Internationalization and accessibility from the start: locale/timezone, screen reader, large touch targets where host supports them.
9. Preserve expert mode for diagnostics, full metadata and precise MCP arguments without exposing it by default.
10. Avoid unsupported claims: ChatGPT mobile connector support, GenUI host rendering, OAuth flow, remote transport, official TimeTree API rights and live notifications must be tested on real supported accounts/devices.

## First five product journeys to validate
A. Daily agenda: “今日何がある？” → compact schedule with timestamps and source provenance.
B. Family free time: “土曜の午後、みんな空いてる？” → privacy-safe candidate slots.
C. Notice-to-draft: “このお知らせを予定にして” → extracted dates, ambiguity warnings, duplicate check and preview.
D. Conflict explanation: “明日の予定、かぶってない？” → grouped conflicts with optional manual travel buffer.
E. Safe rescheduling: “来週の火曜に変更したい” → exact target/diff/approval and failure recovery.

## Engineering prerequisites and gates
- P0: resolve dependency audit and maintain build/test evidence locally; reserve Actions for final milestone.
- P0: establish secure remote transport, credential onboarding and mobile ChatGPT connection feasibility; no public deployment before threat review.
- P0: provenance/freshness/completeness and privacy-aware readable output for read-only tools.
- P1: natural-language ambiguity resolution and confirmation contract; read-only demo before mutation.
- P1: test actual smartphone UX with first-time users; measure time-to-first-success, setup completion, errors, privacy comprehension and recommendation willingness.
- P2: advanced power-user options behind explicit controls, not removed.

## Evidence and communication
Persona reports are hypotheses; conduct real-user validation. UI affordances depend on ChatGPT client and connector protocol support; MCP itself cannot guarantee custom cards or buttons. Do not imply official TimeTree affiliation or official AI internal access.

## Next coordinator action
Create implementation tasks for mobile-first quick-start, concise agenda presentation, mobile-safe confirmation, and iPhone connection feasibility audit. Keep README/icon ownership separate. Do not run GitHub Actions during development.
