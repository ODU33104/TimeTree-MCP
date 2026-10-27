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

test('fails closed for undefined options, null roster and invalid roster collections', () => {
  assert.throws(() => summarize(event, roster, undefined), /Calendar access denied/);
  assert.ok(summarize(event, null, options).participants.every(p => p.status === 'unknown'));
  for (const members of [null, {}, [null], [42], [{ user_id: null }], [{ user_id: 1, name: 123 }], Array(1001).fill({ user_id: 1 })]) {
    assert.throws(() => summarize(event, { ...roster, members }, options), /Invalid roster/);
  }
  for (const virtual_members of [null, 'wrong', [null], [{ id: '' }], [{ id: 'child', is_active: 'yes' }]]) {
    assert.throws(() => summarize(event, { ...roster, virtual_members }, options), /Invalid roster/);
  }
});
test('anonymizes by default; named disclosure requires explicit opt-in', () => {
  const privateResult = summarize(event, roster, options);
  assert.ok(privateResult.participants.every(p => p.label === 'Anonymous'));
  const named = summarize(event, roster, { ...options, anonymize: false });
  assert.equal(named.participants[0].label, 'Alice');
  assert.equal(named.participants[1].label, 'Anonymous');
});
test('rejects total roster over limit and invalid event snapshots', () => {
  assert.throws(() => summarize(event, { ...roster, members: Array(1000).fill({ user_id: 1 }), virtual_members: [{ id: 'child' }] }, options), /Too many roster members/);
  assert.throws(() => summarize(null, roster, options), /Invalid event/);
});
