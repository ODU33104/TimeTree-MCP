# Persona research A — family and personal life
Date: 2026-10-26 | Status: hypothesis-led discovery, not user interviews

## Evidence boundary and current capability inventory
Read coordination QUEUE and integration report INTEGRATION-PR6-19 on `integration/release-candidate`, plus `src/tools/index.ts`. Current registry contains 29 original tools plus three read-only adapters: `search_events_across_calendars`, `find_available_slots`, `detect_event_conflicts`. Original calendar/event CRUD, recurrence occurrence mutation, comments, memos, labels, members, holidays and recent activity already exist. Standalone prototypes include batch preview, templates, conflicts, briefing, travel buffer, undo, share-slots and natural-date parsing, but **are not all registered**. The 172-test CI result is not a release pass: dependency audit blocks release. This report proposes *incremental product contracts*, not generic duplicate CRUD/search/free-busy. Do not assume private calendar access, event push notifications, location/ETA, invite acceptance, read receipts or undocumented official AI API. API feasibility below means implementation with already exposed read/write operations **subject to account authorization and live verification**; external data always requires explicit input/import.

## Six hypothetical personas (not observed research)
| Persona | Constraints and day-in-the-life | Top three jobs-to-be-done |
|---|---|---|
| P1 Dual-income parents, children 3 and 8 | At 07:00 one parent has early shift, daycare pickup at 17:30, school email announces 15:00 dismissal; two adults have different calendars and limited attention | Identify pickup coverage; detect school/commute collisions; propose a confirmed reassignment |
| P2 Single parent, child 6 | 06:30 school closure arrives by message; parent cannot assume a second adult will cover; mobile-only, time-poor, child privacy-sensitive | Triage urgent changes; produce realistic contingency options; avoid phantom helper/automatic writes |
| P3 Multigenerational caregiver | 08:00 elder appointment, 11:00 medication reminder, 15:00 child pickup; siblings share only some details, elder's consent varies | Coordinate transport and appointment preparation; keep health detail private; document *who agreed* without asserting it |
| P4 Long-distance couple | Two cities, irregular visits and time-zone/transport differences; a Friday train is delayed and Sunday plans change | Compare mutually shared free slots; draft visit options with manually supplied travel duration; share minimal details |
| P5 Student and club member, 17 | School classes, club practice, exam deadlines, club manager posts a last-minute change; limited permissions and parent oversight | Distinguish official vs tentative schedules; avoid exam clashes; create clear preparation checklist |
| P6 Shift worker, rotating nights | 22:00–07:00 shift crosses midnight; monthly rota changes; fatigue and post-shift recovery windows matter | Normalize overnight shifts; protect sleep/recovery blocks; detect changes without leaking employer or health details |

## User stories and feasibility
Legend: **Y** = current exposed event/calendar/memo read/write primitives plausibly suffice with authorized data; **P** = partial, needs user-supplied information/consent or integration; **B** = blocked by unsupported platform/external data. Classification NEW/ENHANCE/EXISTING/BLOCKED compares to existing modules and registration.

