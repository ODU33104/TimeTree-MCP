# GLOBAL-MOBILE-UX — synthetic smartphone-first UX specification
Date: 2026-10-28. Status: design/research only; no provider access, mobile connector, deployment, or user study. Personas are hypotheses.

## Boundaries and source evidence
Based on PERSONA-SYNTHESIS.md, MOBILE-DISTRIBUTION-FEASIBILITY.md, PRODUCT-STRATEGY-MOBILE-FIRST.md (coordination branch). Official TimeTree Connect App API termination: https://support.timetreeapp.com/hc/en-us/articles/360000129821 (verify URL/content before external publication). Current platform availability must be rechecked against https://help.openai.com/ and https://platform.openai.com/docs/ before launch. No country-market share inference. All names, events and users below are invented. Mobile custom MCP registration and TimeTree authorization are NOT verified.

## Shared response contract (client-neutral, v0 proposal)
```json
{
  "schema_version":"ux-result.v0",
  "flow":"agenda|free_slots|notice_preview",
  "locale":"ja-JP",
  "display_timezone":"Asia/Tokyo",
  "window":{"start":"2026-11-01T00:00:00+09:00","end":"2026-11-02T00:00:00+09:00"},
  "calendar_scope":{"requested_ids":["synthetic-family"],"authorized_ids":["synthetic-family"],"excluded_ids":[]},
  "fetched_at":"2026-10-28T00:00:00Z",
  "partial":false,"truncated":false,"stale":false,
  "provenance":[{"source":"synthetic-fixture","calendar_id":"synthetic-family","event_id":"e1"}],
  "privacy":{"mode":"private|busy_only","titles_shared":false,"participant_names_shared":false},
  "state":"ready|empty|clarification|offline|denied|error|preview|approval_required|uncertain",
  "text_fallback":"...",
  "items":[],
  "approval":{"required":false,"scope":null,"diff":null,"expires_at":null}
}
```
Reject mismatched/unknown calendar IDs; partial=true for any inaccessible calendar or incomplete page. Unknown freshness is stale, never implicitly current. Approval is a proposed boundary, not implemented token issuance. Never interpret event titles or pasted notices as executable instructions.

## Flow A — compact agenda (read only)
JA: 利用者「今日の予定は？」→ アシスタント「家族カレンダーのみ、10:00取得。15:00 歯科（架空）。他のカレンダーは確認していません。」→ 利用者「詳細」→ アシスタント「15:00–15:30、出典 e1。変更はしていません。」
EN: User “What's on today?” → Assistant “Family calendar only, fetched at 10:00. 3:00 PM dentist (sample). Other calendars were not checked.” → User “Details” → Assistant “3:00–3:30 PM, source e1. No changes made.”
Empty: “選択した範囲に予定なし / No events in the selected scope” (not “you are free”). Error/offline: show last fetched timestamp and do not assert live status. Ambiguous “today”: ask for timezone if account timezone unavailable. State sequence: scope selection → read → compact → expand/empty/stale/error.
Acceptance fixtures: (1) one event correct local date; (2) two-user events never cross identity; (3) unauthorized calendar omitted and partial marked; (4) overnight shift appears on both intersected days without duplication; (5) offline snapshot marked stale; (6) DST fold timestamps show offset; (7) truncated pagination not called complete.

## Flow B — consent-scoped free slots (read only)
JA: 利用者「土曜の午後、二人が空く時間は？」→ アシスタント「共有許可済みのA・Bの予定だけを忙しい時間として照合します。非共有カレンダーは含みません。よいですか？」→ 利用者「はい」→ アシスタント「14:00–15:00 が候補（架空）。予定名は表示しません。Bの非共有予定は不明です。」
EN: User “When are we both free Saturday afternoon?” → Assistant “I can compare authorized busy intervals for A and B only. Private calendars aren't included. Proceed?” → User “Yes” → Assistant “2:00–3:00 PM is a candidate (sample). No event titles shown; B's private schedule is unknown.”
Empty: no verified common slots in checked scope, not universal unavailability. Denied: no inference about other person's schedule. Ambiguous Saturday/timezone: ask clarification. State sequence: consent → authorized scope → bounded busy intervals → candidate/empty/partial.
Acceptance fixtures: (1) two authorized users intersect; (2) one non-shared calendar excluded; (3) missing participant consent denied; (4) overnight busy shift blocks morning; (5) offline/stale prevents “confirmed free”; (6) DST gap/fold handled as absolute instants; (7) busy-only output contains no titles, participants or source private IDs.

