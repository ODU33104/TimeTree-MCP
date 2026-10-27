/** Read-only, privacy-minimized summary of get_events / list_memos snapshots. */
export interface ChecklistSnapshot {
  calendar_id: string | number;
  events?: unknown;
  memos?: unknown;
  /** Explicit upstream pagination/truncation evidence; false rejects the snapshot. */
  complete?: boolean;
  truncated?: boolean;
  hasMore?: boolean;
}
export interface ChecklistFilter {
  calendarIds: readonly (string | number)[];
  scope?: 'events' | 'memos' | 'both';
  ids?: readonly string[];
  includeTitles?: boolean;
  /** Separate explicit authorization/consent for revealing checklist item titles. */
  titlesAuthorized?: boolean;
}
export interface ChecklistSummary {
  total: number;
  completed: number;
  incomplete: number;
  empty: number;
  unavailable: number;
  malformed: number;
  entries: Array<{
    calendarId: string;
    id: string;
    kind: 'event' | 'memo';
    status: 'ok' | 'empty' | 'unavailable' | 'malformed';
    completed: number;
    incomplete: number;
    titles?: string[];
  }>;
}
const MAX_ITEMS = 500;
const MAX_RECORDS = 10000;
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const validId = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 256;
/** Fails closed for malformed snapshots; never infers an empty list from missing data. */
export function summarizeChecklists(
  snapshots: readonly ChecklistSnapshot[],
  filter: ChecklistFilter
): ChecklistSummary {
  if (!Array.isArray(snapshots) || snapshots.length > MAX_RECORDS ||
      !Array.isArray(filter.calendarIds) || filter.calendarIds.length === 0 ||
      filter.calendarIds.some(id => !String(id).trim()) ||
      (filter.scope !== undefined && !['events', 'memos', 'both'].includes(filter.scope)) ||
      (filter.includeTitles === true && filter.titlesAuthorized !== true) ||
      (filter.ids !== undefined && (!Array.isArray(filter.ids) || filter.ids.some(id => !validId(id))))) {
    throw new Error('Invalid checklist summary request');
  }
  const selected = new Set(filter.calendarIds.map(String));
  const ids = filter.ids ? new Set(filter.ids) : undefined;
  const scope = filter.scope ?? 'both';
  const result: ChecklistSummary = { total: 0, completed: 0, incomplete: 0, empty: 0, unavailable: 0, malformed: 0, entries: [] };
  const seen = new Set<string>();
  const covered = new Set<string>();
  for (const snapshot of snapshots) {
    if (!isObject(snapshot) || !selected.has(String(snapshot.calendar_id))) continue;
    const calendarId = String(snapshot.calendar_id);
    if (snapshot.complete === false || snapshot.truncated === true || snapshot.hasMore === true) {
      throw new Error('Incomplete checklist snapshot: pagination or truncation');
    }
    for (const kind of ['event', 'memo'] as const) {
      if (scope !== 'both' && scope !== (kind === 'event' ? 'events' : 'memos')) continue;
      const records = kind === 'event' ? snapshot.events : snapshot.memos;
      if (records === undefined || records === null) {
        throw new Error('Unavailable checklist source: ' + calendarId + '/' + kind);
      }
      covered.add(JSON.stringify([calendarId, kind]));
      if (!Array.isArray(records) || records.length > MAX_RECORDS) throw new Error('Malformed or excessive snapshot records');
      for (const record of records) {
        if (!isObject(record) || !validId(record.uuid) || (ids && !ids.has(record.uuid))) continue;
        if (record.calendar_id !== undefined && String(record.calendar_id) !== calendarId) continue;
        // A memo returned by get_events must not be counted as a separate event.
        if (kind === 'event' && record.category === 2) continue;
        const key = JSON.stringify([calendarId, record.uuid, kind]);
        if (seen.has(key)) continue;
        seen.add(key);
        let status: 'ok' | 'empty' | 'unavailable' | 'malformed' = 'ok';
        let completed = 0, incomplete = 0;
        const titles: string[] = [];
        const checklist = record.checklist;
        if (checklist === undefined || checklist === null) status = 'unavailable';
        else if (!Array.isArray(checklist) || checklist.length > MAX_ITEMS) status = 'malformed';
        else if (checklist.length === 0) status = 'empty';
        else {
          for (const item of checklist) {
            if (!isObject(item) || typeof item.checked !== 'boolean' ||
                typeof item.title !== 'string' || item.title.trim().length === 0 ||
                item.title.length > 500) { status = 'malformed'; break; }
            if (item.checked) completed++; else incomplete++;
            if (filter.includeTitles === true) titles.push(item.title);
          }
        }
        if (status !== 'ok') { completed = 0; incomplete = 0; titles.length = 0; }
        result.completed += completed;
        result.incomplete += incomplete;
        result.total += completed + incomplete;
        if (status === 'empty') result.empty++;
        if (status === 'unavailable') result.unavailable++;
        if (status === 'malformed') result.malformed++;
        result.entries.push({
          calendarId, id: record.uuid, kind, status, completed, incomplete,
          ...(filter.includeTitles === true && status === 'ok' ? { titles } : {})
        });
      }
    }
  }
  for (const calendarId of selected) {
    for (const kind of ['event', 'memo'] as const) {
      if (scope !== 'both' && scope !== (kind === 'event' ? 'events' : 'memos')) continue;
      if (!covered.has(JSON.stringify([calendarId, kind]))) {
        throw new Error('Missing checklist snapshot: ' + calendarId + '/' + kind);
      }
    }
  }
  return result;
}
