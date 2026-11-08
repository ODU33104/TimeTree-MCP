import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCalendarIcs } from '../.test-dist/bridge/ics.js';

const options = { calendarId: 'family', calendarName: 'Family, Japan', generatedAtMs: Date.UTC(2026, 0, 1) };
const event = { id: 'e1', calendarId: 'family', title: 'Meeting, A; B', startMs: Date.UTC(2026, 0, 2, 9), endMs: Date.UTC(2026, 0, 2, 10), description: 'Line 1\nLine 2' };

test('exports selected calendar as CRLF RFC 5545 text', () => {
  const text = exportCalendarIcs([event, { ...event, calendarId: 'work' }], options);
  assert.match(text, /^BEGIN:VCALENDAR\r\nVERSION:2.0\r\n/);
  assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert.match(text, /SUMMARY:Meeting\\, A\\; B/);
  assert.match(text, /DESCRIPTION:Line 1\\nLine 2/);
  assert.match(text, /DTSTART:20260102T090000Z/);
  assert.match(text, /\r\nEND:VCALENDAR\r\n$/);
});

test('all-day end date is exclusive', () => {
  const text = exportCalendarIcs([{ ...event, allDay: true, startMs: Date.UTC(2026, 0, 2), endMs: Date.UTC(2026, 0, 3) }], options);
  assert.match(text, /DTSTART;VALUE=DATE:20260102/);
  assert.match(text, /DTEND;VALUE=DATE:20260103/);
});

test('busy export does not leak title or description', () => {
  const text = exportCalendarIcs([event], { ...options, privacy: 'busy' });
  assert.match(text, /SUMMARY:Busy/);
  assert.doesNotMatch(text, /Meeting|Line 1/);
});

test('rejects duplicate identifiers and invalid dates', () => {
  assert.throws(() => exportCalendarIcs([event, event], options), /Duplicate/);
  assert.throws(() => exportCalendarIcs([{ ...event, endMs: event.startMs }], options), /Invalid/);
});

test('folds long UTF-8 lines to 75 octets or less', () => {
  const text = exportCalendarIcs([{ ...event, title: '予定'.repeat(70) }], options);
  for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
});
