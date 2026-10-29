/** Pure, read-only free/busy computation. All timestamps are ISO instants. */
export interface BusyEvent { start: string; end: string; calendarId: string; }
export interface AvailabilityRequest {
  start: string; end: string; durationMinutes: number;
  calendarIds: string[]; timeZone: string;
  workingHours?: { start: string; end: string };
  stepMinutes?: number;
}
export interface AvailableSlot { start: string; end: string; }
const MINUTE = 60_000;
function instant(value: string): number {
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('Timestamp must have an explicit timezone');
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error('Invalid timestamp');
  return time;
}
function minutes(value: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) throw new Error('Invalid working-hours clock');
  return Number(m[1]) * 60 + Number(m[2]);
}
function localMinute(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(timestamp);
  return Number(parts.find(p => p.type === 'hour')?.value) * 60 + Number(parts.find(p => p.type === 'minute')?.value);
}
/** Finds candidate slots with no overlap in any selected calendar; never writes events. */
export function findAvailableSlots(events: readonly BusyEvent[], request: AvailabilityRequest): AvailableSlot[] {
  const from = instant(request.start), to = instant(request.end);
  const duration = request.durationMinutes * MINUTE;
  const step = (request.stepMinutes ?? 15) * MINUTE;
  if (to <= from || to - from > 31 * 24 * 60 * MINUTE) throw new Error('Invalid or excessive search window');
  if (!Number.isInteger(request.durationMinutes) || request.durationMinutes < 1 || request.durationMinutes > 1440) throw new Error('Invalid duration');
  if (!Number.isInteger(request.stepMinutes ?? 15) || step < MINUTE || step > 1440 * MINUTE) throw new Error('Invalid step');
  if (!Array.isArray(request.calendarIds) || !request.calendarIds.length || request.calendarIds.some(id => typeof id !== 'string' || !id.trim())) throw new Error('Select calendars');
  new Intl.DateTimeFormat('en', { timeZone: request.timeZone });
  const hours = request.workingHours;
  const workStart = hours ? minutes(hours.start) : 0;
  const workEnd = hours ? minutes(hours.end) : 1440;
  if (workEnd <= workStart) throw new Error('Working hours must not cross midnight');
  const selected = new Set(request.calendarIds);
  const busy = events.filter(e => selected.has(e.calendarId)).map(e => {
    const start = instant(e.start), end = instant(e.end);
    if (end <= start) throw new Error('Invalid busy interval');
    return { start, end };
  }).sort((a, b) => a.start - b.start);
  const slots: AvailableSlot[] = [];
  for (let start = from; start + duration <= to; start += step) {
    const end = start + duration;
    if (busy.some(b => b.start < end && start < b.end)) continue;
    if (hours) {
      // Check every minute so DST transitions, midnight and partial workday edges are respected.
      let valid = true;
      for (let t = start; t < end; t += MINUTE) {
        const minute = localMinute(t, request.timeZone);
        if (minute < workStart || minute >= workEnd) { valid = false; break; }
      }
      if (!valid) continue;
    }
    slots.push({ start: new Date(start).toISOString(), end: new Date(end).toISOString() });
  }
  return slots;
}
