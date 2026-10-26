import test from 'node:test';
import assert from 'node:assert/strict';
import { createInsightTools } from '../.test-dist/tools/ux-insight-tools.js';

const tools = createInsightTools();
const get = (name) => tools.find((tool) => tool.name === name);
const now = Date.UTC(2026, 9, 26);
test('all insight tools advertise read-only behavior', () => {
  assert.equal(tools.length, 3);
  assert.ok(tools.every((tool) => tool.annotations.readOnlyHint === true));
});
test('briefing rejects events outside explicitly selected calendars', async () => {
  const result = await get('preview_schedule_briefing').handler({
    calendarIds: ['allowed'], events: [{ id: 'e', calendarId: 'other', title: 'Secret', start: now, end: now + 60000 }],
    now, timezone: 'UTC',
  });
  assert.equal(result.isError, true);
  assert.ok(!JSON.stringify(result).includes('Secret'));
});
test('briefing defaults to hiding event titles', async () => {
  const result = await get('preview_schedule_briefing').handler({
    calendarIds: ['allowed'], events: [{ id: 'e', calendarId: 'allowed', title: 'Secret', start: now + 60000, end: now + 120000 }],
    now, timezone: 'UTC',
  });
  assert.ok(!result.isError);
  assert.ok(!JSON.stringify(result).includes('Secret'));
});
test('share requires explicit consent and omits calendar identifiers', async () => {
  const tool = get('preview_busy_only_share');
  const base = { calendarIds: ['a'], now: '2026-10-26T00:00:00Z', expiresAt: '2026-10-27T00:00:00Z', windowStart: '2026-10-26T00:00:00Z', windowEnd: '2026-10-27T00:00:00Z', busy: [{ calendarId: 'a', start: '2026-10-26T01:00:00Z', end: '2026-10-26T02:00:00Z' }] };
  assert.equal((await tool.handler({ ...base, consent: false })).isError, true);
  const result = await tool.handler({ ...base, consent: true });
  assert.ok(!result.isError);
  assert.ok(!JSON.stringify(result).includes('calendarId'));
});
test('travel requirements cannot use an unknown event', async () => {
  const result = await get('preview_travel_buffers').handler({
    calendarIds: ['a'], events: [{ id: 'e', calendarId: 'a', start: '2026-10-26T00:00:00Z', end: '2026-10-26T01:00:00Z' }],
    requirements: [{ fromEventId: 'e', toEventId: 'missing', travelMinutes: 10 }],
  });
  assert.equal(result.isError, true);
});
