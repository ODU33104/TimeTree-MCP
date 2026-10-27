import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEventAttendance as summarize } from '../.test-dist/features/attendance-summary/index.js';
const event = { uuid: 'synthetic-event', calendar_id: 1, attendees: [1, 2, 1], virtual_user_attendees: ['child', 'missing'] };
const roster = { calendar_id: 1, members: [{ user_id: 1, name: 'Alice', is_active: true }, { user_id: 2, name: 'Former', is_active: false }], virtual_members: [{ id: 'child', name: 'Child', is_active: true }] };
const options = { allowedCalendarIds: [1] };
test('separates account and virtual associations, deduplicates, marks removed and unknown', () => {
  const result = summarize(event, roster, options);
  assert.equal(result.account_count, 2);
  assert.equal(result.virtual_count, 2);
  assert.deepEqual(result.participants.map(p => p.status), ['known','unknown','known','unknown']);
  assert.equal(result.semantics, 'association_only');
  assert.equal(JSON.stringify(result).includes('Former'), false);
});
test('denies inaccessible calendars and cross-calendar roster', () => {
  assert.throws(() => summarize(event, roster, { allowedCalendarIds: [2] }), /denied/);
  assert.throws(() => summarize(event, { ...roster, calendar_id: 2 }, options), /mismatch/);
});
test('anonymizes names and does not leak unknown identifiers', () => {
  const result = summarize(event, roster, { ...options, anonymize: true });
  assert.ok(result.participants.every(p => p.label === 'Anonymous'));
  assert.ok(!JSON.stringify(result).includes('missing'));
});
test('rejects malformed, oversized and unbounded participant data', () => {
  assert.throws(() => summarize({ ...event, attendees: [''] }, roster, options), /Invalid participant ID/);
  assert.throws(() => summarize({ ...event, attendees: {} }, roster, options), /Invalid participant list/);
  assert.throws(() => summarize({ ...event, attendees: Array(1001).fill(1) }, roster, options), /Invalid participant list/);
  assert.throws(() => summarize(event, roster, { ...options, maxParticipants: 3 }), /Too many participants/);
});
test('missing roster does not infer identities or RSVP', () => {
  const result = summarize(event, undefined, options);
  assert.ok(result.participants.every(p => p.status === 'unknown'));
  assert.equal('rsvp' in result, false);
});
