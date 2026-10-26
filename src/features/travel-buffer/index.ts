/** Pure travel-buffer validation. No location lookup or network access. */
export interface ScheduledEvent {
  id: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
}
export interface TravelRequirement {
  fromEventId: string;
  toEventId: string;
  travelMinutes: number;
  preparationMinutes?: number;
}
export interface TravelWarning {
  fromEventId: string;
  toEventId: string;
  availableMinutes: number;
  requiredMinutes: number;
  shortfallMinutes: number;
  kind: 'overlap' | 'insufficient-buffer';
}
function parseInstant(value: string): number {
  // Require an explicit offset to avoid silently interpreting local wall time during DST.
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) throw new Error('Timestamp must include timezone offset');
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error('Invalid timestamp');
  return timestamp;
}
function minutes(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10080) throw new Error('Invalid ' + field);
  return value;
}
export function evaluateTravelBuffers(events: readonly ScheduledEvent[], requirements: readonly TravelRequirement[]): TravelWarning[] {
  const indexed = new Map<string, { start: number; end: number; allDay: boolean }>();
  for (const event of events) {
    if (!event.id || indexed.has(event.id)) throw new Error('Duplicate or empty event ID');
    const start = parseInstant(event.start);
    const end = parseInstant(event.end);
    if (end <= start) throw new Error('Event end must follow start');
    indexed.set(event.id, { start, end, allDay: event.allDay === true });
  }
  const warnings: TravelWarning[] = [];
  for (const requirement of requirements) {
    const from = indexed.get(requirement.fromEventId);
    const to = indexed.get(requirement.toEventId);
    if (!from || !to) throw new Error('Unknown event ID');
    if (requirement.fromEventId === requirement.toEventId) throw new Error('Cannot travel to same event');
    const travel = minutes(requirement.travelMinutes, 'travelMinutes');
    const prep = minutes(requirement.preparationMinutes ?? 0, 'preparationMinutes');
    // All-day events are not precise appointments and must not produce false travel alerts.
    if (from.allDay || to.allDay) continue;
    const available = (to.start - from.end) / 60000;
    const required = travel + prep;
    if (available < required) warnings.push({
      fromEventId: requirement.fromEventId,
      toEventId: requirement.toEventId,
      availableMinutes: available,
      requiredMinutes: required,
      shortfallMinutes: required - available,
      kind: available < 0 ? 'overlap' : 'insufficient-buffer',
    });
  }
  return warnings;
}
