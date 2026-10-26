import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTravelBuffers } from '../dist/features/travel-buffer/index.js';

const event = (id, start, end, allDay = false) => ({ id, start, end, allDay });
test('warns when user-supplied travel and preparation exceed gap', () => {
  const events = [event('a', '2026-10-26T10:00:00+09:00', '2026-10-26T11:00:00+09:00'), event('b', '2026-10-26T11:15:00+09:00', '2026-10-26T12:00:00+09:00')];
  assert.deepEqual(evaluateTravelBuffers(events, [{ fromEventId: 'a', toEventId: 'b', travelMinutes: 30, preparationMinutes: 5 }]), [{ fromEventId: 'a', toEventId: 'b', availableMinutes: 15, requiredMinutes: 35, shortfallMinutes: 20, kind: 'insufficient-buffer' }]);
});
test('DST offset transitions use absolute instants', () => {
  const events = [event('a', '2026-11-01T01:00:00-04:00', '2026-11-01T01:30:00-04:00'), event('b', '2026-11-01T01:15:00-05:00', '2026-11-01T02:00:00-05:00')];
  assert.equal(evaluateTravelBuffers(events, [{ fromEventId: 'a', toEventId: 'b', travelMinutes: 30 }]).length, 0);
});
test('all-day events skipped and naive timestamps rejected', () => {
  const events = [event('a', '2026-10-26T00:00:00+09:00', '2026-10-27T00:00:00+09:00', true), event('b', '2026-10-26T10:00:00+09:00', '2026-10-26T11:00:00+09:00')];
  assert.deepEqual(evaluateTravelBuffers(events, [{ fromEventId: 'a', toEventId: 'b', travelMinutes: 60 }]), []);
  assert.throws(() => evaluateTravelBuffers([event('bad', '2026-10-26T10:00:00', '2026-10-26T11:00:00+09:00')], []));
});
test('rejects invalid durations and detects overlap', () => {
  const events = [event('a', '2026-10-26T10:00:00Z', '2026-10-26T11:00:00Z'), event('b', '2026-10-26T10:45:00Z', '2026-10-26T12:00:00Z')];
  assert.equal(evaluateTravelBuffers(events, [{ fromEventId: 'a', toEventId: 'b', travelMinutes: 0 }])[0].kind, 'overlap');
  assert.throws(() => evaluateTravelBuffers(events, [{ fromEventId: 'a', toEventId: 'b', travelMinutes: -1 }]));
});
