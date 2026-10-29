import test from 'node:test';
import assert from 'node:assert/strict';
import { searchEvents } from '../.test-dist/features/search/index.js';
const events = [
  { uuid:'b', calendar_id:2, title:'Planning', start_at:'2026-10-26T09:00:00+09:00', end_at:'2026-10-26T10:00:00+09:00' },
  { uuid:'a', calendar_id:1, title:'Planning', start_at:'2026-10-26T00:00:00Z', end_at:'2026-10-26T01:00:00Z' },
  { uuid:'c', calendar_id:1, title:'Other', start_at:'2026-10-27T00:00:00Z', end_at:'2026-10-27T01:00:00Z' },
];
const bounds = { start:'2026-10-26T00:00:00Z', end:'2026-10-27T00:00:00Z' };
test('search orders overlapping timezone-equivalent events deterministically', () => {
  const page = searchEvents(events, { ...bounds, keyword:'planning', limit:1 });
  assert.deepEqual(page.events.map(x=>x.uuid), ['a']);
  assert.equal(page.total, 2);
  assert.equal(page.nextOffset, 1);
  assert.deepEqual(searchEvents(events, { ...bounds, offset:1 }).events.map(x=>x.uuid), ['b']);
});
test('search filters calendars and rejects ambiguous ranges', () => {
  assert.deepEqual(searchEvents(events, { ...bounds, calendarIds:['2'] }).events.map(x=>x.uuid), ['b']);
  assert.throws(()=>searchEvents(events, { start:'2026-10-26T00:00:00', end:bounds.end }));
  assert.throws(()=>searchEvents(events, { ...bounds, limit:201 }));
  assert.throws(()=>searchEvents(events, { ...bounds, offset:-1 }));
});
