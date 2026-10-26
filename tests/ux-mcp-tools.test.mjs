import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchAcrossCalendarsTool, createFindAvailableSlotsTool,
  createDetectEventConflictsTool } from '../.test-dist/tools/ux-read-tools.js';
import { isToolAllowed } from '../.test-dist/utils/tool-access.js';

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
  assert.equal(page.total, 2);
  assert.deepEqual(page.slots.map(s=>s.start), ['2026-10-26T00:00:00.000Z', '2026-10-26T03:00:00.000Z']);
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
