import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateEventMove } from '../.test-dist/features/what-if-move/index.js';

const events = [
  { id:'move', calendarId:'family', start:'2026-10-26T09:00:00Z', end:'2026-10-26T10:00:00Z' },
  { id:'school', calendarId:'family', title:'Sensitive private location', start:'2026-10-26T09:30:00Z', end:'2026-10-26T10:30:00Z' },
  { id:'call', calendarId:'work', start:'2026-10-26T12:00:00Z', end:'2026-10-26T13:00:00Z' },
];
const options = {
  eventId:'move', calendarId:'family', calendarIds:['family','work'], snapshotComplete:true,
  timeZone:'Asia/Tokyo',
  candidates: [
    {start:'2026-10-26T10:30:00Z',end:'2026-10-26T11:30:00Z'},
    {start:'2026-10-26T12:30:00Z',end:'2026-10-26T13:30:00Z'},
  ],
};
test('reads multiple calendars, resolves conflicts and ranks a collision-free move', () => {
  const before = JSON.stringify(events);
  const out = simulateEventMove(events, options);
  assert.equal(out.executed, false);
  assert.equal(out.recommendedIndex, 0);
  assert.deepEqual(out.comparisons[0].resolvedConflicts, [{eventId:'school',calendarId:'family'}]);
  assert.deepEqual(out.comparisons[1].newConflicts, [{eventId:'call',calendarId:'work'}]);
  assert.equal(out.comparisons[1].safeWithinSnapshot, false);
  assert.equal(JSON.stringify(events), before, 'input cannot be mutated');
  assert.doesNotMatch(JSON.stringify(out), /Sensitive private location/);
});
test('adjacent intervals do not conflict and IDs are scoped by calendar', () => {
  const out = simulateEventMove(events, {...options,candidates:[{start:'2026-10-26T11:00:00Z',end:'2026-10-26T12:00:00Z'}]});
  assert.equal(out.comparisons[0].safeWithinSnapshot, true);
});
test('fails closed without a complete snapshot or explicit scope', () => {
  assert.throws(()=>simulateEventMove(events, {...options,snapshotComplete:false}), /Complete snapshot/);
  assert.throws(()=>simulateEventMove(events, {...options,calendarIds:['family']}), /out-of-scope/);
  assert.throws(()=>simulateEventMove(events, {...options,calendarIds:['work']}), /scope/);
});
test('rejects ambiguous/recurring/all-day target and unexpanded recurring events', () => {
  assert.throws(()=>simulateEventMove([...events,events[0]], options), /duplicate/);
  assert.throws(()=>simulateEventMove([{...events[0],allDay:true},...events.slice(1)], options), /All-day/);
  assert.throws(()=>simulateEventMove([{...events[0],recurrence:'expanded-occurrence'},...events.slice(1)], options), /Recurring occurrence/);
  assert.throws(()=>simulateEventMove([...events,{id:'rrule',calendarId:'family',start:'2026-10-26T14:00:00Z',end:'2026-10-26T15:00:00Z',recurrence:'unexpanded-series'}], options), /Expand recurrence/);
});
test('rejects invalid proposals, duration changes, naive times and oversized input', () => {
  assert.throws(()=>simulateEventMove(events,{...options,timeZone:'Moon/Base'}), /IANA timezone/);
  assert.throws(()=>simulateEventMove(events,{...options,candidates:[{start:'2026-10-26T10:30:00',end:'2026-10-26T11:30:00Z'}]}), /explicit timezone/);
  assert.throws(()=>simulateEventMove(events,{...options,candidates:[{start:'2026-10-26T10:30:00Z',end:'2026-10-26T13:30:00Z'}]}), /duration/);
  assert.throws(()=>simulateEventMove(events,{...options,candidates:[]}), /1-20/);
  assert.throws(()=>simulateEventMove(events,{...options,candidates:[{start:'2026-02-30T10:30:00Z',end:'2026-02-30T11:30:00Z'}]}), /Invalid timestamp/);
});
test('preserves absolute duration across a DST offset transition', () => {
  const input=[{id:'move',calendarId:'family',start:'2026-11-01T00:30:00-04:00',end:'2026-11-01T01:30:00-04:00'}];
  const result=simulateEventMove(input,{eventId:'move',calendarId:'family',calendarIds:['family'],snapshotComplete:true,timeZone:'America/New_York',candidates:[{start:'2026-11-01T01:30:00-05:00',end:'2026-11-01T02:30:00-05:00'}]});
  assert.equal(result.comparisons[0].safeWithinSnapshot,true);
  assert.equal(result.recommendedIndex,0);
});
test('does not claim a safe move when all candidates conflict', () => {
  const out=simulateEventMove(events,{...options,candidates:[options.candidates[1]]});
  assert.equal(out.recommendedIndex,null);
});
