import test from 'node:test';
import assert from 'node:assert/strict';
import { exportICalendar } from '../.test-dist/features/ical-export/index.js';

const opts = { calendarIds:['family'], calendarName:'Family calendar', timeZone:'Asia/Tokyo',
  generatedAt:'2026-10-26T09:00:00+09:00', snapshotComplete:false };
const events=[{calendarId:'family',uid:'opaque_001',title:'Family meeting',
  start:'2026-10-26T11:00:00+09:00', end:'2026-10-26T12:00:00+09:00',
  description:'bring passport',location:'private address'}];

test('produces valid CRLF VCALENDAR, UTC stamps and private summary by default',()=>{
  const before=JSON.stringify(events);
  const data=exportICalendar(events,opts);
  assert.match(data,/^BEGIN:VCALENDAR\r\nVERSION:2.0\r\n/);
  assert.match(data,/DTSTART:20261026T020000Z\r\nDTEND:20261026T030000Z/);
  assert.match(data,/DTSTAMP:20261026T000000Z/);
  assert.match(data,/UID:opaque_001@community-calendar.invalid/);
  assert.match(data,/CLASS:PRIVATE\r\nTRANSP:OPAQUE\r\nSUMMARY:Busy/);
  assert.match(data,/X-CALENDAR-MCP-SNAPSHOT:PARTIAL/);
  assert.doesNotMatch(data,/Family meeting|bring passport|private address/);
  assert.equal(JSON.stringify(events),before);
  assert.ok(data.endsWith('END:VCALENDAR\r\n'));
  assert.ok(!/(^|[^\r])\n/.test(data));
});
test('explicit opt-in emits escaped title, description, and location without line injection',()=>{
  const data=exportICalendar([{...events[0],title:'Call; talk, then\\more\r\nBEGIN:BAD',
    description:'one\ntwo', location:'Here, there'}],
    {...opts,includeTitles:true,includeDescriptions:true,includeLocations:true});
  assert.match(data,/SUMMARY:Call\\; talk\\, then\\\\more\\nBEGIN:BAD/);
  assert.match(data,/DESCRIPTION:one\\ntwo/);
  assert.match(data,/LOCATION:Here\\, there/);
  assert.equal((data.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);
});
test('all-day end is exclusive and leap date is valid',()=>{
  const data=exportICalendar([{calendarId:'family',uid:'day-01',title:'Holiday',allDay:true,
    startDate:'2028-02-29',endDateExclusive:'2028-03-02'}],opts);
  assert.match(data,/DTSTART;VALUE=DATE:20280229\r\nDTEND;VALUE=DATE:20280302/);
});
test('UTF-8 folded lines never exceed 75 octets and preserve all characters',()=>{
  const japanese='旅行の準備を確認する'.repeat(40);
  const data=exportICalendar([{...events[0],title:japanese}],{...opts,includeTitles:true});
  assert.ok(data.split('\r\n').every(line=>Buffer.byteLength(line,'utf8')<=75));
  const originalFoldedLines=data.split('\r\n');
  const unfolded=originalFoldedLines.filter(Boolean).join('\n').replace(/\n /g,'');
  assert.ok(unfolded.includes('SUMMARY:'+japanese));
});
test('fails on out-of-scope calendar, duplicates, invalid UID and unsafe recurrence',()=>{
  assert.throws(()=>exportICalendar([{...events[0],calendarId:'secret'}],opts),/outside/);
  assert.throws(()=>exportICalendar([...events,...events],opts),/unique/);
  assert.throws(()=>exportICalendar([{...events[0],uid:'alice@example.com'}],opts),/UID/);
  assert.throws(()=>exportICalendar([{...events[0],recurrences:['RRULE:FREQ=DAILY']}],opts),/Expand/);
  assert.throws(()=>exportICalendar(events,{...opts,calendarIds:[]}),/scope/);
});
test('rejects naive, invalid or reversed times, impossible dates and invalid IANA timezone',()=>{
  assert.throws(()=>exportICalendar([{...events[0],start:'2026-10-26T11:00:00'}],opts),/explicit UTC offset/);
  assert.throws(()=>exportICalendar([{...events[0],start:'2026-02-30T11:00:00Z'}],opts),/calendar date/);
  assert.throws(()=>exportICalendar([{...events[0],end:'2026-10-26T10:00:00+09:00'}],opts),/interval/);
  assert.throws(()=>exportICalendar([{calendarId:'family',uid:'day-01',title:'bad',allDay:true,startDate:'2026-02-29',endDateExclusive:'2026-03-02'}],opts),/calendar date/);
  assert.throws(()=>exportICalendar(events,{...opts,timeZone:'Moon/Tycho'}),/IANA/);
  assert.throws(()=>exportICalendar(events,{...opts,generatedAt:'2026-10-26'}),/explicit UTC offset/);
});
test('does not execute provider operations and supports explicit empty/small subsets',()=>{
  const empty=exportICalendar([],{...opts,snapshotComplete:true});
  assert.match(empty,/X-CALENDAR-MCP-SNAPSHOT:COMPLETE-ASSERTED/);
  assert.doesNotMatch(empty,/BEGIN:VEVENT/);
});
