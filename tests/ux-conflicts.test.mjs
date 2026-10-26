import test from 'node:test';
import assert from 'node:assert/strict';
import { findConflicts, suggestAlternatives } from '../.test-dist/features/conflicts/index.js';

const event = (id, calendarId, start, end, allDay = false) => ({ id, calendarId, start, end, allDay });

test('overlaps across calendars but not adjacent intervals', () => {
  const conflicts = findConflicts([
    event('a', 'one', 0, 100),
    event('b', 'two', 50, 150),
    event('c', 'one', 150, 200),
  ]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].overlapStart, 50);
  assert.equal(conflicts[0].overlapEnd, 100);
});
test('all-day events block overlapping timed events', () => {
  assert.equal(findConflicts([event('day', 'a', 0, 86400000, true), event('hour', 'b', 3600000, 7200000)]).length, 1);
});
test('alternative slots merge busy intervals and respect duration', () => {
  assert.deepEqual(suggestAlternatives([
    event('a', 'one', 10, 30),
    event('b', 'two', 20, 40),
  ], 0, 70, 10), [{ start: 0, end: 10 }, { start: 40, end: 50 }, { start: 50, end: 60 }, { start: 60, end: 70 }]);
});
test('invalid and zero-length intervals fail closed', () => {
  assert.throws(() => findConflicts([event('bad', 'x', 20, 20)]));
  assert.throws(() => suggestAlternatives([], 0, 100, 0));
});
