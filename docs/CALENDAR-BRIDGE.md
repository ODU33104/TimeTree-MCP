# Calendar Bridge (development)

Calendar Bridge is being built on the existing TimeTree web-client implementation. No official TimeTree API is required for the existing read capabilities. This feature is **not yet an available MCP tool**.

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
