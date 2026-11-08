/**
 * Portable, read-only Calendar Bridge MCP tools.
 *
 * Deliberately no Google credentials, writes, UI-host APIs, or filesystem writes.
 * All clients receive the same JSON output, whether or not they support MCP Apps.
 */
import { z } from 'zod';
import type { TimeTreeAPIClient } from '../client/api.js';
import type { Event } from '../types/timetree.js';
import { exportCalendarIcs } from '../bridge/ics.js';
import { planBridgeExport, type BridgeEvent, type BridgeDestinationEvent } from '../bridge/plan.js';
import { logger } from '../utils/logger.js';
import type { SkipTally } from '../utils/lenient-list.js';
import { parseToolInput, toolErrorResult, InvalidArgumentError } from '../utils/mcp-errors.js';
import { CalendarIdSchema, CALENDAR_ID_JSON_SCHEMA, READ_ONLY } from './shared-schemas.js';

const WINDOW_LIMIT_MS = 366 * 86_400_000;
const MAX_EVENTS = 250;

const WindowSchema = z.object({
  calendar_id: CalendarIdSchema,
  start_at: z.number().int().safe(),
  end_at: z.number().int().safe(),
  max_events: z.number().int().min(1).max(MAX_EVENTS).default(MAX_EVENTS),
}).strict().refine(v => v.end_at > v.start_at && v.end_at - v.start_at <= WINDOW_LIMIT_MS, {
  message: 'A valid window of at most 366 days is required',
  path: ['end_at'],
});

export const PreviewBridgeInputSchema = WindowSchema.safeExtend({
  destination_calendar_id: z.string().trim().min(1).max(256),
  privacy: z.enum(['full', 'busy']).default('full'),
  destination_snapshot_complete: z.boolean().default(false),
  existing_destination_events: z.array(z.object({
    id: z.string().min(1),
    sourceKey: z.string().optional(),
    title: z.string(),
    startMs: z.number().finite(),
    endMs: z.number().finite(),
    allDay: z.boolean().optional(),
  }).strict()).max(MAX_EVENTS).default([]),
});

export const ExportBridgeIcsInputSchema = WindowSchema.safeExtend({
  calendar_name: z.string().trim().min(1).max(100),
  privacy: z.enum(['full', 'busy']).default('full'),
});

function supportedEvent(event: Event): boolean {
  // Never silently flatten recurring series or edited exceptions. Those need
  // instance-aware identity, TZ handling and recurrence exception semantics.
  return !event.recurrences?.length && !event.parent_id && !event.all_day;
}

function selectedEvents(events: readonly Event[], start: number, end: number) {
  return events.filter(event =>
    !event.deactivated_at &&
    event.category !== 2 &&
    ((event.recurrences?.length && event.start_at < end) ||
      (event.start_at >= start && event.start_at < end))
  );
}

function toBridgeEvent(event: Event, calendarId: string): BridgeEvent {
  return {
    id: event.uuid,
    calendarId,
    title: event.title,
    startMs: event.start_at,
    endMs: event.end_at,
    allDay: event.all_day,
    ...(event.note ? { description: event.note } : {}),
  };
}

const windowProperties = {
  calendar_id: CALENDAR_ID_JSON_SCHEMA,
  start_at: { type: 'number', description: 'Inclusive UTC Unix milliseconds; required' },
  end_at: { type: 'number', description: 'Exclusive UTC Unix milliseconds; up to 366 days after start_at' },
  max_events: { type: 'integer', minimum: 1, maximum: MAX_EVENTS, description: 'Safety limit, default 250; errors instead of truncating' },
} as const;

function ensureWithinLimit(count: number, limit: number): void {
  if (count > limit) {
    throw new InvalidArgumentError('max_events', '予定が上限を超えています。期間を短くしてください', 'Event count exceeds safety limit; use a shorter range');
  }
}