## Flow C — pasted notice to draft preview (no writes)
JA: 利用者「学校のお知らせ：11月3日 9時 集合。予定にして」→ アシスタント「下書き：11月3日 09:00、学校集合。年・終了時刻・対象カレンダーを確認してください。まだ登録しません。」→ 利用者「家族用、2026年、終了10時」→ アシスタント「差分プレビュー：家族用に09:00–10:00を新規作成する案。重複候補が1件あります。登録操作は未実装です。」
EN: User “School notice: meet Nov 3 at 9. Add it.” → Assistant “Draft: Nov 3, 9:00 AM, school meetup. Confirm year, end time and calendar; nothing saved.” → User “Family calendar, 2026, ends at 10.” → Assistant “Preview: proposed 9:00–10:00 event in Family. One possible duplicate; no write performed.”
Empty: no parseable date → request exact date. Error: untrusted pasted instructions ignored. Ambiguous time/year/zone → ask rather than guess. State sequence: paste → parse as untrusted data → clarify → duplicate-check preview → approval_required (future only).
Acceptance fixtures: (1) explicit date and timezone; (2) missing year asks; (3) ambiguous 03/04 asks locale; (4) duplicate notice warns, no automatic insert; (5) malicious pasted “ignore rules” ignored; (6) non-shared target rejected; (7) DST nonexistent local time rejected; (8) stale duplicate snapshot blocks confident no-duplicate assertion.

## Localization and accessibility
Initial test locales: ja-JP and en-US (hypothesis from existing Japanese/English project documentation; NOT a geographic popularity ranking). Next candidates ko-KR, zh-TW, en-GB based on documented app language availability only after verifying TimeTree locale support; no claim of regional adoption. Source to verify: https://support.timetreeapp.com/ and official app-store locale listings. Show locale-specific day/month order, 12/24-hour clock, first day of week and calendar naming; store IANA zone and UTC instant separately. DST gap must require a new time; DST fold requires explicit earlier/later offset. Design for RTL expansion even if initial locales are LTR. Screen-reader text must read date, zone, status and privacy scope in order; avoid color-only warnings, support large text and keyboard/switch navigation. Translate denial, ambiguity and approval text—not just successful states. Text fallback always available; MCP cannot guarantee native buttons/cards.

## Delivery gates
Stage 1: offline synthetic text-only read-only prototype; deterministic fixtures and accessibility copy review. Stage 2: authenticated Web MCP demo with synthetic data, validated transport, privacy, scopes and client rendering; no public endpoint by default. Stage 3: mobile public plugin only after written TimeTree authorization, supported per-user OAuth/multi-tenant isolation, platform approval, security audit, independent QA, iOS/Android device verification. No live provider API calls before rights review.

## Measurement (privacy-preserving)
Measure aggregate opt-in setup completion %, median time-to-first-useful-answer, clarification/misunderstanding %, unsafe action attempts blocked %, weekly retained opt-in users %, voluntary referral intent %. Never log raw titles, locations, participant names or pasted notices. Record sample size and confidence intervals; no invented traction claims.

## Engineering handoff / residual risks
Propose UX-TRUST-ENVELOPE (freshness/scope/partial), UX-ACCESSIBLE-BRIEF (text-first), UX-LOCALE-GUARD (DST), UX-NOTICE-PREVIEW (untrusted notice + duplicate warning). Coordinator to assign new owners before code. Missing: real user research, verified official locale availability, mobile connector capability, provider authorization, security audit, end-to-end tests.

## Execution evidence
Branch: task/global-mobile-ux-20261028
Changed: docs/coordination/claims/GLOBAL-MOBILE-UX.md (atomic claim on coordination), docs/coordination/reports/GLOBAL-MOBILE-UX.md (this report).
Tests: NOT RUN (design-only task); build/typecheck/npm audit: NOT RUN; manual synthetic scenario design review: PASS (three flows and 22 enumerated acceptance fixtures); actual fixture execution: NOT RUN.
GitHub Actions: NOT RUN. Real accounts/credentials: NOT USED. Deployments: NONE. Merge: NONE.