| ID | Persona, trigger and friction | Desired conversational interaction and capability | Acceptance criteria | Privacy/security risk and mitigation | API; classification |
|---|---|---|---|---|---|
| S01 | P1: school dismissal moved; parent calendars show overlapping meetings, unclear pickup owner | “木曜15時の迎え、誰が空いてる？候補だけ” → coverage-gap planner with explicit assignee candidates | Selected calendars only; conflicts + travel buffers; unknown availability never called free; no mutation | Child pickup location/identity; minimize names and avoid sending outside approved calendar | P; **ENHANCE** availability/conflicts |
| S02 | P1: pickup ownership changed twice; duplicate edits | “迎え担当を私に変える前に差分を見せて” → responsibility-aware change preview | Show event ID, previous/new owner field or title convention, affected scope, confirmation before write | Other adult's consent not inferred; assignment is proposal, not accepted commitment | P; **ENHANCE** batch preview/mutation gate |
| S03 | P2: school closure SMS at 06:30, no linked school feed | “この文面から休校日だけ抽出して予定候補を作って” → paste-to-draft with provenance | No autonomous message access; dates ambiguities flagged; user approval; no silent event creation | Child/school name and pasted sensitive text; redact logs and discard raw content | Y for manually supplied text + event create; **ENHANCE** natural-date/templates |
| S04 | P2: sick child, childcare backup uncertain | “今週の勤務と通院で動かせる時間を教えて” → bounded what-if availability without inventing caregivers | All unshared calendars marked unknown; suggestion not confirmation; selected range ≤31 days | Exposing employer calendar; return busy-only and require explicit scope | P; **ENHANCE** availability |
| S05 | P3: hospital visit and elder transport, siblings see different calendar details | “病院予定の時間だけ共有できる候補を作って” → busy-only caregiver handoff | No diagnosis, attendee or notes in export; opt-in; expiring payload handled outside API | Health data sensitive; no automatic public links; user controls redaction | P; **ENHANCE** share-slots |
| S06 | P3: medication and care checklist missing after reschedule | “来週の通院準備をチェックリストにして、元予定を示して” → source-linked prep brief | Every suggestion references event ID; generated suggestions clearly not medical advice; no assumed medication details | Health inference; no clinical advice; no third-party notification | Y for event metadata + local generation; **ENHANCE** briefing |
| S07 | P3: sibling says “I can drive” in external chat; app has no verified acceptance | “送迎担当の確認待ちを一覧にして” → pending-confirmation ledger (local, explicit) | Status proposed/accepted recorded only from direct authorized input; never claim notification or RSVP | Impersonation; no inferred consent or fake read receipts | P; **NEW** responsibility ledger |
| S08 | P4: Friday visit travel time conflicts with work | “金曜の面会候補を移動90分込みで比較して” → manual-duration slot comparison | Duration sourced from user; no claimed live ETA; DST and cross-midnight tested | Relationship details; busy-only output and opt-in share | Y with selected accessible events; **ENHANCE** travel buffer |
| S09 | P4: couple wants shared window without revealing therapy appointment | “予定名を隠して土日の空きだけ送る案を” → privacy-safe availability payload | No titles, people, calendar IDs in shared output; expiry enforced by sharing layer | Re-identification from narrow time windows; coarse granularity option | P; **ENHANCE** share-slots |
| S10 | P5: club schedule conflicts with exams and teacher change | “部活と試験の重複だけ、元の予定つきで教えて” → tagged provenance conflicts | No unauthorized school access; source event IDs, timezone and date; no automatic edits | Minor's school data; consent and selected calendars only | Y; **EXISTING** conflict detector + briefing presentation |
| S11 | P5: timetable screenshot or PDF, currently not API data | “貼った時間割を候補として見せて” → user-supplied import preview, never auto-save | Import only from supplied text/structured data; ambiguous weekdays resolved; duplicates identified | Third-party names, OCR errors; avoid silent conversion and retention | P; **NEW** import normalization, external parsing needed |
| S12 | P6: overnight shift 22:00–07:00 shows incorrect day grouping | “夜勤明けの睡眠を守って次の予定を確認” → cross-midnight fatigue buffer | Use full timestamps and timezone; buffer user-configured; DST tested; no medical claims | Employment/health inferences; private local rules | Y; **ENHANCE** travel-buffer/conflicts |
| S13 | P6: rota changes every month and one occurrence needs moving | “今月の第3夜勤だけ変更案を見せて” → recurrence scope and diff guard | Single occurrence vs whole series explicit; show affected dates; confirm; no write by default | Accidental mass edits; scope check, rollback plan | Y conditional on recurrence API semantics; **ENHANCE** recurrence + mutation gate |
| S14 | P1/P6: urgent change; user expects notification on phone | “迎え予定が変わったらすぐ通知して” → push change monitor | Requires approved background runtime, polling/notifications permission, freshness SLA; otherwise state unavailable | Background credentials, unwanted notifications; opt-in and revocation | B for native push via current MCP alone; **BLOCKED** platform |
| S15 | P3: elder is not a calendar member; family wants full care-plan sync | “祖母の非共有予定も含めて調整して” → external private calendar aggregation | Never fetch calendars outside authenticated scope; explicit invite/import required | Unauthorized health-calendar access; deny by default | B without permission; **BLOCKED** access |
| S16 | P2/P5: recurring school holiday or club timetable pasted in one batch | “学校の行事予定を重複確認して下書きに” → duplicate-aware draft import | Dry-run per event, date/time ambiguity flags, approval; no mass mutation without explicit scope | Minors' school and location details; redaction and rate limits | P; **ENHANCE** batch preview/templates |

## Top 10 ranked opportunities
Scales: frequency F (1 rare–5 daily), pain P (1 low–5 critical), feasibility I (1 blocked–5 straightforward with current modules), safety S (1 high residual risk–5 low risk with controls). **Score = 3F + 3P + 2I + 2S (max 50)**. These are hypothesis-based judgments, not measured demand; prioritize user interviews before roadmap commitments.

| Rank | Opportunity (stories) | F | P | I | S | Score | Delivery rationale |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | Childcare/pickup coverage gap (S01) | 5 | 5 | 4 | 4 | 46 | **Quick win** on selected calendars; assignment remains proposed |
| 2 | Overnight-shift and recovery-safe conflicts (S12) | 5 | 5 | 4 | 4 | 46 | **Quick win** deterministic timestamps + configurable buffer |
| 3 | Source-linked daily family prep brief (S06) | 5 | 4 | 5 | 4 | 45 | **Quick win** briefing module extension |
| 4 | School notice paste-to-preview (S03) | 4 | 5 | 4 | 4 | 43 | **Quick win** if user supplies text; no inbox access |
| 5 | Confirmed responsibility handoff ledger (S07) | 4 | 5 | 3 | 4 | 41 | **NEW** local state + manual consent; not native RSVP |
| 6 | Recurring one-off change safety (S13) | 4 | 5 | 3 | 4 | 41 | **ENHANCE** existing recurrence/undo; API semantics QA needed |
| 7 | Privacy-safe care availability share (S05/S09) | 4 | 4 | 4 | 4 | 40 | **Quick win** with opt-in and limited granularity |
| 8 | Manual travel-time visit planner (S08) | 3 | 4 | 5 | 4 | 39 | **Quick win** no invented live ETA |
| 9 | Duplicate-aware school batch import (S16) | 3 | 4 | 4 | 4 | 37 | **ENHANCE** template/batch dry-run |
| 10 | Emergency childcare what-if (S04) | 3 | 5 | 3 | 3 | 36 | **ENHANCE** limited by unknown helper availability |

