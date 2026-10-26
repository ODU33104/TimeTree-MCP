import test from 'node:test';
import assert from 'node:assert/strict';
import { findAvailableSlots } from '../.test-dist/features/availability/index.js';
const base = { start:'2026-10-26T09:00:00Z', end:'2026-10-26T11:00:00Z', durationMinutes:30, calendarIds:['a','b'], timeZone:'UTC', stepMinutes:30 };
test('excludes conflicts from every selected calendar', () => {
 const result = findAvailableSlots([{calendarId:'b',start:'2026-10-26T09:30:00Z',end:'2026-10-26T10:30:00Z'}],base);
 assert.deepEqual(result.map(s=>s.start),['2026-10-26T09:00:00.000Z','2026-10-26T10:30:00.000Z']);
});
test('ignores calendars not selected',()=>assert.equal(findAvailableSlots([{calendarId:'other',start:base.start,end:base.end}],base).length,4));
test('enforces local working hours',()=>assert.deepEqual(findAvailableSlots([], {...base,workingHours:{start:'10:00',end:'11:00'}}).map(s=>s.start),['2026-10-26T10:00:00.000Z','2026-10-26T10:30:00.000Z']));
test('rejects naive dates and invalid ranges',()=>{assert.throws(()=>findAvailableSlots([], {...base,start:'2026-10-26T09:00:00'}));assert.throws(()=>findAvailableSlots([], {...base,durationMinutes:0}));});
