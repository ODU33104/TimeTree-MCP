import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBriefing } from '../.test-dist/features/briefing/index.js';

const now = Date.UTC(2026, 9, 26);
const events = [
  { id: 'one', calendarId: 'a', title: 'Private meeting', start: now + 3600000, end: now + 7200000, preparationMinutes: 15 },
  { id: 'two', calendarId: 'b', title: 'Private appointment', start: now + 5400000, end: now + 9000000 },
];
test('defaults to private titles and includes source IDs', () => {
  const brief = buildBriefing(events, { now, timezone: 'Asia/Tokyo' });
  assert.equal(brief.items.filter((i) => i.kind === 'conflict').length, 1);
  assert.ok(!JSON.stringify(brief).includes('Private meeting'));
  assert.deepEqual(brief.items.find((i) => i.kind === 'conflict').eventIds, ['one', 'two']);
});
test('preparation and titles require explicit opt in', () => {
  const brief = buildBriefing(events, { now, timezone: 'Asia/Tokyo', includeTitles: true, includePreparation: true });
  assert.ok(brief.items.some((i) => i.kind === 'prepare'));
  assert.ok(brief.items.some((i) => i.message === 'Private meeting'));
});
test('half-open intervals exclude expired events', () => {
  assert.equal(buildBriefing([{ ...events[0], start: now - 200, end: now }], { now, timezone: 'UTC' }).items.length, 0);
});
test('rejects invalid timezone and intervals', () => {
  assert.throws(() => buildBriefing(events, { now, timezone: 'Invalid/Zone' }));
  assert.throws(() => buildBriefing([{ ...events[0], end: events[0].start }], { now, timezone: 'UTC' }));
});
