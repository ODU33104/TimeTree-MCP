import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkPossibleDuplicates as check } from '../.test-dist/features/duplicate-guard/index.js';

const draft = { title: '会議', start: '2026-10-27T09:00:00+09:00', end: '2026-10-27T10:00:00+09:00', allDay: false };
const options = { calendarIds: ['work'], snapshotComplete: true, timeZone: 'Asia/Tokyo' };
const event = (overrides = {}) => ({ ...draft, calendarId: 'work', eventId: 'event-1', ...overrides });
const run = (events, d = draft, opts = options) => check(d, events, opts);
test('Japanese NFKC and punctuation normalization; English case and spacing', () => {
  assert.equal(run([event({ title: '会 議！' })]).totalMatches, 1);
  const en = { ...draft, title: 'Project Review' };
  assert.equal(run([event({ title: 'ＰＲＯＪＥＣＴ-review' })], en).totalMatches, 1);
});
test('non-equivalent translations do not silently match (known false negative)', () => {
  assert.equal(run([event({ title: 'meeting' })]).totalMatches, 0);
});
test('false positive from aggressive punctuation stripping is review-only', () => {
  const d = { ...draft, title: 'A-B' };
  assert.equal(run([event({ title: 'AB' })], d).status, 'review-needed');
  assert.equal(run([event({ title: 'AB' })], d).executed, false);
});
test('same instant with different offsets matches; naive/invalid dates rejected', () => {
  assert.equal(run([event({ start: '2026-10-27T00:00:00Z', end: '2026-10-27T01:00:00Z' })]).totalMatches, 1);
  assert.throws(() => run([event({ start: '2026-10-27T09:00:00' })]));
  assert.throws(() => run([event({ start: '2026-02-30T09:00:00+09:00' })]));
});
test('DST offsets distinguish repeated local wall times', () => {
  const d = { ...draft, start: '2026-11-01T01:30:00-04:00', end: '2026-11-01T02:00:00-04:00' };
  assert.equal(run([event({ ...d, start: '2026-11-01T01:30:00-05:00', end: '2026-11-01T02:00:00-05:00' })], d, { ...options, timeZone: 'America/New_York' }).totalMatches, 0);
});
test('all-day flag mismatch rejected; equivalent all-day UTC instants match', () => {
  const d = { ...draft, allDay: true, start: '2026-10-27T00:00:00+09:00', end: '2026-10-28T00:00:00+09:00' };
  assert.equal(run([event({ ...d, allDay: false })], d).totalMatches, 0);
  assert.equal(run([event({ ...d, start: '2026-10-26T15:00:00Z', end: '2026-10-27T15:00:00Z' })], d).totalMatches, 1);
});
test('recurrence requires expanded occurrences and unique event IDs', () => {
  assert.throws(() => run([event({ recurrence: 'unexpanded-series' })]));
  assert.equal(run([event({ recurrence: 'expanded-occurrence' })]).totalMatches, 1);
  assert.throws(() => run([event(), event()]));
});
test('calendar scope enforced, multiple authorized calendars permitted', () => {
  assert.throws(() => run([event({ calendarId: 'private' })]));
  assert.equal(run([event({ calendarId: 'work' }), event({ calendarId: 'family', eventId: '2' })], draft, { ...options, calendarIds: ['work', 'family'] }).totalMatches, 2);
  assert.throws(() => run([event()], draft, { ...options, snapshotComplete: false }));
});
test('limits on input, scope, tolerance and result count', () => {
  assert.throws(() => run(Array.from({ length: 2001 }, (_, i) => event({ eventId: String(i) }))));
  assert.throws(() => run([], draft, { ...options, calendarIds: Array.from({ length: 11 }, (_, i) => String(i)) }));
  assert.throws(() => run([], draft, { ...options, maxResults: 101 }));
  const results = run(Array.from({ length: 5 }, (_, i) => event({ eventId: String(i) })), draft, { ...options, maxResults: 2 });
  assert.equal(results.totalMatches, 5);
  assert.equal(results.matches.length, 2);
  assert.equal(results.truncated, true);
});
test('private event metadata and tokens are absent from result', () => {
  const secret = 'SECRET_TOKEN_NEVER_OUTPUT';
  const result = run([event({ title: '会議', description: secret, attendees: [secret], location: secret })]);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.equal(JSON.stringify(result).includes('会議'), false);
  assert.deepEqual(Object.keys(result.matches[0]).sort(), ['calendarId', 'eventId', 'match', 'startDifferenceMinutes'].sort());
});

test('invalid Gregorian dates and leap-year boundaries are rejected', () => {
  for (const start of ['2026-02-30T09:00:00+09:00','2025-02-29T09:00:00+09:00','2026-04-31T09:00:00+09:00']) {
    assert.throws(() => run([event({ start })]), /Invalid timestamp/);
  }
  assert.equal(run([event({ start:'2028-02-29T09:00:00+09:00', end:'2028-02-29T10:00:00+09:00' })],
    {...draft,start:'2028-02-29T09:00:00+09:00',end:'2028-02-29T10:00:00+09:00'}).totalMatches,1);
});
test('DST nonexistent and repeated New York wall-clock timestamps are not IANA validated (known limitation)', () => {
  const opts={...options,timeZone:'America/New_York'};
  const nonexistent={...draft,start:'2026-03-08T02:30:00-05:00',end:'2026-03-08T03:00:00-05:00'};
  // Offset-based parser accepts this nonexistent wall time: integration must not treat it as IANA-valid.
  assert.equal(run([event({...nonexistent})],nonexistent,opts).totalMatches,1);
  const repeated={...draft,start:'2026-11-01T01:30:00-04:00',end:'2026-11-01T01:45:00-04:00'};
  assert.equal(run([event({...repeated,start:'2026-11-01T01:30:00-05:00',end:'2026-11-01T01:45:00-05:00'})],repeated,opts).totalMatches,0);
});
