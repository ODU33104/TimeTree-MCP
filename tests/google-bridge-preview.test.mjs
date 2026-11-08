import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewGoogleCalendarBridgeTool } from '../.test-dist/tools/google-bridge-tools.js';
import { googleSourceMarker } from '../.test-dist/bridge/google-api.js';
import { sourceKey } from '../.test-dist/bridge/plan.js';

const from = Date.parse('2026-11-10T00:00:00Z');
const to = Date.parse('2026-11-11T00:00:00Z');
const input = { calendar_id: '123', google_calendar_id: 'google-family', start_at: from, end_at: to };
const sourceEvent = {
  uuid: 'tt-event-1', calendar_id: 123, title: 'Dentist',
  start_at: from + 3_600_000, end_at: from + 7_200_000,
  category: 1, all_day: false, recurrences: [], note: 'Secret note',
};
const googleEvent = {
  id: 'google-existing', summary: 'Dentist',
  start: { dateTime: new Date(sourceEvent.start_at).toISOString() },
  end: { dateTime: new Date(sourceEvent.end_at).toISOString() },
};
const connection = {
  accessToken: async () => 'synthetic-only',
  status: () => ({ configured: true, connected: true, authorizationPending: false,
    expiresAtMs: null, grantedScopes: [] }),
  disconnect: () => {},
  begin: async () => { throw new Error('not used'); },
};
function tool(source = [sourceEvent], destination = [], role = 'owner', tallyCount = 0) {
  const apiClient = { async getEventsByCalendar(_id, _since, tally) {
    tally.skipped = tallyCount;
    return source;
  } };
  const googleApi = {
    async listCalendars() { return [{ id: 'google-family', summary: 'Family', accessRole: role, primary: false }]; },
    async listEvents() { return destination; },
  };
  return createPreviewGoogleCalendarBridgeTool(apiClient, connection, googleApi);
}
const json = output => JSON.parse(output.content[0].text);

test('fetches both providers and previews creating one event without writing', async () => {
  const result = await tool().handler(input);
  assert.equal(result.isError, undefined);
  const preview = json(result);
  assert.equal(preview.ready, true);
  assert.equal(preview.plan.totals.create, 1);
  assert.equal(preview.google_calendar_id, 'google-family');
  assert.equal(preview.destination_scanned, 0);
});

test('recognizes an event previously created with a private hashed marker', async () => {
  const marker = googleSourceMarker(sourceKey({ calendarId: '123', id: 'tt-event-1' }));
  const existing = { ...googleEvent, extendedProperties: { private: { timetreeMcpKey: marker } } };
  const preview = json(await tool([sourceEvent], [existing]).handler(input));
  assert.equal(preview.plan.totals.create, 0);
  assert.equal(preview.plan.actions[0].reason, 'already-synced');
});

test('does not silently create duplicates matching title and time', async () => {
  const preview = json(await tool([sourceEvent], [googleEvent]).handler(input));
  assert.equal(preview.plan.actions[0].reason, 'possible-duplicate');
  assert.equal(preview.plan.totals.create, 0);
});

test('a reader-access Google calendar cannot be marked ready for migration', async () => {
  const preview = json(await tool([sourceEvent], [], 'reader').handler(input));
  assert.equal(preview.ready, false);
  assert.match(preview.warnings.join(' '), /not writable/);
});

test('busy-only preview never includes private source title or note in proposed creates', async () => {
  const preview = json(await tool().handler({ ...input, privacy: 'busy' }));
  assert.equal(preview.plan.actions[0].event.title, 'Busy');
  assert.equal(JSON.stringify(preview).includes('Secret note'), false);
});

test('recurring series started before window blocks migration', async () => {
  const oldRecurring = { ...sourceEvent, start_at: from - 15 * 86_400_000,
    end_at: from - 15 * 86_400_000 + 3_600_000, recurrences: ['RRULE:FREQ=DAILY'] };
  const preview = json(await tool([oldRecurring]).handler(input));
  assert.equal(preview.ready, false);
  assert.equal(preview.blocked, 1);
  assert.equal(preview.plan.totals.create, 0);
});

test('unreadable source items make the comparison incomplete', async () => {
  const preview = json(await tool([sourceEvent], [], 'owner', 1).handler(input));
  assert.equal(preview.ready, false);
  assert.equal(preview.unreadable, 1);
});

test('malformed destination event prevents a misleading safe preview', async () => {
  const output = await tool([sourceEvent], [{ id: 'bad', summary: 'Unknown' }]).handler(input);
  assert.equal(output.isError, true);
});

test('blocks invalid window input before either provider is called', async () => {
  let calls = 0;
  const api = { getEventsByCalendar: async () => { calls++; return [sourceEvent]; } };
  const google = { listCalendars: async () => { calls++; return []; },
    listEvents: async () => { calls++; return []; } };
  const output = await createPreviewGoogleCalendarBridgeTool(api, connection, google).handler({
    ...input, end_at: from - 1,
  });
  assert.equal(output.isError, true);
  assert.equal(calls, 0);
});
