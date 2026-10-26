# What-if calendar move simulator (read-only prototype)

**Status:** standalone TypeScript function plus synthetic-data tests; **NOT REGISTERED as an MCP tool**, not running against a live TimeTree account, not bundled into the public executable until coordinator integration. Do not list as a released user-facing feature.

## Why

Native TimeTree already has event CRUD, activity, manual conflict markers and Web AI beta event edits. This simulator answers a different question: **"If I move this appointment, which collisions disappear and which new collisions arise across the calendars I explicitly selected?"** It never writes a calendar.

### Example

```ts
import { simulateEventMove } from './src/features/what-if-move/index.js';

const simulation = simulateEventMove(
  [
    { id: 'meeting', calendarId: 'family', start: '2026-10-26T09:00:00Z', end: '2026-10-26T10:00:00Z' },
    { id: 'pickup', calendarId: 'family', start: '2026-10-26T09:30:00Z', end: '2026-10-26T10:30:00Z' },
    { id: 'call', calendarId: 'work', start: '2026-10-26T12:00:00Z', end: '2026-10-26T13:00:00Z' },
  ],
  {
    calendarId: 'family', eventId: 'meeting', calendarIds: ['family', 'work'],
    snapshotComplete: true, timeZone: 'Asia/Tokyo',
    candidates: [
      { start: '2026-10-26T10:30:00Z', end: '2026-10-26T11:30:00Z' },
      { start: '2026-10-26T12:30:00Z', end: '2026-10-26T13:30:00Z' },
    ],
  }
);
// recommendedIndex = 0; first proposal resolves pickup collision;
// second proposal creates a collision with call; executed = false.
```

### Scope and explicit limits

- Explicit calendar IDs, caller-asserted fully populated snapshot, max 10 calendars, max 1,000 events, max 20 move candidates; no unauthorized calendar access or network calls inside the pure function.
- Keeps the exact original elapsed-time duration, bounds moves to 31 days, requires timezone-aware ISO instants and validates IANA time zone; half-open overlap semantics handle adjacent appointments and DST offsets.
- Fails closed for unexpanded recurring series, recurring target occurrences and all-day target events. A future specialized planner must explicitly handle series-wide vs one-instance semantics and local-day boundaries.
- Returns only event IDs, calendar IDs and timestamps; never returns event titles or personal details. Client-side presentation should also minimize identifying details.
- `safeWithinSnapshot` only means no collision among supplied events in selected calendars; it does **not** account for unselected/private calendars, missing provider pages, concurrent edits, travel time or notification preferences. The caller must fetch and validate completeness, freshness, scopes and permissions. `snapshotComplete: true` is the caller's assertion, not a server authorization check.
- This prototype **cannot** approve or execute an event update. Any future write path needs a fresh read, explicit exact-target confirmation, server-side authorization, and an independent mutation gate.

### Test evidence

Executed **outside the repository** on the same standalone algorithm/test logic (synthetic fixtures only), with Node 22.16.0 and global TypeScript 5.8.3:

```
tsc --target es2022 --module es2022 --moduleResolution bundler --strict --skipLibCheck --outDir build src/index.ts
node --test tests/what-if-move.test.mjs
# 7 passed, 0 failed
```

The committed test file imports the normal project `.test-dist/features/what-if-move/index.js`, so it participates in the existing `npm test` build when a dependency-enabled full checkout is available. **Full repository `npm ci`, `npm test`, `npm audit` not run on this branch** because the local environment cannot resolve the registry. Do not claim release QA passed.

Source feature audit: [TimeTree feature coverage](../../docs/coordination/TIMETREE-FEATURE-COVERAGE-20261026.md) on `coordination/parallel-workstreams`.
