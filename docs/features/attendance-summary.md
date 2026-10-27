# Attendance association summary (prototype)

This is an **unofficial** read-only TimeTree MCP feature prototype, not affiliated with TimeTree, Inc. No provider API or live account access is required.

## Contract

`summarizeEventAttendance(event, roster, { allowedCalendarIds, anonymize?, maxParticipants? })` accepts a single event normalized from `get_events` (`uuid`, `calendar_id`, `attendees`, `virtual_user_attendees`) and an optional **same-calendar** roster from `get_calendar_members` and `get_calendar_virtual_members`. The caller must supply an authorization-checked calendar allowlist and never pass rosters from other calendars. No network access or mutation occurs.

- Account attendee IDs and virtual member associations are **separate categories**; they are not RSVP confirmations, attendance records, consent, or notifications.
- Unknown, inactive or missing roster entries have `status: unknown` and never reveal an identifier or stale name. Missing roster yields unknown status for all entries.
- `anonymize: true` suppresses all names. Names are anonymized by default; only explicit `anonymize: false` may emit known active same-calendar roster names. Default cap: 1000 participant entries and 1000 combined roster entries; malformed arrays, members and missing options are rejected.
- Duplicate identifiers are deduplicated **within** each category. IDs are not joined across calendars. Calendar permission denial and mismatched roster fail closed.

## Test

`npm run test:build && node --test tests/native-attendance*.test.mjs`

This module is not MCP-registered. Coordinator must validate calendar access against the authenticated principal before providing allowlists, validate upstream response shapes, add permission-gated adapter and review disclosure defaults. No RSVP, join/leave, notifications, writes or real-user testing. TimeTree Connect App API is discontinued; no undocumented endpoints are assumed.
