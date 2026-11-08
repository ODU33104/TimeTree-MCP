/**
 * Calendar Bridge: pure, side-effect-free planning for TimeTree -> external calendars.
 * No credentials, network access, or destructive operations live here.
 */
export type BridgeEvent = {
  id: string;
  calendarId: string;
  title: string;
  startMs: number;
  endMs: number;
  allDay?: boolean;
  description?: string;
  updatedMs?: number;
};

export type BridgeMapping = {
  sourceCalendarId: string;
  destinationCalendarId: string;
  privacy: 'full' | 'busy';
};

export type BridgeDestinationEvent = {
  id: string;
  sourceKey?: string;
  title: string;
  startMs: number;
  endMs: number;
  allDay?: boolean;
  description?: string;
};

export type BridgePlanAction =
  | { kind: 'create'; sourceKey: string; destinationCalendarId: string; event: Omit<BridgeDestinationEvent, 'id'> }
  | { kind: 'skip'; sourceKey: string; reason: 'already-synced' | 'possible-duplicate' | 'invalid-event' };

export type BridgePlan = {
  actions: BridgePlanAction[];
  totals: { create: number; skip: number; invalid: number };
};

export function sourceKey(event: Pick<BridgeEvent, 'calendarId' | 'id'>): string {
  return JSON.stringify([event.calendarId, event.id]);
}

/**
 * Produces a preview only. It never deletes, overwrites, or sends an event.
 * Existing events without a sourceKey are conservatively considered possible
 * duplicates if their start, end, all-day flag and title match.
 */
export function planBridgeExport(
  source: readonly BridgeEvent[],
  destination: readonly BridgeDestinationEvent[],
  mapping: BridgeMapping,
): BridgePlan {
  if (!mapping.sourceCalendarId || !mapping.destinationCalendarId) {
    throw new Error('Both source and destination calendar IDs are required');
  }
  const existingKeys = new Set(destination.map(e => e.sourceKey).filter((key): key is string => !!key));
  const existingSignatures = new Set(destination.map(e => JSON.stringify([e.title, e.startMs, e.endMs, !!e.allDay])));
  const seen = new Set<string>();
  const actions: BridgePlanAction[] = [];

  for (const item of source) {
    if (item.calendarId !== mapping.sourceCalendarId) continue;
    const key = sourceKey(item);
    if (seen.has(key) || existingKeys.has(key)) {
      actions.push({ kind: 'skip', sourceKey: key, reason: 'already-synced' });
      continue;
    }
    seen.add(key);
    if (!item.id || !item.title.trim() || !Number.isFinite(item.startMs) ||
        !Number.isFinite(item.endMs) || item.endMs <= item.startMs) {
      actions.push({ kind: 'skip', sourceKey: key, reason: 'invalid-event' });
      continue;
    }
    const event = {
      sourceKey: key,
      title: mapping.privacy === 'busy' ? 'Busy' : item.title,
      startMs: item.startMs,
      endMs: item.endMs,
      allDay: !!item.allDay,
      ...(mapping.privacy === 'full' && item.description ? { description: item.description } : {}),
    };
    const signature = JSON.stringify([event.title, event.startMs, event.endMs, event.allDay]);
    if (existingSignatures.has(signature)) {
      actions.push({ kind: 'skip', sourceKey: key, reason: 'possible-duplicate' });
      continue;
    }
    actions.push({ kind: 'create', sourceKey: key, destinationCalendarId: mapping.destinationCalendarId, event });
    existingKeys.add(key);
    existingSignatures.add(signature);
  }
  return {
    actions,
    totals: {
      create: actions.filter(a => a.kind === 'create').length,
      skip: actions.filter(a => a.kind === 'skip').length,
      invalid: actions.filter(a => a.kind === 'skip' && a.reason === 'invalid-event').length,
    },
  };
}
