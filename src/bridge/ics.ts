/** RFC 5545 export for a read-only, portable TimeTree calendar backup. */
import { createHash } from 'node:crypto';
import type { BridgeEvent } from './plan.js';

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function utcDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');
}

/** Fold by UTF-8 octets, not JS string length. Continuation lines begin with one space. */
function fold(line: string): string {
  const parts: string[] = [];
  let chunk = '';
  let bytes = 0;
  for (const char of line) {
    const width = Buffer.byteLength(char, 'utf8');
    const max = parts.length === 0 ? 75 : 74;
    if (bytes + width > max) {
      parts.push(chunk);
      chunk = '';
      bytes = 0;
    }
    chunk += char;
    bytes += width;
  }
  parts.push(chunk);
  return parts.join('\r\n ');
}

export type IcsExportOptions = {
  calendarId: string;
  calendarName: string;
  generatedAtMs: number;
  privacy?: 'full' | 'busy';
};

/**
 * Generates a single calendar file without modifying TimeTree.
 * For all-day events, start/end must be UTC midnight boundaries and end is exclusive.
 * Recurring occurrences must have stable distinct IDs; unsupported recurrence
 * semantics are intentionally not reconstructed.
 */
export function exportCalendarIcs(events: readonly BridgeEvent[], options: IcsExportOptions): string {
  if (!options.calendarId || !Number.isFinite(options.generatedAtMs)) throw new Error('Invalid export options');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeTree MCP//Calendar Bridge//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:' + escapeText(options.calendarName),
  ];
  const seen = new Set<string>();
  for (const event of events) {
    if (event.calendarId !== options.calendarId) continue;
    if (!event.id || !event.title.trim() || !Number.isFinite(event.startMs) ||
      !Number.isFinite(event.endMs) || event.endMs <= event.startMs) {
      throw new Error('Invalid calendar event');
    }
    if (event.allDay && (event.startMs % 86400000 !== 0 || event.endMs % 86400000 !== 0)) {
      throw new Error('All-day events require exclusive UTC day boundaries');
    }
    const uid = createHash('sha256').update(JSON.stringify([event.calendarId, event.id])).digest('hex') + '@timetree-mcp.local';
    if (seen.has(uid)) throw new Error('Duplicate event identifier');
    seen.add(uid);
    lines.push('BEGIN:VEVENT', 'UID:' + uid, 'DTSTAMP:' + utcDate(options.generatedAtMs));
    if (event.allDay) {
      lines.push('DTSTART;VALUE=DATE:' + utcDay(event.startMs), 'DTEND;VALUE=DATE:' + utcDay(event.endMs));
    } else {
      lines.push('DTSTART:' + utcDate(event.startMs), 'DTEND:' + utcDate(event.endMs));
    }
    const busy = options.privacy === 'busy';
    lines.push('SUMMARY:' + escapeText(busy ? 'Busy' : event.title));
    if (!busy && event.description) lines.push('DESCRIPTION:' + escapeText(event.description));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
