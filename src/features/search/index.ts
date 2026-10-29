/** Deterministic, read-only event search across calendars. No network or logging. */
export interface SearchEvent {
  uuid: string;
  calendar_id: string | number;
  title: string;
  start_at: number | string;
  end_at: number | string;
  note?: string | null;
  all_day?: boolean;
}
export interface SearchOptions {
  start: string;
  end: string;
  keyword?: string;
  calendarIds?: Array<string | number>;
  limit?: number;
  offset?: number;
}
export interface SearchPage {
  events: SearchEvent[];
  total: number;
  nextOffset: number | null;
}
function instant(value: string | number): number {
  const n = typeof value === 'number' ? value : Date.parse(value);
  if (!Number.isFinite(n)) throw new Error('Invalid event timestamp');
  return n;
}
function boundary(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw new Error('Search bounds require ISO 8601 timestamps with explicit timezone');
  }
  return instant(value);
}
/** Half-open [start, end) interval. Stable ordering by start, calendar and UUID. */
export function searchEvents(events: readonly SearchEvent[], options: SearchOptions): SearchPage {
  const start = boundary(options.start);
  const end = boundary(options.end);
  if (end <= start) throw new Error('Search end must follow start');
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) throw new Error('limit must be 1..200');
  if (!Number.isSafeInteger(offset) || offset < 0) throw new Error('offset must be nonnegative');
  const selected = options.calendarIds?.map(String);
  const needle = options.keyword?.trim().toLocaleLowerCase() ?? '';
  const matching = events.filter(event => {
    if (selected && !selected.includes(String(event.calendar_id))) return false;
    const s = instant(event.start_at), e = instant(event.end_at);
    if (e <= s || s >= end || e <= start) return false;
    return !needle || (event.title + ' ' + (event.note ?? '')).toLocaleLowerCase().includes(needle);
  }).sort((a,b) => instant(a.start_at)-instant(b.start_at) ||
    String(a.calendar_id).localeCompare(String(b.calendar_id)) || a.uuid.localeCompare(b.uuid));
  return { events: matching.slice(offset, offset+limit), total: matching.length,
    nextOffset: offset+limit < matching.length ? offset+limit : null };
}
