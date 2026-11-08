/**
 * Full read-only TimeTree -> Google Calendar migration preview.
 * Unlike preview_calendar_bridge, this tool reads the actual Google destination
 * snapshot using a locally authenticated Google connection. It never writes.
 */
import { z } from 'zod';
import type { TimeTreeAPIClient } from '../client/api.js';
import type { Event } from '../types/timetree.js';
import type { GoogleConnection } from '../bridge/google-connection.js';
import type { GoogleCalendarApi, GoogleEvent } from '../bridge/google-api.js';
import { googleSourceMarker } from '../bridge/google-api.js';
import { planBridgeExport, sourceKey, type BridgeEvent, type BridgeDestinationEvent } from '../bridge/plan.js';
import type { SkipTally } from '../utils/lenient-list.js';
import { logger } from '../utils/logger.js';
import { parseToolInput, toolErrorResult, InvalidArgumentError } from '../utils/mcp-errors.js';
import { READ_ONLY, CalendarIdSchema, CALENDAR_ID_JSON_SCHEMA } from './shared-schemas.js';

const MAX_EVENTS = 250;
const DAYS_366 = 366 * 86_400_000;

export const PreviewGoogleBridgeInputSchema = z.object({
  calendar_id: CalendarIdSchema,
  google_calendar_id: z.string().trim().min(1).max(512),
  start_at: z.number().int().safe(),
  end_at: z.number().int().safe(),
  privacy: z.enum(['full', 'busy']).default('full'),
}).strict().refine(input => input.end_at > input.start_at && input.end_at - input.start_at <= DAYS_366, {
  path: ['end_at'], message: 'A window of no more than 366 days is required',
});

function hasUnsafeRecurrence(event: Event): boolean {
  return !!event.recurrences?.length || !!event.parent_id || event.all_day;
}

function dateToMs(value: string): number {
  // Date-only events have an exclusive end date, unlike timestamp events.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid Google all-day date');
  const ms = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) {
    throw new Error('Invalid Google all-day date');
  }
  return ms;
}

function toDestination(event: GoogleEvent, sourceByMarker: Map<string, string>): BridgeDestinationEvent {
  const start = event.start;
  const end = event.end;
  if (!start || !end) throw new Error('Google event is missing its start or end');
  const allDay = typeof start.date === 'string' && typeof end.date === 'string';
  if (!allDay && (typeof start.dateTime !== 'string' || typeof end.dateTime !== 'string')) {
    throw new Error('Google event has an unsupported time range');
  }
  const startMs = allDay ? dateToMs(start.date!) : Date.parse(start.dateTime!);
  const endMs = allDay ? dateToMs(end.date!) : Date.parse(end.dateTime!);
  if (!Number.isSafeInteger(startMs) || !Number.isSafeInteger(endMs) || endMs <= startMs) {
    throw new Error('Google event has an invalid time range');
  }
  const marker = event.extendedProperties?.private?.timetreeMcpKey;
  return {
    id: event.id,
    title: event.summary ?? '(untitled)',
    startMs,
    endMs,
    allDay,
    ...(marker && sourceByMarker.has(marker) ? { sourceKey: sourceByMarker.get(marker)! } : {}),
  };
}