export function createPreviewCalendarBridgeTool(apiClient: TimeTreeAPIClient) {
  return {
    name: 'preview_calendar_bridge',
    description: 'Read-only TimeTree-to-Google migration preview. Does not contact Google or write anything. ' +
      'Provide destination calendar ID and an optional snapshot of existing Google events. ' +
      'Recurring, exception and all-day events are blocked rather than flattened. ' +
      'Output is portable JSON usable in Claude, Gemini, ChatGPT and other MCP clients.',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        ...windowProperties,
        destination_calendar_id: { type: 'string', description: 'Explicit destination calendar ID; no automatic name matching' },
        privacy: { type: 'string', enum: ['full', 'busy'], description: 'busy omits title and notes' },
        destination_snapshot_complete: { type: 'boolean', description: 'True only after checking all existing destination events within the exact window; an empty calendar may have zero entries.' },
        existing_destination_events: {
          type: 'array', maxItems: MAX_EVENTS,
          description: 'Optional complete destination snapshot for the same time window. Empty means duplicates cannot be checked.',
          items: { type: 'object', properties: {
            id: { type: 'string' }, sourceKey: { type: 'string' }, title: { type: 'string' },
            startMs: { type: 'number' }, endMs: { type: 'number' }, allDay: { type: 'boolean' },
          }, required: ['id', 'title', 'startMs', 'endMs'], additionalProperties: false },
        },
      },
      required: ['calendar_id', 'start_at', 'end_at', 'destination_calendar_id'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object', properties: {
        ready: { type: 'boolean' }, calendar_id: { type: 'string' }, destination_calendar_id: { type: 'string' },
        snapshot_supplied: { type: 'boolean' }, scanned: { type: 'number' }, unreadable: { type: 'number' },
        blocked: { type: 'number' }, blocked_event_ids: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        plan: { type: 'object' },
      },
      required: ['ready', 'calendar_id', 'destination_calendar_id', 'snapshot_supplied', 'scanned', 'unreadable', 'blocked', 'blocked_event_ids', 'warnings', 'plan'],
    },
    handler: async (args: unknown) => {
      try {
        const input = parseToolInput(PreviewBridgeInputSchema, args);
        const calendarId = String(input.calendar_id);
        const tally: SkipTally = { skipped: 0 };
        const events = selectedEvents(await apiClient.getEventsByCalendar(calendarId, 0, tally), input.start_at, input.end_at);
        ensureWithinLimit(events.length, input.max_events);
        const blocked = events.filter(event => !supportedEvent(event));
        const supported = events.filter(supportedEvent).map(event => toBridgeEvent(event, calendarId));
        const destination: BridgeDestinationEvent[] = input.existing_destination_events;
        const plan = planBridgeExport(supported, destination, {
          sourceCalendarId: calendarId, destinationCalendarId: input.destination_calendar_id,
          privacy: input.privacy,
        });
        const warnings = [
          'Preview only; no Google connection or write has occurred.',
          ...(tally.skipped > 0 ? ['Some TimeTree records were unreadable; preview is incomplete.'] : []),
          ...(!input.destination_snapshot_complete
            ? ['Destination snapshot has not been marked complete; duplicate detection is incomplete.']
            : []),
          ...(blocked.length ? ['Recurring, exception or all-day events require special handling and were blocked.'] : []),
        ];
        return { content: [{ type: 'text', text: JSON.stringify({
          ready: blocked.length === 0 && tally.skipped === 0 && input.destination_snapshot_complete &&
            plan.totals.invalid === 0,
          calendar_id: calendarId, destination_calendar_id: input.destination_calendar_id,
          snapshot_supplied: input.destination_snapshot_complete,
          scanned: events.length, unreadable: tally.skipped,
          blocked: blocked.length, blocked_event_ids: blocked.map(e => e.uuid),
          warnings, plan,
        }) }] };
      } catch (error) {
        logger.error('Tool: preview_calendar_bridge failed', { error });
        return toolErrorResult(error);
      }
    },
  };
}

export function createExportCalendarBridgeIcsTool(apiClient: TimeTreeAPIClient) {
  return {
    name: 'export_calendar_bridge_ics',
    description: 'Read-only RFC 5545 ICS text export of single, timed TimeTree events in a limited window. ' +
      'Rejects recurring, exception and all-day events, rather than silently losing or changing them. ' +
      'Copy the returned ics_content into a .ics file to import into calendar applications.',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        ...windowProperties,
        calendar_name: { type: 'string', description: 'Explicit calendar display name' },
        privacy: { type: 'string', enum: ['full', 'busy'] },
      },
      required: ['calendar_id', 'start_at', 'end_at', 'calendar_name'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object', properties: {
        calendar_id: { type: 'string' }, event_count: { type: 'number' },
        ics_content: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } },
      }, required: ['calendar_id', 'event_count', 'ics_content', 'warnings'],
    },
    handler: async (args: unknown) => {
      try {
        const input = parseToolInput(ExportBridgeIcsInputSchema, args);
        const calendarId = String(input.calendar_id);
        const events = selectedEvents(await apiClient.getEventsByCalendar(calendarId), input.start_at, input.end_at);
        ensureWithinLimit(events.length, input.max_events);
        if (tally.skipped > 0) {
          throw new InvalidArgumentError('calendar_id', '読み取れない予定があるため書き出しを中止しました',
            'Calendar has unreadable events; export aborted to avoid an incomplete backup');
        }
        if (events.some(event => !supportedEvent(event))) {
          throw new InvalidArgumentError('calendar_id', '繰り返し・例外・終日予定を含みます。誤った出力を避けるため中止しました',
            'Calendar contains recurring, exception or all-day events; export aborted to avoid incorrect data');
        }
        const icsContent = exportCalendarIcs(events.map(event => toBridgeEvent(event, calendarId)), {
          calendarId, calendarName: input.calendar_name, privacy: input.privacy,
          generatedAtMs: Date.now(),
        });
        return { content: [{ type: 'text', text: JSON.stringify({
          calendar_id: calendarId, event_count: events.length, ics_content: icsContent,
          warnings: ['Timed single events only. This is a snapshot, not a live sync.'],
        }) }] };
      } catch (error) {
        logger.error('Tool: export_calendar_bridge_ics failed', { error });
        return toolErrorResult(error);
      }
    },
  };
}
