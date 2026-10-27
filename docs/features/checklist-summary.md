# Checklist progress summary (isolated prototype)

Read-only pure function `summarizeChecklists(snapshots, filter)` in `src/features/checklist-summary/index.ts`.

## Input contract
Provide normalized, already-authorized `get_events` and/or `list_memos` response arrays per calendar:
`{ calendar_id, events?: [{uuid, checklist}], memos?: [{uuid, checklist}] }`.
The tool outputs are **not** accepted directly without an adapter: `get_events` includes `calendar_id` on the wrapper, and `list_memos` has a `memos` array. Only calendars explicitly listed in `filter.calendarIds` are summarized. `scope` is `events`, `memos`, or `both`; `ids` optionally selects event/memo UUIDs (within selected calendars). An event with `category: 2` is excluded from the events side to prevent counting a memo twice.

## Semantics
`total = completed + incomplete` for valid checklist items only. `empty` counts explicit `[]`, `unavailable` counts null/missing, and `malformed` counts invalid/oversized lists. Each record reports status, calendar ID, UUID, kind and counts. Repeated records deduplicate by (calendar ID, UUID, kind), not UUID alone. Titles are omitted unless `includeTitles: true`; no event titles, participants, notes or calendar names are returned. A malformed checklist is excluded entirely, not partially counted.

The function does not mutate inputs, write TimeTree data, fetch missing pages or infer absent checklists are empty. Max 500 checklist items per record and 10,000 records per snapshot; oversized snapshots fail closed. The upstream tool's paging/recurrence truncation must be checked by the future adapter; summaries are only as complete as their authorized input snapshots. All-day dates and timezones do not affect checklist completion counts.

## Security and integration
This is not registered in the MCP tool registry and is not an available user-facing feature. Future coordinator-owned adapter should validate response completeness, enforce per-calendar authorization, redact titles by default, and reject ambiguous/partial snapshots. No private/undocumented API calls or checklist mutations.
