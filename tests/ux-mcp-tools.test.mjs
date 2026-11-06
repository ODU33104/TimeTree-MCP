import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchAcrossCalendarsTool, createFindAvailableSlotsTool,
  createDetectEventConflictsTool } from '../.test-dist/tools/ux-read-tools.js';
import { isToolAllowed } from '../.test-dist/utils/tool-access.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { TimeTreeAPIClient } from '../.test-dist/client/api.js';
import { toolResult } from '../.test-dist/tools/index.js';

const FROM = '2026-10-26T00:00:00Z';
const TO = '2026-10-26T04:00:00Z';
const time = value => Date.parse(value);
function event(id, title, start, end) {
  return { uuid: id, title, calendar_id: 1, all_day: false, start_at: time(start),
    end_at: time(end), category: 1, recurrences: [] };
}
const entries = {
  1: [event('a', 'Project sync', '2026-10-26T01:00:00Z', '2026-10-26T02:00:00Z')],
  2: [event('b', 'Team sync', '2026-10-26T01:30:00Z', '2026-10-26T02:30:00Z')],
};
function client(overrides = {}) {
  const calls = [];
  return { calls, getEventsByCalendar: async id => {
    calls.push(id);
    return entries[id] || [];
  }, ...overrides };
}
const json = result => JSON.parse(result.content[0].text);

test('registered read-only planners obey the MCP allowlist', () => {
  for (const name of ['search_events_across_calendars','find_available_slots','detect_event_conflicts']) {
    assert.equal(isToolAllowed(name, true), true);
  }
  assert.equal(isToolAllowed('delete_event', true), false);
  assert.equal(isToolAllowed('get_unknown_private_api', true), false);
});

test('cross-calendar search queries only selected calendars, pages, and returns minimal event fields', async () => {
  const api = client();
  const tool = createSearchAcrossCalendarsTool(api);
  const response = await tool.handler({ calendar_ids: ['1',2], start:FROM, end:TO, keyword:'sync', limit:1 });
  assert.equal(response.isError, undefined);
  const page = json(response);
  assert.deepEqual(api.calls, ['1','2']);
  assert.equal(page.total,2);
  assert.equal(page.next_offset,1);
  assert.deepEqual(Object.keys(page.events[0]).sort(),
    ['all_day','calendar_id','end_at','start_at','title','uuid'].sort());
});

test('availability excludes time ranges busy in any selected calendar without exposing titles', async () => {
  const api = client();
  const response = await createFindAvailableSlotsTool(api).handler({
    calendar_ids:['1','2'], start:FROM, end:TO, duration_minutes:60,
    time_zone:'Asia/Tokyo', step_minutes:30,
  });
  assert.equal(response.isError, undefined);
  const page = json(response);
  assert.equal(page.total, 3);
  assert.deepEqual(page.slots.map(s=>s.start), ['2026-10-26T00:00:00.000Z', '2026-10-26T02:30:00.000Z', '2026-10-26T03:00:00.000Z']);
  assert.equal(JSON.stringify(page).includes('Project sync'), false);
});

test('conflict detector returns cross-calendar overlaps', async () => {
  const response = await createDetectEventConflictsTool(client()).handler({
    calendar_ids:['1','2'], start:FROM, end:TO,
  });
  assert.equal(response.isError, undefined);
  const output = json(response);
  assert.equal(output.total, 1);
  assert.equal(output.conflicts[0].overlap_start, '2026-10-26T01:30:00.000Z');
  assert.equal(output.conflicts[0].overlap_end, '2026-10-26T02:00:00.000Z');
});

test('unexpandable recurring series fails closed rather than silently reporting free time', async () => {
  const api = client({ getEventsByCalendar: async () => [
    {...event('r','Secret',FROM,TO), recurrences: ['UNSUPPORTED:ALARM']},
  ]});
  const response = await createFindAvailableSlotsTool(api).handler({
    calendar_ids:[1], start:FROM, end:TO, duration_minutes:30, time_zone:'UTC',
  });
  assert.equal(response.isError, true);
  assert.equal(JSON.stringify(response).includes('Secret'), false);
});

test('recurring occurrences are expanded when calculating conflicts', async () => {
  const api = client({ getEventsByCalendar: async id => id === '1' ? [
    {...event('r','Recurring','2026-10-25T01:00:00Z','2026-10-25T02:00:00Z'),
      start_timezone:'UTC',recurrences:['RRULE:FREQ=DAILY;COUNT=3']},
  ] : [event('x','Overlap','2026-10-26T01:30:00Z','2026-10-26T02:00:00Z')] });
  const response = await createDetectEventConflictsTool(api).handler({
    calendar_ids:[1,2],start:FROM,end:TO,
  });
  assert.equal(response.isError, undefined);
  assert.equal(json(response).total,1);
});

test('invalid range and excess calendar selection do not access private events', async () => {
  for (const input of [
    { calendar_ids:[1], start:'2026-10-26T00:00:00', end:TO },
    { calendar_ids:[1,2,3,4,5,6], start:FROM,end:TO },
    { calendar_ids:[1], start:TO, end:FROM },
  ]) {
    const api=client();
    const response=await createSearchAcrossCalendarsTool(api).handler(input);
    assert.equal(response.isError,true);
    assert.deepEqual(api.calls,[]);
  }
});

