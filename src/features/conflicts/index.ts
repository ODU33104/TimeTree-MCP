/** Pure, read-only overlap detection. All timestamps are UTC epoch milliseconds. */
export interface BusyEvent {
  id: string;
  calendarId: string;
  start: number;
  end: number;
  allDay?: boolean;
}
export interface Conflict {
  first: BusyEvent;
  second: BusyEvent;
  overlapStart: number;
  overlapEnd: number;
}
export interface AlternativeSlot {
  start: number;
  end: number;
}

function validate(event: BusyEvent): void {
  if (!event.id || !event.calendarId || !Number.isSafeInteger(event.start) ||
      !Number.isSafeInteger(event.end) || event.end <= event.start) {
    throw new Error('Invalid event interval');
  }
}

/** Half-open intervals: adjacent events do not conflict. */
export function findConflicts(events: readonly BusyEvent[]): Conflict[] {
  events.forEach(validate);
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end || a.id.localeCompare(b.id));
  const conflicts: Conflict[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i]!;
    for (let j = i + 1; j < sorted.length && sorted[j]!.start < first.end; j++) {
      const second = sorted[j]!;
      if (first.id === second.id && first.calendarId === second.calendarId) continue;
      conflicts.push({
        first, second,
        overlapStart: Math.max(first.start, second.start),
        overlapEnd: Math.min(first.end, second.end),
      });
    }
  }
  return conflicts;
}

/** Find earliest conflict-free slots within a bounded UTC search window. */
export function suggestAlternatives(
  events: readonly BusyEvent[],
  windowStart: number,
  windowEnd: number,
  durationMs: number,
  maxResults = 5,
): AlternativeSlot[] {
  events.forEach(validate);
  if (![windowStart, windowEnd, durationMs, maxResults].every(Number.isSafeInteger) ||
      windowEnd <= windowStart || durationMs <= 0 || maxResults < 1 || maxResults > 100) {
    throw new Error('Invalid search window');
  }
  const merged: AlternativeSlot[] = [];
  for (const event of [...events].sort((a, b) => a.start - b.start)) {
    const start = Math.max(windowStart, event.start);
    const end = Math.min(windowEnd, event.end);
    if (start >= end) continue;
    const last = merged[merged.length - 1];
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else merged.push({ start, end });
  }
  const slots: AlternativeSlot[] = [];
  let cursor = windowStart;
  for (const busy of [...merged, { start: windowEnd, end: windowEnd }]) {
    while (cursor + durationMs <= busy.start && slots.length < maxResults) {
      slots.push({ start: cursor, end: cursor + durationMs });
      cursor += durationMs;
    }
    cursor = Math.max(cursor, busy.end);
    if (slots.length === maxResults) break;
  }
  return slots;
}
