# iCalendar (.ics) export — offline interoperability prototype

**Status (2026-10-26):** isolated TypeScript module and **seven locally passing synthetic-fixture tests**; **not registered as an MCP tool**. It has no provider HTTP code, writes no events, and cannot automatically export from TimeTree. Public TimeTree integration and user authorization remain separate release blockers.

## Why this feature matters

It makes a caller-provided set of already-authorized calendar event snapshots portable in the widely recognized **RFC 5545 iCalendar** text format, which can be imported into many calendar clients. This is a general interoperability function, **not a promise of full TimeTree backup, syncing, support, or provider-endorsed export**.

## Usage from normalized synthetic data

```ts
import { exportICalendar } from './src/features/ical-export/index.js';

const ics = exportICalendar(
  [{
    calendarId: 'family',
    uid: 'random_opaque_001',
    title: 'Family lunch',
    start: '2026-10-26T11:00:00+09:00',
    end: '2026-10-26T12:00:00+09:00',
  }],
  {
    calendarIds: ['family'],
    calendarName: 'My selected events',
    timeZone: 'Asia/Tokyo',
    generatedAt: '2026-10-26T09:00:00+09:00',
    snapshotComplete: false,
    includeTitles: true, // false by default to avoid leaking event titles
    includeDescriptions: false,
    includeLocations: false,
  }
);
// 'ics' is text; caller may save it locally as *.ics.
// The exporter never accesses a provider API, network, filesystem or ChatGPT.
```

## Guarantees and limits

- Always chooses exact explicit calendar IDs (maximum 10), maximum 500 events; rejects out-of-scope events, duplicate/nonopaque UIDs, invalid timestamps, date formats and 366+ day event intervals.
- Uses explicit-offset ISO instants, UTC `DTSTART` / `DTEND` and deterministic `DTSTAMP` supplied by caller. Japanese/emoji-containing lines are folded by UTF-8 byte count at 75 octets, line endings are CRLF, content text is escaped against ICS injection.
- **Busy-only by default**: titles, descriptions and locations require explicit per-field opt-in. Every event is `CLASS:PRIVATE`; importer behavior and sharing are still outside our control. Never send event details to third-party calendars without informed user approval.
- All-day dates are `YYYY-MM-DD` values with **endDateExclusive**. TimeTree's app-level inclusive end-date convention must be correctly normalized upstream; do not feed raw TimeTree all-day values directly.
- Explicit partial/complete-*caller-asserted* snapshot marker. This is **not a verified all-account backup**. It does not export participants, comments, private attachments, album photos, alerts or provider permissions.
- Rejects recurrence-bearing input. The caller must explicitly expand repeating occurrences, assign unique opaque IDs and preserve exact approved scope. DST gap/fold ambiguity must be resolved by the caller before supplying explicit instants. No bulk personal export until terms and authorization permit it.
- No real account read, no write, no provider API endpoint, no public deployment. The module does not independently verify caller permission to access a snapshot.

## Recorded local checks

On the standalone module with Node.js 22.16.0 and globally installed TypeScript 5.8.3:

```sh
tsc --target es2022 --module es2022 --moduleResolution bundler --strict --skipLibCheck --outDir .test-dist/features/ical-export .test-dist/features/ical-export/index.ts
node --test tests/ical-export.test.mjs
# 7 passing, 0 failing
```

Tests cover CRLF/UTC, opt-in/redaction, injection escaping, leap-year all-day spans, Japanese UTF-8 fold, out-of-scope and duplicate denial, invalid timezones, and empty subsets.

**Not run:** full `npm ci`, repository `npm run typecheck`, `npm test`, and `npm audit` on this PR branch. The current environment cannot fetch dependencies from the registry, and existing candidate dependency audit findings are release-blocking. GitHub Actions were not started; no `main` merge.

### Future integration requirements

1. Authorized and permitted source of normalized, completeness-aware event snapshots.
2. Synthetic fixture adapter tests, including TimeTree inclusive all-day normalization and explicit recurrence expansion.
3. A **read-only, opt-in export operation**, client-specific file-save UX only where actually supported, carefully rate-limited.
4. Independent security review for calendar export exfiltration, sharing, server-side scopes and user confirmation. Never publish a bulk export endpoint relying solely on a client-provided `calendarIds` array.
5. Release approval only after provider rights, authentication safety, dependency audit, and actual app/client compatibility are verified.
