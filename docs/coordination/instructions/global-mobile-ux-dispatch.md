# GLOBAL-MOBILE-UX — worldwide adoption and smartphone-first experience

Date: 2026-10-26. Prioritize everyday family, couples and friend scheduling across regions, then daily agendas, school/shift notices, multilingual/timezone coordination and advanced professional use. This is a hypothesis-led prioritization, not market-size evidence. Smartphone ChatGPT custom MCP connection remains unverified/limited; do not claim product availability.

## Research and design deliverables (no implementation in this task)
1. Review docs/coordination/reports/PERSONA-SYNTHESIS.md, docs/coordination/reports/MOBILE-DISTRIBUTION-FEASIBILITY.md and docs/coordination/PRODUCT-STRATEGY-MOBILE-FIRST.md.
2. Design three smartphone-first conversational flows with **synthetic data only**: (a) today/this week compact agenda, (b) consent-scoped shared free slots for family/couple/friends, (c) paste notice → draft event preview. Provide complete Japanese and English example dialogs, states, empty/error/ambiguous paths and safe confirmation.
3. Specify a client-agnostic structured result schema with text fallback, not an assertion that MCP controls ChatGPT mobile custom UI. Include calendar scope, fetched-at, partial/truncated, timezone, source provenance, privacy controls, and action approval boundary.
4. Internationalization: rank initial locales based on verifiable TimeTree geographic availability and language support (source URLs), not assumed country popularity. Cover locale/date format, IANA timezones, DST folds/gaps, week start, 12/24h, RTL expansion, accessibility and translation of error/confirmation text.
5. Define 5–8 objective acceptance tests per flow with synthetic fixtures, including two users, non-shared calendar, overnight shift, offline/stale state, duplicate notice and DST. Never infer RSVP, live ETA, push, external inbox access or provider API rights.
6. Draft a 3-stage delivery plan: text-only read-only prototype; verified Web MCP demo with synthetic data; mobile public plugin only after TimeTree authorization, OAuth multi-tenant security, platform approval and QA.
7. Define adoption metrics: setup completion, time to first useful answer, misunderstanding/unsafe action rate, weekly retained users and voluntary referral intent. Avoid collecting sensitive calendar data.

Write report to docs/coordination/reports/GLOBAL-MOBILE-UX.md on coordination/parallel-workstreams and commit. If shared-branch conflicts occur, use a task branch and draft PR. Record SHA and link.

No code, README/icon, deployment, Actions, spending, main merge or real user credentials. This research task should be independently reviewable and turn into engineering tickets after coordinator approval.
