# TimeTree native-feature coverage and differentiated MCP roadmap

Reviewed 2026-10-26 (JST). Sources: current TimeTree official Help/News, plus static inspection of `integration/release-candidate/src/tools/index.ts` and selected tool implementations. **A registered MCP tool is not a verified authorized public API capability.** No live account tests or provider authorization were performed. Read-only prototypes must not be advertised as working ChatGPT mobile plugins. This document tracks *feature completeness*, not release-readiness.

## The TimeTree product is broader than event CRUD

TimeTree currently exposes shared calendars; event guests/participation and virtual members; recurring appointments and reminders; checklists and memos; comments and photos; activity feed; albums; stickers; pinning; personal/home calendar overlays and external imports; public/followable calendars and discovery; event scanning; shareable free-day images; and paid file attachment/vertical view. These are app/Web features, **not proof of third-party API endpoints**.

Official sources:
- Shared calendar application feature map: https://support.timetreeapp.com/hc/ja/articles/900004492623
- Event options (reminders, recurrence, attendees, location, URL, checklist, files): https://support.timetreeapp.com/hc/ja/articles/204934675
- Event participation: https://support.timetreeapp.com/hc/ja/articles/360000189102
- Checklist for events and memos: https://support.timetreeapp.com/hc/ja/articles/900001090463
- Free-day image sharing: https://support.timetreeapp.com/hc/ja/articles/40309380548761
- Stickers (app-only display): https://support.timetreeapp.com/hc/ja/articles/34286393029913
- Album photo workflow: https://timetreeapp.com/intl/ja/usages/2026-09-05/how-to-use-album
- Public calendar feature category: https://support.timetreeapp.com/hc/ja/sections/360000040401
- Premium feature matrix: https://support.timetreeapp.com/hc/ja/articles/4647239978905
- External calendar integration limits: https://support.timetreeapp.com/hc/ja/articles/360000639682 ; https://support.timetreeapp.com/hc/ja/articles/360000639742
- TimeTree product renewal and Discover tab: https://timetreeapp.com/intl/ja/newsroom/2026-01-13/renewal-timetree-newsroom
- TimeTree official Web AI chat, announced 2026-10-13: https://timetreeapp.com/intl/ja/newsroom/2026-10-13/web-ai-chat
- Provider external developer Connect App API discontinued 2023-12-22: https://timetreeapp.com/intl/ja/newsroom/2023-12-14/connect-app-api-202312

## Coverage matrix — candidate branch, not released

Legend: **Registered** = in 32-tool candidate registry (but actual remote and provider live behavior unverified); **Partial** = only part of TimeTree app feature appears in tool inputs/outputs; **Absent** = no corresponding registered MCP tool; **Prototype** = standalone code/plan only. API feasibility for missing features is **UNKNOWN** until rights and official endpoint documentation are verified.

