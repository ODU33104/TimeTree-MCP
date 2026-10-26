/** Privacy-first, read-only iCalendar export from an already-authorized normalized snapshot. */
export interface BaseExportEvent {
  calendarId: string;
  /** Caller-supplied opaque, stable identifier; do not use names or provider credentials. */
  uid: string;
  title: string;
  description?: string;
  location?: string;
}
export interface TimedExportEvent extends BaseExportEvent {
  allDay?: false;
  start: string;
  end: string;
}
export interface AllDayExportEvent extends BaseExportEvent {
  allDay: true;
  startDate: string;
  /** Exclusive calendar date, per iCalendar RFC 5545. */
  endDateExclusive: string;
}
export type ExportEvent = TimedExportEvent | AllDayExportEvent;
export interface ICalendarExportOptions {
  calendarIds: string[];
  calendarName: string;
  timeZone: string;
  /** A fixed instant from the caller. No implicit local clocks or provider requests. */
  generatedAt: string;
  /** True only if the caller verified the input is complete within its explicitly selected scope. */
  snapshotComplete: boolean;
  includeTitles?: boolean;
  includeDescriptions?: boolean;
  includeLocations?: boolean;
}

const MAX_EVENTS = 500;
const MAX_SCOPE = 10;
const DAY_MS = 86_400_000;
const MAX_DURATION = 366 * DAY_MS;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/i;
const encoder = new TextEncoder();

function validateDateParts(year: number, month: number, day: number): void {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1]!) {
    throw new Error('Invalid calendar date');
  }
}
function parseDate(value: string): number {
  const m = typeof value === 'string' ? DATE.exec(value) : null;
  if (!m) throw new Error('Expected YYYY-MM-DD');
  const [year, month, day] = m.slice(1).map(Number);
  validateDateParts(year!, month!, day!);
  const timestamp = Date.UTC(year!, month! - 1, day!);
  if (year! < 100) { const date = new Date(timestamp); date.setUTCFullYear(year!); return date.getTime(); }
  return timestamp;
}
function parseInstant(value: string): number {
  const m = typeof value === 'string' ? INSTANT.exec(value) : null;
  if (!m) throw new Error('Timestamp requires seconds and explicit UTC offset');
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number);
  validateDateParts(year!, month!, day!);
  const offsetHour = Number(m[9] ?? 0), offsetMinute = Number(m[10] ?? 0);
  if (hour! > 23 || minute! > 59 || second! > 59 || offsetHour > 14 || offsetMinute > 59 ||
      (offsetHour === 14 && offsetMinute !== 0)) {
    throw new Error('Invalid timestamp');
  }
  const instant = Date.parse(value);
  if (!Number.isSafeInteger(instant)) throw new Error('Invalid timestamp');
  return instant;
}
function utcStamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
}
function yyyymmdd(value: string): string { return value.replace(/-/g, ''); }
function stringValue(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    throw new Error('Invalid ' + label);
  }
  return value;
}
function escapeText(value: string): string {
  return value.replace(/\r\n|\r|\n/g, '\n')
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
/** Fold RFC5545 content lines by UTF-8 octets (not JS code units), including the continuation space. */
function foldLine(line: string): string[] {
  const lines: string[] = [];
  let current = '';
  let width = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (width + size > 75) {
      lines.push(current);
      current = ' ' + ch;
      width = size + 1;
    } else {
      current += ch;
      width += size;
    }
  }
  lines.push(current);
  return lines;
}

/** Never reads TimeTree or writes calendars. Caller must enforce authorization and data freshness. */
export function exportICalendar(events: readonly ExportEvent[], options: ICalendarExportOptions): string {
  if (!options || !Array.isArray(events) || events.length > MAX_EVENTS ||
      !Array.isArray(options.calendarIds) || options.calendarIds.length < 1 ||
      options.calendarIds.length > MAX_SCOPE ||
      options.calendarIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 128) ||
      new Set(options.calendarIds).size !== options.calendarIds.length) {
    throw new Error('Invalid selected calendar scope');
  }
  if (typeof options.snapshotComplete !== 'boolean') throw new Error('Snapshot completeness must be explicit');
  const calendarName = stringValue(options.calendarName, 'calendar name', 160);
  if (!calendarName.trim()) throw new Error('Calendar name required');
  const timeZone = stringValue(options.timeZone, 'timezone', 100);
  try { new Intl.DateTimeFormat('en', { timeZone }); }
  catch { throw new Error('Invalid IANA timezone'); }
  const dtstamp = utcStamp(parseInstant(options.generatedAt));
  const scope = new Set(options.calendarIds);
  const uniqueUids = new Set<string>();
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Community Calendar MCP//iCalendar Export//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + escapeText(calendarName),
    'X-WR-TIMEZONE:' + timeZone,
    'X-CALENDAR-MCP-SNAPSHOT:' + (options.snapshotComplete ? 'COMPLETE-ASSERTED' : 'PARTIAL'),
  ];
  for (const event of events) {
    if (!event || typeof event !== 'object' || typeof event.calendarId !== 'string' ||
        !scope.has(event.calendarId)) throw new Error('Event outside the authorized scope');
    const uid = stringValue(event.uid, 'opaque event UID', 128);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) || uniqueUids.has(uid)) {
      throw new Error('UID must be opaque, nonempty, unique and free from provider/person details');
    }
    uniqueUids.add(uid);
    const title = stringValue(event.title, 'title', 500);
    // Reject raw recurrence data: caller must explicitly expand and assign unique occurrence UIDs.
    if ('recurrence' in event || 'recurrences' in event) {
      throw new Error('Expand and normalize recurring events before export');
    }
    let dateLines: string[];
    if (event.allDay === true) {
      const from = parseDate(event.startDate), to = parseDate(event.endDateExclusive);
      if (to <= from || to - from > MAX_DURATION) throw new Error('Invalid all-day event dates');
      dateLines = [
        'DTSTART;VALUE=DATE:' + yyyymmdd(event.startDate),
        'DTEND;VALUE=DATE:' + yyyymmdd(event.endDateExclusive),
      ];
    } else if (event.allDay === false || event.allDay === undefined) {
      const timed = event as TimedExportEvent;
      const from = parseInstant(timed.start), to = parseInstant(timed.end);
      if (to <= from || to - from > MAX_DURATION) throw new Error('Invalid timed event interval');
      dateLines = ['DTSTART:' + utcStamp(from), 'DTEND:' + utcStamp(to)];
    } else {
      throw new Error('Invalid all-day flag');
    }
    lines.push('BEGIN:VEVENT', 'UID:' + uid + '@community-calendar.invalid', 'DTSTAMP:' + dtstamp,
      ...dateLines, 'CLASS:PRIVATE', 'TRANSP:OPAQUE',
      'SUMMARY:' + escapeText(options.includeTitles === true ? title : 'Busy'));
    if (options.includeDescriptions === true && event.description !== undefined) {
      lines.push('DESCRIPTION:' + escapeText(stringValue(event.description, 'description', 5000)));
    }
    if (options.includeLocations === true && event.location !== undefined) {
      lines.push('LOCATION:' + escapeText(stringValue(event.location, 'location', 1000)));
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.flatMap(foldLine).join('\r\n') + '\r\n';
}