export function createPreviewGoogleCalendarBridgeTool(
  apiClient: TimeTreeAPIClient,
  connection: GoogleConnection,
  googleApi: Pick<GoogleCalendarApi, 'listCalendars' | 'listEvents'>,
) {
  return {
    name: 'preview_google_calendar_bridge',
    description: 'Compare TimeTree with a real, selected Google calendar and show proposed event creation ' +
      'without changing either calendar. Requires prior local Google OAuth. Reports unsupported recurring/exception/' +
      'all-day TimeTree events as blockers, and detects previous bridge writes via a private hashed marker. ' +
      'Use this before any future migration execution; ready=true is NOT permission to write.',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        calendar_id: CALENDAR_ID_JSON_SCHEMA,
        google_calendar_id: { type: 'string', description: 'Google calendar ID from list_google_calendars' },
        start_at: { type: 'number', description: 'Inclusive Unix milliseconds' },
        end_at: { type: 'number', description: 'Exclusive Unix milliseconds, maximum 366-day window' },
        privacy: { type: 'string', enum: ['full', 'busy'] },
      },
      required: ['calendar_id', 'google_calendar_id', 'start_at', 'end_at'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean' }, calendar_id: { type: 'string' },
        google_calendar_id: { type: 'string' }, google_calendar_name: { type: 'string' },
        scanned: { type: 'number' }, destination_scanned: { type: 'number' },
        unreadable: { type: 'number' }, blocked: { type: 'number' },
        blocked_event_ids: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        plan: { type: 'object' },
      },
      required: ['ready', 'calendar_id', 'google_calendar_id', 'google_calendar_name',
        'scanned', 'destination_scanned', 'unreadable', 'blocked', 'blocked_event_ids', 'warnings', 'plan'],
    },
    handler: async (args: unknown) => {
      try {
        const input = parseToolInput(PreviewGoogleBridgeInputSchema, args);
        const timeTreeId = String(input.calendar_id);
        await connection.accessToken();
        const calendars = await googleApi.listCalendars();
        const destinationCalendar = calendars.find(cal => cal.id === input.google_calendar_id);
        if (!destinationCalendar) {
          throw new InvalidArgumentError('google_calendar_id', 'Googleカレンダーが見つかりません',
            'Google calendar not found. Choose one from list_google_calendars');
        }

        const tally: SkipTally = { skipped: 0 };
        const [googleEvents, rawEvents] = await Promise.all([
          googleApi.listEvents(input.google_calendar_id, input.start_at, input.end_at),
          apiClient.getEventsByCalendar(timeTreeId, 0, tally),
        ]);
        const selected = rawEvents.filter(e =>
          !e.deactivated_at && e.category !== 2 &&
          ((e.recurrences?.length && e.start_at < input.end_at) ||
            (e.start_at >= input.start_at && e.start_at < input.end_at)));
        if (selected.length > MAX_EVENTS || googleEvents.length > MAX_EVENTS) {
          throw new InvalidArgumentError('end_at',
            '予定数が250件を超えています。期間を短くしてください',
            'More than 250 events in one calendar; use a shorter window');
        }
        const blocked = selected.filter(hasUnsafeRecurrence);
        const usable = selected.filter(e => !hasUnsafeRecurrence(e));
        const source: BridgeEvent[] = usable.map(e => ({
          id: e.uuid, calendarId: timeTreeId, title: e.title,
          startMs: e.start_at, endMs: e.end_at, allDay: false,
          ...(e.note ? { description: e.note } : {}),
        }));
        const keyByMarker = new Map<string, string>();
        for (const item of source) {
          const key = sourceKey(item);
          keyByMarker.set(googleSourceMarker(key), key);
        }
        const destination = googleEvents.map(event => toDestination(event, keyByMarker));
        const plan = planBridgeExport(source, destination, {
          sourceCalendarId: timeTreeId,
          destinationCalendarId: input.google_calendar_id,
          privacy: input.privacy,
        });
        const canWrite = destinationCalendar.accessRole === 'owner' ||
          destinationCalendar.accessRole === 'writer';
        const warnings = [
          'Read-only preview. No events were created or modified.',
          ...(!canWrite ? ['Selected Google calendar is not writable.'] : []),
          ...(blocked.length ? ['Recurring, exception and all-day TimeTree events are blocked.'] : []),
          ...(tally.skipped ? ['Some TimeTree records were unreadable; the preview is incomplete.'] : []),
          ...(plan.totals.invalid ? ['Invalid TimeTree events need review.'] : []),
        ];
        return { content: [{ type: 'text', text: JSON.stringify({
          ready: canWrite && blocked.length === 0 && tally.skipped === 0 && plan.totals.invalid === 0,
          calendar_id: timeTreeId,
          google_calendar_id: input.google_calendar_id,
          google_calendar_name: destinationCalendar.summary,
          scanned: selected.length,
          destination_scanned: googleEvents.length,
          unreadable: tally.skipped,
          blocked: blocked.length,
          blocked_event_ids: blocked.map(e => e.uuid),
          warnings, plan,
        }) }] };
      } catch (error) {
        logger.error('Tool: preview_google_calendar_bridge failed');
        return toolErrorResult(error);
      }
    },
  };
}