| Native TimeTree feature | Candidate MCP status / evidence | Priority | Proposed safe path |
| --- | --- | --- | --- |
| List/create shared calendars | **Registered:** list_calendars, create_calendar; no general calendar settings/edit/delete tools | P1 | Audit settings & user role permission semantics, no undeclared endpoints |
| Event create/edit/delete, copying, notes/location/URL, all-day | **Registered:** create_event, update_event, delete_event, copy_event | Baseline | Confirm exact write scopes and live provider compatibility before release |
| RRULE recurrence and per-occurrence edits/deletes | **Registered:** update_event_occurrence, delete_event_occurrence, plus recurrence handling | P0 safety | Series split/EXDATE/DST regression and dry-run safeguards |
| Event attendees / RSVP | **Partial:** create/update accepts attendee IDs, get_calendar_members reads members; no explicit join/leave toggle | P1 | Research TimeTree's participation semantics and allowed provider endpoint; no fake RSVP |
| Event reminders/notifications | **Partial:** event alerts input/output, but app-wide notification preferences and push behavior absent | P1 | Read-only capability discovery first; do not promise notification sending |
| Event/memo checklists | **Registered as fields:** create/update/read events and memos support checklist payload; no item-level checked/unchecked tool | P1 | Safe single-item checkbox preview/change with strict version/scope, if endpoint semantics established |
| Event comments / attached comment images | **Registered:** comment CRUD, read comment image; no upload in registry | Baseline | Handle private image/attachments safely, do not imply upload supported |
| Albums, photo uploads & event photo linkage | **Absent** | P2/blocked | Provider-rights, privacy and media authentication/limits research first; synthetic UX examples |
| Stickers | **Absent** (TimeTree app-only display) | P3 | Document app-only feature, avoid claiming a Web/MCP UI |
| Labels/colors | **Registered:** read and update calendar labels; event label fields | Baseline | Maintain user-friendly mappings/limits |
| Virtual members (children/pets etc.) | **Registered:** list/create/update/delete and assignment to events | P1 UX | Make family/shift participant summaries intuitive and permission-scoped |
| Calendar invite, member removal, shared calendar profile/cover | **Absent** except metadata reads | P2/blocked | Evaluate explicit permissions and provider authorization; avoid silent sharing/invitation |
| Memo board and notes | **Registered:** CRUD; checklist and related metadata | Baseline | Improve completion summaries and safe exact-target updates |
| Change history / 'New' tab | **Registered:** get_recent_activity, get_updated_events, but partial history only | P1 | Preserve retention/cursor limitations; never claim comprehensive audit trail |
| Event search, multi-calendar overlays | **Registered:** get_events; 3 candidate read tools for cross-calendar search, availability and conflicts | P1 | Explain source-scope, partial results and calendars not included |
| Free-day image sharing | **Partial/Prototype:** privacy-safe slot module not in public registry and no image exporter | P1 | Busy-only consensual sharable suggestion *draft*, not public link publishing |
| Pinned events/calendar filters / home widget / watch | **Absent:** largely UI-level device features | P3 | Not equivalent to MCP server behavior; document user-visible limits |
| Public calendar discovery/follow/'Interested'/copy | **Absent:** native TimeTree public-calendar feature, no registered third-party API | P2/blocked | Research public data licensing, provider rights, event visibility and attribution |
| Scan notices / AI from images | **Absent as MCP feature:** native TimeTree already has scan and Web AI chat | P1 UX | User-provided text/images → local/synthetic event draft preview; no claim of exclusive innovation |
| Premium file attachment & vertical view | **Partial:** existing event payload may accept attachment UUID, but uploading not provided and view is device UI | P2/blocked | Verify premium entitlements and upload rights; do not bypass paywall |
| iCalendar (.ics) portable export of selected events | **Prototype, NOT MCP-registered:** RFC 5545 offline generator on [PR #22](https://github.com/ODU33104/TimeTree-MCP/pull/22), from authorized normalized snapshots only; not direct TimeTree export | P1 / unique | Permission-scoped read-only interoperability, strict all-day/recurrence conversion and privacy-first title redaction; no provider endpoint implied |
| External Google/iCloud calendar | **Absent:** native TimeTree display/import behavior; not true bidirectional sync | P2 | Do not promise auto-updating shared imports or provider-export APIs |
| Official AI chat for event operations | **Competing native feature**, not an external API | Differentiation | Web AI beta already offers CRUD/search and pasted bulk entry, with confirmation cards; differentiate with safe multi-calendar planning, reproducible MCP tool contracts, trusted integrations |

## The attention-grabbing features we should actually build

**Focus 1 — TimeTree feature parity with safety (most immediate):** user-friendly checklist completion/status reporting; explicit event attendance overview; virtual-member and family responsibility summaries. These reuse **already registered data fields** and do not require guessing unpublished endpoints for basic read-only insights. For write controls, require exact target, full checklist preservation, freshness and preview.

**Focus 2 — technical signature feature:** **what-if calendar move simulation** across explicitly selected calendar IDs. Show conflicts created/resolved, busy-only impact, alternatives and before/after in a deterministic pure module. No actual writes; fail closed for incomplete snapshots/recurrence ambiguity. This is not native TimeTree's basic search or existing read-only conflict detection, and demonstrates a defensible API contract. A standalone prototype is **not yet a registered tool**.

**Focus 3 — worldwide usability:** concise Japanese/English everyday agenda, local date format and IANA timezones, DST tests, text fallback, privacy. Prioritize countries by verifiable official distribution, not assumptions about user counts.

**Focus 4 — long-horizon platform rights:** publicly hosted multi-user OAuth, public calendar data, uploads, mobile ChatGPT plugin distribution require provider permission and secure architecture. **No undocumented endpoint experiments or mass-account aggregation.**

## Immediate build/review order

1. Maintain this feature matrix and authoritative links; annotate differences between app UX, existing tool fields, tool registration, real-provider verified behavior and external API rights.
2. Build isolated **read-only what-if** module with deterministic synthetic fixtures and local TypeScript/unit tests; submit draft PR against integration branch, not main.
3. Build user-facing **checklist status** and **event participation read-only** views *using existing fields*; ensure no misleading join/leave or real-time notification claims.
4. Once dependency audit is fixed and provider access lawful, choose safe narrow MCP adapters for registration and end-to-end review. Do not expose experimental writes.
5. Keep future breadth visible in README as a clearly labeled roadmap, **not as supported features**; dedicated docs/branding worker owns README changes.

## Evidence/release constraints

Candidate registry had 32 MCP tools at review; dependencies failed prior release QA audit. Current personal TimeTree access relies on unofficial/undocumented interfaces. Never claim a successful native mobile TimeTree–ChatGPT connection, official partnership, unrestricted account sharing, confirmed live provider writes or blanket feature parity. No Actions during development and no merge to main.
