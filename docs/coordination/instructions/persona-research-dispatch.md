# Persona-driven TimeTree MCP product discovery — three independent sessions

Goal: discover unmet real user needs beyond current 29 original + 3 integrated read-only MCP tools and standalone feature prototypes. This is research, not implementation. Do not modify source, README, icon, CI, or run GitHub Actions. Do not merge main.

Each session must independently read current docs/coordination/QUEUE.md and docs/coordination/reports/INTEGRATION-PR6-19.md (integration/release-candidate), inspect existing capabilities, and deliver a distinct report on coordination/parallel-workstreams. Avoid proposing existing features as new without specifying a meaningful upgrade. Explicitly distinguish supported API actions from speculative capabilities; never assume access to private shared calendars, notifications, location, or official AI internals.

Session A — family & personal life. Personas: dual-income parents with childcare, single parent, multigenerational caregiver, couple living apart, student/club member, shift worker. Probe last-minute changes, fairness, privacy, event ownership, transport, school schedules, elder care, shared reminders, non-technical onboarding.

Session B — teams & collaboration. Personas: small business, volunteer organizer, sports team manager, teacher, freelance contractor, event coordinator, multilingual cross-border team. Probe permissions, RSVP, handoffs, availability, multi-calendar conflicts, time zones, group changes, auditability, approval and offline use.

Session C — accessibility, trust & edge cases. Personas: older adult, screen-reader user, neurodivergent user, privacy-sensitive household, low-connectivity mobile user, non-Japanese speaker, high-volume scheduler, cautious first-time AI user. Probe consent, clarity, safe undo, failure recovery, account security, language/date ambiguity, hallucinations, live data freshness and iPhone ChatGPT usability.

Deliverables per session:
1. 6–8 specific personas, their constraints, a realistic day-in-the-life and top 3 jobs-to-be-done.
2. At least 12 concrete user stories, each with trigger, current friction, desired conversational interaction, proposed capability, acceptance criteria, privacy/security risks, and whether feasible with current TimeTree API.
3. Rank top 10 opportunities using frequency (1–5), pain (1–5), feasibility (1–5), and safety (1–5), with score formula and reasoning; mark quick wins vs API/platform blockers.
4. List at least 5 failure/abuse scenarios and suggested guardrails.
5. Compare against current feature modules and registered tools; label NEW, ENHANCE, EXISTING, or BLOCKED.
6. A prioritized MVP shortlist (up to 5) and 3 sample Japanese user prompts.
7. Identify assumptions requiring real-user interviews. No fabricated research findings; these are hypothetical personas.

Write one report file:
- Session A: docs/coordination/reports/PERSONA-FAMILY.md
- Session B: docs/coordination/reports/PERSONA-TEAM.md
- Session C: docs/coordination/reports/PERSONA-ACCESS-TRUST.md

Commit only your own report to coordination/parallel-workstreams, record commit SHA and summary. If editing this shared branch conflicts, use a separate research branch and open a draft PR targeting coordination/parallel-workstreams. Do not implement code or start Actions.

Coordinator will synthesize overlap, identify missing user needs and translate verified opportunities into engineering tasks after safety/API review.
