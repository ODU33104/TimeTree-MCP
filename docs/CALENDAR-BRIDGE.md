# Calendar Bridge (development)

Calendar Bridge is being built on the existing TimeTree web-client implementation. No official TimeTree API is required for the existing read capabilities. Development `main` exposes read-only MCP tools including Google OAuth connection and real two-provider comparison; automatic writes and syncing are not yet available. They are **not in the v0.9.0 release tag**.

## Current development implementation

- `preview_calendar_bridge`: read selected TimeTree events within a required date window and return creates/skips, duplicate warnings and blocked event IDs; no Google write.\n- `preview_google_calendar_bridge`: retrieve both actual TimeTree and locally OAuth-authorized Google calendar events, compare source markers and signatures and return create/skip proposals. No writes.
- `export_calendar_bridge_ics`: export bounded single, timed TimeTree events as RFC 5545 text; aborts if the window includes recurring, exception or all-day events.
- Both tools work without an interactive host UI. An optional MCP Apps preview resource is served only to clients that advertise the compatible extension.
- `src/bridge/google-api.ts`: Google Calendar REST adapter with paginated reads, private source-key deduplication and disabled-by-default write method. `src/bridge/google-oauth.ts` and `google-connection.ts` provide process-local desktop PKCE OAuth; no Google write tool is exposed.
- `src/bridge/journal.ts` and `journal-store.ts`: revision-checked event mappings and local atomic persistence. Not yet wired into live sync execution.
- No GitHub Actions; run validation locally with `npm ci && npm run typecheck && npm test && npm run build`. Tests added in this series have not yet been executed in the authoring environment.

## Implemented foundation

`src/bridge/plan.ts` exports a pure, read-only migration planner. It accepts normalized TimeTree events, one source-to-destination calendar mapping, and a snapshot of destination events. It returns proposed creates and skips. It does not connect to Google, write credentials, create events, or delete anything. It supports a busy-only privacy mode and conservative duplicate detection. Tests use fictional data.

## Required before enabling Google writes

1. Add an OAuth 2.0 authorization-code flow with PKCE, minimum calendar scopes, token encryption at rest, account selection and disconnect/revoke.
2. Enumerate destination calendars with write permissions; show a user-confirmed mapping for each source calendar. Never infer destination calendars from names alone.
3. Implement a persistent mapping journal with source calendar ID, source event ID, destination calendar ID, destination event ID, source revision/hash and last confirmed write. Ensure crash-safe atomic persistence.
4. Verify full historical pagination and event shape, all-day dates, time zones, recurrence series/exceptions, deleted events, attendees, and attachments. Report fields that cannot be transferred.
5. Implement explicit preview and confirmation, batch limits, retry policy, backoff, idempotency, and reconciliation of uncertain writes. A timeout after a write must not blindly create another event.
6. Keep destination deletion disabled by default. Never delete a user's pre-existing Google event. Rollback must only target events created and recorded by this bridge.
7. Choose whether sync is manual, on MCP invocation, or performed by an opt-in local scheduler. A stdio MCP server alone does not guarantee background sync.
8. Add fixture-based integration tests using mocked Google HTTP responses before any user acceptance testing. Never use real calendar data in automated tests.

## Known planner limitations

- Duplicate matching by title/time is a conservative heuristic; it can miss semantically identical events or skip legitimate coincident events.
- A busy-only export may collide with other busy blocks. User review is required.
- The planner does not yet propose updates, recurrence transforms, deletions or two-way conflict resolution.
- The planner's `sourceKey` is a logical identifier, not a Google API event ID. The adapter must store it in a safe metadata field or a separate journal.
- The test suite must pass in CI before the planner is considered verified.


## Read-only tool examples (MCP arguments)

`preview_calendar_bridge`:

```json
{
  "calendar_id": "123",
  "destination_calendar_id": "family@example.com",
  "start_at": 1794268800000,
  "end_at": 1794355200000,
  "privacy": "busy",
  "destination_snapshot_complete": false,
  "existing_destination_events": []
}
```

`export_calendar_bridge_ics`:

```json
{
  "calendar_id": "123",
  "calendar_name": "Family",
  "start_at": 1794268800000,
  "end_at": 1794355200000,
  "privacy": "full"
}
```

Both examples use synthetic IDs and dates, not a real account. The preview is not a permission to write, even if its `ready` field is `true`. `destination_snapshot_complete` must only be set after reading all relevant Google events. A Google account with no events can be a confirmed empty snapshot.

**Limitations:** up to 250 selected events in a maximum 366-day window per call. Entire calendars are read from TimeTree before filtering. Recurring series that began before the window still block migration; unsupported events are never silently ignored as safe to transfer. Google synchronization, background scheduling, cross-account OAuth and visual CRUD edits are future work.


## Real Google comparison example (development main only)

`connect_google_calendar` starts a local OAuth authorization. After the user authorizes in the browser on the same computer, use `list_google_calendars` to select a destination and then:

```json
{
  "calendar_id": "123",
  "google_calendar_id": "example-calendar@group.calendar.google.com",
  "start_at": 1794268800000,
  "end_at": 1794355200000,
  "privacy": "full"
}
```

Call `preview_google_calendar_bridge` with that input. The server checks the destination against Google, reads TimeTree, and returns a structured preview, with `ready:false` when the destination lacks writer permission, source data is unreadable, or unsupported recurrences and all-day records are present. The MCP Apps visual interface can invoke this preview by selecting both calendars and a UTC time window.

## Explicitly not complete

- The Google OAuth token exists only in the server process memory; reconnect after restarting the server.
- Google calendar writes, journal-backed resume, conflict resolution, and background sync are not exposed as user tools.
- A preview is **not** permission to perform real changes, even if `ready:true`.
- A shared, remotely hosted OAuth experience and ChatGPT mobile connection are not implemented.
- Live host UI testing and the complete Node/npm automated test suite are pending due to the authoring environment's dependency-download restriction.
