/**
 * Read-only duplicate draft protection using authorized calendar snapshots.
 * Results are candidates for review, never proof that an event should be deleted.
 * There are no provider calls, credentials, or mutations.
 */
export interface EventDraft {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
}

export interface ExistingEvent extends EventDraft {
  calendarId: string;
  eventId: string;
  recurrence?: 'none' | 'expanded-occurrence' | 'unexpanded-series';
}

export interface DuplicateCheckOptions {
  calendarIds: string[];
  /** Set only when caller checked provider pagination, recurrence expansion and authorization. */
  snapshotComplete: boolean;
  timeZone: string;
  /** Maximum difference between start instants to show a possible duplicate. Defaults to 15 minutes. */
  toleranceMinutes?: number;
  /** Maximum number of results to return. Defaults to 20. */
  maxResults?: number;
}

export interface PossibleDuplicate {
  calendarId: string;
  eventId: string;
  match: 'exact-time' | 'near-time';
  startDifferenceMinutes: number;
  /** Data minimization: event title, attendees, location, and notes are intentionally omitted. */
}

export interface DuplicateCheckResult {
  status: 'review-needed' | 'no-match-in-snapshot';
  draft: { start: string; end: string; allDay: boolean };
  matches: PossibleDuplicate[];
  totalMatches: number;
  truncated: boolean;
  checkedCalendars: string[];
  completeness: 'caller-asserted';
  /** Never a credential, provider status, or a mutation confirmation. */
  executed: false;
}

const MAX_EVENTS = 2000;
const MAX_SCOPE = 10;
const MAX_WINDOW = 366 * 24 * 60 * 60 * 1000;
const OFFSET_ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/i;

function instant(value: string): number {
  const m = typeof value === 'string' ? OFFSET_ISO.exec(value) : null;
  if (!m) throw new Error('Timestamp must include seconds and an explicit timezone offset');
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = Number(m[6]);
  const offsetHours = Number(m[9] || 0);
  const offsetMinutes = Number(m[10] || 0);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysPerMonth[month - 1]! ||
      hour > 23 || minute > 59 || second > 59 || offsetHours > 14 || offsetMinutes > 59 ||
      (offsetHours === 14 && offsetMinutes > 0)) throw new Error('Invalid timestamp');
  const parsed = Date.parse(value);
  if (!Number.isSafeInteger(parsed)) throw new Error('Invalid timestamp');
  return parsed;
}

function normalizedTitle(value: string): string {
  if (typeof value !== 'string' || value.length > 300 || value.includes('\0')) {
    throw new Error('Invalid event title');
  }
  const normalized = value.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');
  if (normalized.length < 2) throw new Error('Event title is too short to compare safely');
  return normalized;
}

function interval(input: EventDraft): { start: number; end: number } {
  if (!input || typeof input !== 'object' || typeof input.allDay !== 'boolean') {
    throw new Error('Invalid event data');
  }
  const start = instant(input.start);
  const end = instant(input.end);
  if (end <= start || end - start > MAX_WINDOW) throw new Error('Invalid or excessive event duration');
  return { start, end };
}

/**
 * Candidate matches require normalized title equality, same all-day flag and similar start/duration.
 * A false positive is still possible. Never suppress or delete an event automatically.
 */
export function checkPossibleDuplicates(
  draft: EventDraft,
  events: readonly ExistingEvent[],
  options: DuplicateCheckOptions,
): DuplicateCheckResult {
  if (!options || !Array.isArray(options.calendarIds) || options.calendarIds.length < 1 ||
      options.calendarIds.length > MAX_SCOPE ||
      options.calendarIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 128) ||
      new Set(options.calendarIds).size !== options.calendarIds.length ||
      !Array.isArray(events) || events.length > MAX_EVENTS) {
    throw new Error('Invalid selected calendar scope');
  }
  if (options.snapshotComplete !== true) throw new Error('Complete authorized snapshot required');
  if (typeof options.timeZone !== 'string') throw new Error('Invalid timezone');
  try { new Intl.DateTimeFormat('en-US', { timeZone: options.timeZone }); }
  catch { throw new Error('Invalid timezone'); }
  const toleranceMinutes = options.toleranceMinutes ?? 15;
  const maxResults = options.maxResults ?? 20;
  if (!Number.isSafeInteger(toleranceMinutes) || toleranceMinutes < 0 || toleranceMinutes > 120 ||
      !Number.isSafeInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid duplicate-check limit');
  }
  const draftTitle = normalizedTitle(draft.title);
  const draftInterval = interval(draft);
  const permitted = new Set(options.calendarIds);
  const seen = new Set<string>();
  const matches: PossibleDuplicate[] = [];
  for (const event of events) {
    if (!event || typeof event.calendarId !== 'string' || !permitted.has(event.calendarId) ||
        typeof event.eventId !== 'string' || !event.eventId.trim() || event.eventId.length > 128) {
      throw new Error('Untrusted or out-of-scope snapshot event');
    }
    const identity = JSON.stringify([event.calendarId, event.eventId]);
    if (seen.has(identity)) throw new Error('Duplicate event identity in snapshot');
    seen.add(identity);
    if (event.recurrence === 'unexpanded-series' ||
        (event.recurrence !== undefined && !['none', 'expanded-occurrence'].includes(event.recurrence))) {
      throw new Error('Expand recurrence before checking duplicates');
    }
    const eventTitle = normalizedTitle(event.title);
    const current = interval(event);
    if (event.allDay !== draft.allDay || eventTitle !== draftTitle) continue;
    const startGap = Math.abs(current.start - draftInterval.start) / 60000;
    const durationGap = Math.abs((current.end - current.start) - (draftInterval.end - draftInterval.start)) / 60000;
    if (startGap > toleranceMinutes || durationGap > toleranceMinutes) continue;
    matches.push({
      calendarId: event.calendarId,
      eventId: event.eventId,
      match: startGap === 0 && durationGap === 0 ? 'exact-time' : 'near-time',
      startDifferenceMinutes: startGap,
    });
  }
  matches.sort((a, b) => a.startDifferenceMinutes - b.startDifferenceMinutes ||
    a.calendarId.localeCompare(b.calendarId) || a.eventId.localeCompare(b.eventId));
  return {
    status: matches.length ? 'review-needed' : 'no-match-in-snapshot',
    draft: { start: new Date(draftInterval.start).toISOString(),
      end: new Date(draftInterval.end).toISOString(), allDay: draft.allDay },
    matches: matches.slice(0, maxResults),
    totalMatches: matches.length,
    truncated: matches.length > maxResults,
    checkedCalendars: [...options.calendarIds],
    completeness: 'caller-asserted',
    executed: false,
  };
}
