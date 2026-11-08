import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPreviewCalendarBridgeTool,
  createExportCalendarBridgeIcsTool,
} from '../.test-dist/tools/bridge-tools.js';

const start = Date.UTC(2026, 10, 10);
const end = Date.UTC(2026, 10, 12);

function event(overrides = {}) {
  return {
    id: 'internal-1', uuid: 'event-1', calendar_id: 12,
    title: 'Doctor visit', start_at: start + 3_600_000, end_at: start + 7_200_000,
    all_day: false, note: 'Medical details', category: 1, recurrences: [],
    ...overrides,
  };
}

function fakeApi(events) {
  const calls = [];
  return {
    calls,
    async getEventsByCalendar(calendarId) {
      calls.push(calendarId);
      return events;
    },
  };
}

const previewArgs = {
  calendar_id: '12',
  destination_calendar_id: 'user@example.com',
  start_at: start, end_at: end,
};

test('preview is provider neutral and never performs writes', async () => {
  const api = fakeApi([event()]);
  const tool = createPreviewCalendarBridgeTool(api);
  const result = await tool.handler(previewArgs);
  assert.equal(result.isError, undefined);
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.ready, false); // No verified Google snapshot yet.
  assert.equal(data.plan.totals.create, 1);
  assert.equal(data.plan.actions[0].event.title, 'Doctor visit');
  assert.deepEqual(api.calls, ['12']);
  assert.equal(tool.annotations.readOnlyHint, true);
});

test('a verified empty destination calendar is a complete snapshot', async () => {
  const tool = createPreviewCalendarBridgeTool(fakeApi([event()]));
  const result = await tool.handler({ ...previewArgs, destination_snapshot_complete: true, existing_destination_events: [] });
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.ready, true);
  assert.equal(data.snapshot_supplied, true);
});

test('busy-only preview never returns private details in create actions', async () => {
  const tool = createPreviewCalendarBridgeTool(fakeApi([event()]));
  const result = await tool.handler({ ...previewArgs, privacy: 'busy' });
  const data = JSON.parse(result.content[0].text);
  const created = data.plan.actions[0].event;
  assert.equal(created.title, 'Busy');
  assert.equal('description' in created, false);
});

test('older recurring series blocks a later window instead of silently vanishing', async () => {
  const oldSeries = event({
    start_at: start - 45 * 86_400_000,
    end_at: start - 45 * 86_400_000 + 3_600_000,
    recurrences: ['RRULE:FREQ=DAILY'],
  });
  const tool = createPreviewCalendarBridgeTool(fakeApi([oldSeries]));
  const result = await tool.handler({ ...previewArgs, destination_snapshot_complete: true });
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.ready, false);
  assert.equal(data.blocked, 1);
  assert.equal(data.plan.totals.create, 0);
});

test('all-day events do not get exported with unsafe time zone conversions', async () => {
  const tool = createExportCalendarBridgeIcsTool(fakeApi([event({ all_day: true })]));
  const result = await tool.handler({ calendar_id: '12', calendar_name: 'Family', start_at: start, end_at: end });
  assert.equal(result.isError, true);
});

test('ICS tool exports normal timed events and escapes text', async () => {
  const api = fakeApi([event({ title: 'A, B' })]);
  const tool = createExportCalendarBridgeIcsTool(api);
  const result = await tool.handler({ calendar_id: 12, calendar_name: 'Family', start_at: start, end_at: end });
  assert.equal(result.isError, undefined);
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.event_count, 1);
  assert.match(data.ics_content, /^BEGIN:VCALENDAR\r\n/);
  assert.match(data.ics_content, /SUMMARY:A\\, B/);
});

test('oversized source window fails instead of returning a partial export', async () => {
  const events = Array.from({ length: 251 }, (_, i) => event({ uuid: 'id-' + i }));
  const tool = createExportCalendarBridgeIcsTool(fakeApi(events));
  const result = await tool.handler({ calendar_id: '12', calendar_name: 'Family', start_at: start, end_at: end });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /INVALID_INPUT/);
});

test('rejects windows that are too long before calling external services', async () => {
  const api = fakeApi([event()]);
  const tool = createPreviewCalendarBridgeTool(api);
  const result = await tool.handler({ ...previewArgs, end_at: start + 367 * 86_400_000 });
  assert.equal(result.isError, true);
  assert.deepEqual(api.calls, []);
});

test('unreadable TimeTree records make the preview incomplete', async () => {
  const tool = createPreviewCalendarBridgeTool({
    async getEventsByCalendar(_id, _since, tally) { tally.skipped = 2; return [event()]; },
  });
  const response = await tool.handler({ ...previewArgs, destination_snapshot_complete: true });
  assert.equal(response.isError, undefined);
  const data = JSON.parse(response.content[0].text);
  assert.equal(data.unreadable, 2);
  assert.equal(data.ready, false);
  assert.match(data.warnings.join(' '), /unreadable/);
});

test('ICS export refuses an incomplete TimeTree feed', async () => {
  const tool = createExportCalendarBridgeIcsTool({
    async getEventsByCalendar(_id, _since, tally) { tally.skipped = 1; return [event()]; },
  });
  const response = await tool.handler({ calendar_id: '12', calendar_name: 'Family', start_at: start, end_at: end });
  assert.equal(response.isError, true);
  assert.match(response.content[0].text, /INVALID_INPUT/);
});
