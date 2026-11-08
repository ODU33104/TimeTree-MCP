import test from 'node:test';
import assert from 'node:assert/strict';
import { planBridgeExport } from '../.test-dist/bridge/plan.js';

const mapping = { sourceCalendarId: 'family', destinationCalendarId: 'google-family', privacy: 'full' };
const event = { id: 'a', calendarId: 'family', title: 'Dentist', startMs: 1000, endMs: 2000, description: 'Private note' };

test('exports only the selected TimeTree calendar', () => {
  const plan = planBridgeExport([event, { ...event, calendarId: 'work' }], [], mapping);
  assert.equal(plan.totals.create, 1);
  assert.equal(plan.actions[0].destinationCalendarId, 'google-family');
});

test('is idempotent using stable source identifiers', () => {
  const first = planBridgeExport([event], [], mapping);
  const created = first.actions[0];
  assert.equal(created.kind, 'create');
  const second = planBridgeExport([event], [{ id: 'google-1', ...created.event }], mapping);
  assert.deepEqual(second.totals, { create: 0, skip: 1, invalid: 0 });
});

test('does not silently duplicate a matching destination event', () => {
  const plan = planBridgeExport([event], [{ id: 'existing', title: 'Dentist', startMs: 1000, endMs: 2000 }], mapping);
  assert.equal(plan.actions[0].reason, 'possible-duplicate');
});

test('busy mode strips source title and description', () => {
  const plan = planBridgeExport([event], [], { ...mapping, privacy: 'busy' });
  assert.equal(plan.actions[0].event.title, 'Busy');
  assert.equal('description' in plan.actions[0].event, false);
});

test('invalid events are excluded without writes', () => {
  const plan = planBridgeExport([{ ...event, endMs: 999 }], [], mapping);
  assert.deepEqual(plan.totals, { create: 0, skip: 1, invalid: 1 });
});

test('duplicate source events are planned only once', () => {
  const plan = planBridgeExport([event, event], [], mapping);
  assert.deepEqual(plan.totals, { create: 1, skip: 1, invalid: 0 });
});
