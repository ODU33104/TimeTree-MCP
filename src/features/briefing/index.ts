/** Deterministic, read-only schedule briefing. No external AI or network calls. */
export interface BriefEvent {
  id: string;
  calendarId: string;
  title: string;
  start: number;
  end: number;
  allDay?: boolean;
  preparationMinutes?: number;
}
export interface BriefItem {
  kind: 'upcoming' | 'conflict' | 'prepare';
  eventIds: string[];
  message: string;
  at: number;
}
export interface BriefOptions {
  now: number;
  timezone: string;
  days?: 1 | 7;
  includeTitles?: boolean;
  includePreparation?: boolean;
  maxItems?: number;
}
export interface Briefing {
  periodStart: number;
  periodEnd: number;
  timezone: string;
  items: BriefItem[];
}

export function buildBriefing(events: readonly BriefEvent[], options: BriefOptions): Briefing {
  const { now, timezone, days = 1, includeTitles = false, includePreparation = false, maxItems = 30 } = options;
  if (!Number.isSafeInteger(now) || ![1, 7].includes(days) || !Number.isInteger(maxItems) || maxItems < 1 || maxItems > 100) {
    throw new Error('Invalid briefing options');
  }
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }); }
  catch { throw new Error('Invalid timezone'); }
  // The requested duration is an elapsed-time window, not a calendar-day boundary.
  // This avoids silently guessing how DST should change a user's local day.
  const end = now + days * 86400000;
  if (!Number.isSafeInteger(end)) throw new Error('Invalid briefing range');
  const relevant = events.filter((event) => {
    if (!event.id || !event.calendarId || !Number.isSafeInteger(event.start) ||
        !Number.isSafeInteger(event.end) || event.end <= event.start) {
      throw new Error('Invalid event');
    }
    if (event.preparationMinutes !== undefined &&
        (!Number.isSafeInteger(event.preparationMinutes) || event.preparationMinutes < 0 || event.preparationMinutes > 10080)) {
      throw new Error('Invalid preparation duration');
    }
    return event.end > now && event.start < end;
  }).sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  const items: BriefItem[] = [];
  for (const event of relevant) {
    const label = includeTitles ? event.title : 'Scheduled event';
    items.push({ kind: 'upcoming', eventIds: [event.id], message: label, at: event.start });
    if (includePreparation && event.preparationMinutes && !event.allDay) {
      items.push({ kind: 'prepare', eventIds: [event.id], message: `Prepare ${event.preparationMinutes} minutes before event`, at: event.start - event.preparationMinutes * 60000 });
    }
  }
  for (let i = 0; i < relevant.length; i++) {
    const a = relevant[i]!;
    for (let j = i + 1; j < relevant.length && relevant[j]!.start < a.end; j++) {
      const b = relevant[j]!;
      if (a.calendarId === b.calendarId && a.id === b.id) continue;
      items.push({ kind: 'conflict', eventIds: [a.id, b.id], message: 'Overlapping events', at: b.start });
    }
  }
  items.sort((a, b) => a.at - b.at || a.kind.localeCompare(b.kind));
  return { periodStart: now, periodEnd: end, timezone, items: items.slice(0, maxItems) };
}
