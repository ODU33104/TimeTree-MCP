/**
 * Read-only MCP adapters for already-implemented planning features.
 * No secret handling and no calendar mutations. Unrecognized recurrence rules fail closed.
 */
import { z } from 'zod';
import type { TimeTreeAPIClient } from '../client/api.js';
import { expandRecurrence, parseRecurrence } from '../utils/recurrence.js';
import { safeToolErrorResult } from '../utils/mcp-errors.js';
import { searchEvents, type SearchEvent } from '../features/search/index.js';
import { findAvailableSlots, type BusyEvent as SlotBusyEvent } from '../features/availability/index.js';
import { findConflicts, type BusyEvent as ConflictBusyEvent } from '../features/conflicts/index.js';
import { CALENDAR_ID_JSON_SCHEMA, CalendarIdSchema, READ_ONLY } from './shared-schemas.js';

const DateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i);
const CalendarIds = z.array(CalendarIdSchema).min(1).max(5);
const Window = z.object({
  calendar_ids: CalendarIds,
  start: DateTime,
  end: DateTime,
}).strict();

const WindowProperties = {
  calendar_ids: { type: 'array', items: CALENDAR_ID_JSON_SCHEMA, minItems: 1, maxItems: 5 },
  start: { type: 'string', description: 'ISO timestamp including Z or an explicit numeric timezone offset' },
  end: { type: 'string', description: 'Exclusive ISO timestamp including Z or an explicit numeric timezone offset' },
} as const;

interface WindowInput { calendar_ids: number[]; start: string; end: string }
type CalendarOccurrence = SearchEvent & { all_day: boolean };

function checkWindow(input: WindowInput): { from: number; to: number } {
  const from = Date.parse(input.start);
  const to = Date.parse(input.end);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from ||
      to - from > 31 * 24 * 60 * 60 * 1000) {
    throw new Error('Invalid or excessive request window');
  }
  return { from, to };
}

/** Bound the data we hand to the pure planning functions. Fetch only explicitly selected calendars. */
async function readOccurrences(apiClient: TimeTreeAPIClient, input: WindowInput): Promise<CalendarOccurrence[]> {
  const { from, to } = checkWindow(input);
  const rows: CalendarOccurrence[] = [];
  for (const id of input.calendar_ids) {
    const events = await apiClient.getEventsByCalendar(String(id), 0);
    for (const event of events) {
      if (event.category === 2 || event.deactivated_at) continue;
      const duration = event.end_at - event.start_at;
      if (!Number.isSafeInteger(event.start_at) || !Number.isSafeInteger(duration) || duration <= 0) {
        throw new Error('Invalid event interval');
      }
      const recurrence = parseRecurrence(event.recurrences);
      if (event.recurrences?.length && !recurrence) {
        throw new Error('Unsupported recurrence rule; cannot safely calculate calendar availability');
      }
      let starts: number[];
      if (recurrence) {
        const result = expandRecurrence(recurrence, {
          start: event.start_at,
          timeZone: event.start_timezone,
          windowStart: from - duration,
          windowEnd: to,
          maxOccurrences: 1000,
        });
        if (result.truncated) throw new Error('Recurrence expansion incomplete');
        starts = result.occurrences;
      } else {
        starts = [event.start_at];
      }
      for (const at of starts) {
        if (at >= to || at + duration <= from) continue;
        rows.push({
          uuid: event.uuid, calendar_id: String(id), title: event.title,
          start_at: at, end_at: at + duration, note: event.note, all_day: event.all_day,
        });
        if (rows.length > 5000) throw new Error('Too many calendar occurrences');
      }
    }
  }
  return rows;
}

function asText(data: object) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }] };
}

export function createSearchAcrossCalendarsTool(apiClient: TimeTreeAPIClient) {
  const Input = Window.extend({
    keyword: z.string().max(200).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    offset: z.number().int().nonnegative().safe().optional(),
  });
  return {
    name: 'search_events_across_calendars',
    description: 'Search your explicitly selected TimeTree calendars by date, keyword and page. ' +
      '読み取り専用。検索対象カレンダーを明示してください。繰り返し予定の行は同じuuidを共有します。',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        ...WindowProperties,
        keyword: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
      },
      required: ['calendar_ids', 'start', 'end'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        events: { type: 'array', items: { type: 'object', properties: {
          uuid: {type:'string'}, calendar_id: {type:['number','string']},
          title: {type:'string'}, start_at: {type:'string'}, end_at: {type:'string'}, all_day: {type:'boolean'},
        }, required: ['uuid','calendar_id','title','start_at','end_at','all_day'] } },
        total: {type:'integer'}, next_offset: {type:['integer','null']},
      },
      required: ['events','total','next_offset'],
    },
    handler: async (args: unknown) => {
      try {
        const input = Input.parse(args);
        const rows = await readOccurrences(apiClient, input);
        const page = searchEvents(rows, { start: input.start, end: input.end,
          keyword: input.keyword, limit: input.limit, offset: input.offset });
        return asText({
          events: page.events.map(e => ({
            uuid: e.uuid, calendar_id: e.calendar_id, title: e.title,
            start_at: new Date(Number(e.start_at)).toISOString(),
            end_at: new Date(Number(e.end_at)).toISOString(), all_day: Boolean(e.all_day),
          })),
          total: page.total, next_offset: page.nextOffset,
        });
      } catch {
        return safeToolErrorResult();
      }
    },
  };
}