test('upstream errors never leak private provider responses into tool results', async () => {
  const api=client({getEventsByCalendar:async()=>{throw Error('secret-cookie private-title');}});
  const response=await createSearchAcrossCalendarsTool(api).handler({
    calendar_ids:[1],start:FROM,end:TO,
  });
  assert.equal(response.isError,true);
  assert.equal(JSON.stringify(response).includes('secret-cookie'),false);
});

// ---------------------------------------------------------------------------
// Unreadable events are left out and counted, never silently dropped (synthetic data only)
// ---------------------------------------------------------------------------

const validator = new AjvJsonSchemaValidator();
const SECRET_TITLE = 'SECRET-TITLE-VALUE';

async function withStderr(fn) {
  const lines = [];
  const original = console.error;
  console.error = (...args) => lines.push(args.join(' '));
  try {
    const value = await fn();
    return { value, log: lines.join('\n') };
  } finally {
    console.error = original;
  }
}

/** A complete TimeTree event shape; `overrides` lets a test break one field. */
function fullEvent(uuid, title, start, end, overrides = {}) {
  return { id: uuid, uuid, calendar_id: 1, title, all_day: false, start_at: time(start), end_at: time(end),
    start_timezone: 'UTC', end_timezone: 'UTC', category: 1, label_id: 1, alerts: [], recurrences: [],
    attendees: [], attachment: null, created_at: 1, updated_at: 2, ...overrides };
}

/** The real client, fed by a fake HTTP layer that serves the given events per calendar. */
function syncClient(eventsByCalendar) {
  return new TimeTreeAPIClient({
    isAuthenticated: () => true,
    authenticate: async () => {},
    getHttpClient: () => ({
      get: async url => {
        const id = /\/calendar\/([^/?]+)\/events\/sync/.exec(url)[1];
        return { chunk: false, since: 0, events: eventsByCalendar[id] ?? [] };
      },
    }),
  });
}

const badEvent = fullEvent('bad', null, '2026-10-26T00:30:00Z', '2026-10-26T01:30:00Z');
const goodA = fullEvent('a', SECRET_TITLE, '2026-10-26T01:00:00Z', '2026-10-26T02:00:00Z');
const goodB = fullEvent('b', 'Team sync', '2026-10-26T01:30:00Z', '2026-10-26T02:30:00Z');

const PLANNER_CASES = [
  {
    name: 'search_events_across_calendars',
    make: client => createSearchAcrossCalendarsTool(client),
    args: { calendar_ids: ['1', '2'], start: FROM, end: TO, keyword: 'sync' },
    check: out => {
      assert.equal(out.total, 1);
      assert.deepEqual(out.events.map(e => e.uuid), ['b']);
    },
  },
  {
    name: 'find_available_slots',
    make: client => createFindAvailableSlotsTool(client),
    args: { calendar_ids: ['1', '2'], start: FROM, end: TO, duration_minutes: 60, time_zone: 'UTC', step_minutes: 30 },
    check: out => assert.ok(out.total > 0),
  },
  {
    name: 'detect_event_conflicts',
    make: client => createDetectEventConflictsTool(client),
    args: { calendar_ids: ['1', '2'], start: FROM, end: TO },
    check: out => {
      assert.equal(out.total, 1);
      assert.equal(out.conflicts[0].overlap_start, '2026-10-26T01:30:00.000Z');
    },
  },
];

for (const planner of PLANNER_CASES) {
  test(`${planner.name} keeps the readable events and reports skipped_items=1 when one event is unreadable`, async () => {
    const tool = planner.make(syncClient({ 1: [goodA, badEvent], 2: [goodB] }));
    const { value: response, log } = await withStderr(() => tool.handler(planner.args));
    assert.equal(response.isError, undefined);
    const result = toolResult(tool, response);
    assert.equal(result.structuredContent.skipped_items, 1);
    assert.match(result.structuredContent.skipped_items_note, /could not be read/);
    assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
    planner.check(result.structuredContent);
    assert.match(log, /events\.\d+\.title/);
    assert.doesNotMatch(log, /SECRET-TITLE-VALUE/);
    assert.equal(JSON.stringify(response).includes(SECRET_TITLE), false);
  });

  test(`${planner.name} adds no skipped fields when every event is readable`, async () => {
    const tool = planner.make(syncClient({ 1: [goodA], 2: [goodB] }));
    const result = toolResult(tool, await tool.handler(planner.args));
    assert.equal('skipped_items' in result.structuredContent, false);
    assert.equal('skipped_items_note' in result.structuredContent, false);
    assert.equal(validator.getValidator(tool.outputSchema)(result.structuredContent).valid, true);
  });
}

test('find_available_slots and detect_event_conflicts warn that free time and conflicts may be inaccurate', async () => {
  for (const planner of PLANNER_CASES.filter(p => p.name !== 'search_events_across_calendars')) {
    const tool = planner.make(syncClient({ 1: [goodA, badEvent], 2: [goodB] }));
    const result = toolResult(tool, await tool.handler(planner.args));
    assert.match(result.structuredContent.skipped_items_note, /may not be accurate/);
    assert.match(result.structuredContent.skipped_items_note, /正確でない可能性/);
  }
  const search = createSearchAcrossCalendarsTool(syncClient({ 1: [goodA, badEvent], 2: [goodB] }));
  const searchResult = toolResult(search, await search.handler(PLANNER_CASES[0].args));
  assert.doesNotMatch(searchResult.structuredContent.skipped_items_note, /may not be accurate/);
});
