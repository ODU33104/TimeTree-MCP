/** Read-only what-if move simulation. No provider requests or calendar mutations. */
export interface ScenarioEvent {
  id: string;
  calendarId: string;
  start: string;
  end: string;
  allDay?: boolean;
  recurrence?: 'none' | 'expanded-occurrence' | 'unexpanded-series';
}
export interface ProposedMove { start: string; end: string; }
export interface MoveRequest {
  calendarId: string;
  eventId: string;
  /** Only calendar IDs the caller is explicitly authorized to read. */
  calendarIds: string[];
  /** Caller asserts all selected calendar events are present in this evaluation window. */
  snapshotComplete: boolean;
  timeZone: string;
  candidates: ProposedMove[];
}
export interface BlockingEvent { eventId: string; calendarId: string; }
export interface MoveComparison {
  candidate: { start: string; end: string };
  beforeConflicts: BlockingEvent[];
  afterConflicts: BlockingEvent[];
  newConflicts: BlockingEvent[];
  resolvedConflicts: BlockingEvent[];
  safeWithinSnapshot: boolean;
}
export interface MoveSimulation {
  eventId: string;
  calendarId: string;
  calendarIds: string[];
  timeZone: string;
  original: { start: string; end: string };
  comparisons: MoveComparison[];
  recommendedIndex: number | null;
  snapshotCompleteness: 'caller-asserted';
  executed: false;
}

const MAX_EVENTS = 1000;
const MAX_CANDIDATES = 20;
const DAY = 86400000;
const MAX_WINDOW = 31 * DAY;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/i;

function instant(value: string): number {
  if (typeof value !== 'string' || !TIMESTAMP.test(value)) {
    throw new Error('Timestamp needs ISO date, time, seconds and explicit timezone offset');
  }
  // Date.parse normalizes invalid calendar dates such as February 30; reject them.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|([+-])(\d{2}):(\d{2}))$/i.exec(value);
  if (!match) throw new Error('Invalid timestamp');
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const offsetHour = Number(match[9] ?? 0), offsetMinute = Number(match[10] ?? 0);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]! ||
      hour > 23 || minute > 59 || second > 59 || offsetHour > 14 ||
      offsetMinute > 59 || (offsetHour === 14 && offsetMinute > 0)) {
    throw new Error('Invalid timestamp');
  }
  const time = Date.parse(value);
  if (!Number.isSafeInteger(time)) throw new Error('Invalid timestamp');
  return time;
}

function key(event: BlockingEvent): string {
  return event.calendarId.length + ':' + event.calendarId + ':' + event.eventId;
}
function chronological(a: BlockingEvent, b: BlockingEvent): number {
  return a.calendarId.localeCompare(b.calendarId) || a.eventId.localeCompare(b.eventId);
}
function selectBlockers(
  others: readonly { item: ScenarioEvent; start: number; end: number }[],
  from: number, to: number,
): BlockingEvent[] {
  return others.filter(e => e.start < to && from < e.end)
    .map(e => ({ calendarId: e.item.calendarId, eventId: e.item.id })).sort(chronological);
}

/**
 * Simulate relocating one non-recurring, timed event, preserving its duration.
 * "Safe" means no conflicts in the supplied complete snapshot, NOT global safety:
 * future updates, travel and unselected calendars are out of scope.
 */
export function simulateEventMove(events: readonly ScenarioEvent[], request: MoveRequest): MoveSimulation {
  if (!request || !Array.isArray(events) || events.length > MAX_EVENTS ||
      !Array.isArray(request.calendarIds) || !request.calendarIds.length || request.calendarIds.length > 10 ||
      request.calendarIds.some(id => typeof id !== 'string' || !id.trim()) ||
      new Set(request.calendarIds).size !== request.calendarIds.length ||
      typeof request.eventId !== 'string' || !request.eventId.trim() ||
      typeof request.calendarId !== 'string' || !request.calendarIds.includes(request.calendarId)) {
    throw new Error('Invalid or unauthorized calendar scope');
  }
  if (request.snapshotComplete !== true) throw new Error('Complete snapshot is required');
  if (typeof request.timeZone !== 'string') throw new Error('Invalid IANA timezone');
  try { new Intl.DateTimeFormat('en-US', { timeZone: request.timeZone }); }
  catch { throw new Error('Invalid IANA timezone'); }
  if (!Array.isArray(request.candidates) || !request.candidates.length || request.candidates.length > MAX_CANDIDATES) {
    throw new Error('Select 1-20 candidate moves');
  }

  const scope = new Set(request.calendarIds);
  const keys = new Set<string>();
  const parsed = events.map(item => {
    if (!item || typeof item.id !== 'string' || !item.id.trim() ||
        typeof item.calendarId !== 'string' || !scope.has(item.calendarId) ||
        !['none', 'expanded-occurrence', 'unexpanded-series', undefined].includes(item.recurrence)) {
      throw new Error('Snapshot contains unknown or out-of-scope events');
    }
    const identity = key({ eventId: item.id, calendarId: item.calendarId });
    if (keys.has(identity)) throw new Error('Ambiguous duplicate event identity');
    keys.add(identity);
    if (item.recurrence === 'unexpanded-series') throw new Error('Expand recurrence before simulating');
    const start = instant(item.start), end = instant(item.end);
    if (end <= start || end - start > MAX_WINDOW) throw new Error('Invalid event interval');
    return { item, start, end };
  });
  const original = parsed.find(p => p.item.id === request.eventId && p.item.calendarId === request.calendarId);
  if (!original) throw new Error('Target event is not in the selected snapshot');
  if (original.item.allDay) throw new Error('All-day event moves need a separate calendar-day simulator');
  if (original.item.recurrence && original.item.recurrence !== 'none') {
    throw new Error('Recurring occurrence moves need explicit series/occurrence scope');
  }
  const others = parsed.filter(p => p !== original);
  const before = selectBlockers(others, original.start, original.end);
  const beforeKeys = new Set(before.map(key));
  const duration = original.end - original.start;

  const comparisons = request.candidates.map(candidate => {
    if (!candidate || typeof candidate !== 'object') throw new Error('Invalid candidate');
    const from = instant(candidate.start), to = instant(candidate.end);
    if (to <= from || to - from !== duration || Math.abs(from - original.start) > MAX_WINDOW) {
      throw new Error('Candidate must keep duration and stay within 31 days');
    }
    const after = selectBlockers(others, from, to);
    const afterKeys = new Set(after.map(key));
    return {
      candidate: { start: new Date(from).toISOString(), end: new Date(to).toISOString() },
      beforeConflicts: before.map(x => ({ ...x })),
      afterConflicts: after,
      newConflicts: after.filter(x => !beforeKeys.has(key(x))),
      resolvedConflicts: before.filter(x => !afterKeys.has(key(x))),
      safeWithinSnapshot: after.length === 0,
    };
  });

  let recommendedIndex: number | null = null;
  comparisons.forEach((result, i) => {
    if (result.safeWithinSnapshot && (recommendedIndex === null ||
        result.resolvedConflicts.length > comparisons[recommendedIndex]!.resolvedConflicts.length)) {
      recommendedIndex = i;
    }
  });
  return {
    eventId: request.eventId,
    calendarId: request.calendarId,
    calendarIds: [...request.calendarIds],
    timeZone: request.timeZone,
    original: { start: new Date(original.start).toISOString(), end: new Date(original.end).toISOString() },
    comparisons,
    recommendedIndex,
    snapshotCompleteness: 'caller-asserted',
    executed: false,
  };
}