export function createFindAvailableSlotsTool(apiClient: TimeTreeAPIClient) {
  const Input = Window.extend({
    duration_minutes: z.number().int().min(1).max(1440),
    time_zone: z.string().min(1).max(100),
    step_minutes: z.number().int().min(1).max(1440).optional(),
    working_hours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }).strict().optional(),
  });
  return {
    name: 'find_available_slots',
    description: 'Read-only free/busy slot suggestions across selected calendars. ' +
      '空き時間の候補を計算します。予定タイトルは出力しません。タイムゾーンと所要時間を指定してください。',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        ...WindowProperties,
        duration_minutes: {type:'integer', minimum:1, maximum:1440},
        time_zone: {type:'string', description:'IANA timezone (e.g. Asia/Tokyo)'},
        step_minutes: {type:'integer', minimum:1, maximum:1440},
        working_hours: {type:'object', properties:{
          start: {type:'string', description:'HH:mm'}, end:{type:'string', description:'HH:mm'},
        }, required:['start','end'], additionalProperties:false},
      },
      required:['calendar_ids','start','end','duration_minutes','time_zone'],
      additionalProperties:false,
    },
    outputSchema: {
      type:'object',
      properties: {
        slots: {type:'array', items:{type:'object',properties:{
          start:{type:'string'},end:{type:'string'},
        },required:['start','end']}},
        total:{type:'integer'},
      },
      required:['slots','total'],
    },
    handler: async (args: unknown) => {
      try {
        const input = Input.parse(args);
        const occurrences = await readOccurrences(apiClient, input);
        const busy: SlotBusyEvent[] = occurrences.map(e => ({
          start: new Date(Number(e.start_at)).toISOString(),
          end: new Date(Number(e.end_at)).toISOString(),
          calendarId: String(e.calendar_id),
        }));
        const slots = findAvailableSlots(busy, {
          start: input.start, end: input.end,
          calendarIds: input.calendar_ids.map(String),
          durationMinutes: input.duration_minutes, stepMinutes: input.step_minutes,
          timeZone: input.time_zone, workingHours: input.working_hours,
        });
        if (slots.length > 5000) throw new Error('Too many slots');
        return asText({ slots, total: slots.length });
      } catch {
        return safeToolErrorResult();
      }
    },
  };
}

export function createDetectEventConflictsTool(apiClient: TimeTreeAPIClient) {
  return {
    name: 'detect_event_conflicts',
    description: 'Read-only overlap detection for events in the selected calendars. ' +
      '予定の重なりを検出します。カレンダーや予定は変更しません。',
    annotations: READ_ONLY,
    inputSchema: { type:'object', properties: WindowProperties,
      required:['calendar_ids','start','end'], additionalProperties:false },
    outputSchema: {type:'object', properties:{
      conflicts:{type:'array',items:{type:'object',properties:{
        first_id:{type:'string'},first_calendar_id:{type:'string'},
        second_id:{type:'string'},second_calendar_id:{type:'string'},
        overlap_start:{type:'string'},overlap_end:{type:'string'},
      },required:['first_id','first_calendar_id','second_id','second_calendar_id','overlap_start','overlap_end']}},
      total:{type:'integer'},
    },required:['conflicts','total']},
    handler: async (args: unknown) => {
      try {
        const input = Window.parse(args);
        const occurrences = await readOccurrences(apiClient, input);
        const busy: ConflictBusyEvent[] = occurrences.map(e => ({
          id: e.uuid + '@' + String(e.start_at), calendarId: String(e.calendar_id),
          start: Number(e.start_at), end: Number(e.end_at), allDay: e.all_day,
        }));
        const conflicts = findConflicts(busy);
        if (conflicts.length > 5000) throw new Error('Too many conflicts');
        return asText({
          conflicts: conflicts.map(c => ({
            first_id:c.first.id,first_calendar_id:c.first.calendarId,
            second_id:c.second.id,second_calendar_id:c.second.calendarId,
            overlap_start:new Date(c.overlapStart).toISOString(),
            overlap_end:new Date(c.overlapEnd).toISOString(),
          })),
          total: conflicts.length,
        });
      } catch {
        return safeToolErrorResult();
      }
    },
  };
}