Scores tie intentionally; higher criticality of overnight shift may warrant same-priority pilot. Native push alert S14 and inaccessible elder calendar S15 are excluded as **API/platform blockers**, not hidden in feasibility scores.

## Failure and abuse cases / required guardrails
1. **Unapproved child pickup reassignment:** AI edits shared event title implying another parent agreed → preview + explicit user confirmation; distinguish proposal from accepted duty; no automated messages.
2. **Elder health leakage:** share link reveals appointment title or participant → busy-only export, coarse windows, expiration enforced by actual hosting layer, consent review.
3. **Night shift DST transition:** 22:00–07:00 converted by naive date slicing → IANA timezone-aware instant comparison, DST fixtures, never infer duration from date alone.
4. **Recurring-event mass deletion:** “this Friday only” interpreted as series → occurrence ID and scope preview, deny if provider semantics unknown.
5. **Hallucinated school feed:** model assumes an external notice was received → only user-provided text or authenticated feed, show provenance and source freshness.
6. **Duplicate batch creation:** retried request creates 20 duplicate events → idempotency ledger where supported, dry-run duplicate matching, explicit retry reconciliation.
7. **False acceptance/RSVP:** sibling comment is interpreted as binding commitment → manual acceptance status with actor provenance, no impersonation.
8. **Sensitive calendar scope escalation:** family member asks for non-shared elder appointments → fail closed, show unavailable rather than guess.
9. **Stale data after last-minute change:** assistant says pickup covered using yesterday's snapshot → retrieved-at timestamp, refresh before action, fail with unknown state when stale.
10. **Nontechnical onboarding credential leak:** user pastes TimeTree cookie in chat → refuse secret ingestion in MCP arguments; direct to private local onboarding, redact logs.

## MVP shortlist (ordered, maximum five)
1. **Family coverage gap explanation** (S01/S04): selected-calendar free/busy + manual responsibility labels; read-only, source-linked; pilot dual-income and single-parent households.
2. **Overnight shift conflict policy** (S12): midnight/DST safe comparisons, user-configurable recovery buffer; read-only.
3. **Provenance-first family briefing** (S06): opt-in, no medical inference, source event ID and preparation checklist marked suggestion.
4. **School notice to safe draft** (S03/S16): user-pasted notice, ambiguity clarification, duplicate check, confirmation before event write.
5. **Explicit responsibility handoff** (S07/S02): proposed/accepted/pending states without impersonation; **later MVP** pending local-state privacy design.

The first three avoid new remote write permissions. Gate 4–5 on mutation safety and real-user validation. Existing search/free-busy/conflicts and standalone briefing/travel modules must be reused, not rebuilt.

## Three Japanese example prompts
- 「今週木曜の保育園のお迎え、私とパートナーの共有している予定だけで空いている時間を調べて。担当変更はまだしないで。」
- 「今夜22時から明朝7時まで夜勤です。夜勤明けの休息を8時間として、翌日の予定で重なるものだけ教えて。」
- 「この学校からの連絡文を予定候補にして、日付が曖昧なところと重複を先に見せて。確認するまで登録しないで。」

## Interview assumptions and validation plan
These personas and scores are **hypotheses**, not fabricated interview findings. Validate: (a) who actually owns pickup responsibility and how households record acceptance; (b) whether single parents have accessible backup calendars; (c) elder consent and what data may be shared; (d) whether shift workers prefer rest buffers or find them intrusive; (e) school notice input formats, minor consent and recurring timetable cadence; (f) tolerance for manual travel durations; (g) notification expectation and freshness thresholds; (h) preference for mobile-first onboarding and whether private credential setup is viable; (i) whether families already use native TimeTree comments/memos instead of new handoff state; (j) regional variation in school holidays, caregiving norms and date expressions.

Suggested interviews: 2–3 participants per persona for exploratory research (12–18 total), not statistically representative. Ask for a redacted example of the last *actual* schedule change, who noticed it, what was missed, and what action was authorized. Run a no-write prototype with synthetic events and observe misunderstanding rates; do not collect real credentials or private child/medical data.

## Coordinator handoff
Prioritize **read-only coverage and overnight shift safety**; preserve API permission boundaries. Existing tools provide building blocks, but no validated production mobile connector or notifications. Engineering tickets should specify consent, timezone fixtures, provenance, no-write defaults, and whether integration is actually registered. No source code, CI, README or main branch changes requested.
