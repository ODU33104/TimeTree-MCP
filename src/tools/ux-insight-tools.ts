/** Read-only insight tool adapters. The coordinator registers these after QA. */
import { z } from 'zod';
import { buildBriefing } from '../features/briefing/index.js';
import { evaluateTravelBuffers } from '../features/travel-buffer/index.js';
import { createBusyOnlyExport } from '../features/share-slots/index.js';

const iso = z.string().datetime({ offset: true });
const event = z.object({
  id: z.string().min(1),
  calendarId: z.string().min(1),
  title: z.string(),
  start: z.number().int().safe(),
  end: z.number().int().safe(),
  allDay: z.boolean().optional(),
  preparationMinutes: z.number().int().min(0).max(10080).optional(),
}).strict();
const selection = z.array(z.string().min(1)).min(1).max(100);
const briefingInput = z.object({
  calendarIds: selection,
  events: z.array(event).max(2000),
  now: z.number().int().safe(),
  timezone: z.string().min(1),
  days: z.union([z.literal(1), z.literal(7)]).optional(),
  includeTitles: z.boolean().optional(),
  includePreparation: z.boolean().optional(),
}).strict();
const travelInput = z.object({
  calendarIds: selection,
  events: z.array(z.object({
    id: z.string().min(1), calendarId: z.string().min(1),
    start: iso, end: iso, allDay: z.boolean().optional(),
  }).strict()).max(2000),
  requirements: z.array(z.object({
    fromEventId: z.string().min(1), toEventId: z.string().min(1),
    travelMinutes: z.number().int().min(0).max(10080),
    preparationMinutes: z.number().int().min(0).max(10080).optional(),
  }).strict()).max(2000),
}).strict();
const shareInput = z.object({
  calendarIds: selection,
  consent: z.literal(true),
  now: iso, expiresAt: iso, windowStart: iso, windowEnd: iso,
  busy: z.array(z.object({
    calendarId: z.string().min(1), start: iso, end: iso,
  }).strict()).max(10000),
}).strict();

function selected(ids: readonly string[], calendarId: string): boolean {
  return ids.includes(calendarId);
}
function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
function invalid() {
  return { isError: true as const, content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Invalid insight input' }) }] };
}

/** Input events must come from a trusted caller; do not let clients claim authorization by naming IDs. */
export function createInsightTools() {
  return [
    {
      name: 'preview_schedule_briefing',
      description: 'Preview a private-by-default briefing of explicitly selected calendars; no writes.',
      inputSchema: { type: 'object', additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: async (args: unknown) => {
        const parsed = briefingInput.safeParse(args);
        if (!parsed.success || parsed.data.events.some((e) => !selected(parsed.data.calendarIds, e.calendarId))) return invalid();
        try {
          const { calendarIds: _ids, ...options } = parsed.data;
          void _ids;
          return result(buildBriefing(options.events, options));
        } catch { return invalid(); }
      },
    },
    {
      name: 'preview_travel_buffers',
      description: 'Check user-provided travel durations; never infer locations or travel time.',
      inputSchema: { type: 'object', additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: async (args: unknown) => {
        const parsed = travelInput.safeParse(args);
        if (!parsed.success || parsed.data.events.some((e) => !selected(parsed.data.calendarIds, e.calendarId))) return invalid();
        try { return result({ warnings: evaluateTravelBuffers(parsed.data.events, parsed.data.requirements) }); }
        catch { return invalid(); }
      },
    },
    {
      name: 'preview_busy_only_share',
      description: 'Preview opt-in busy-only export with expiration, without titles or participants.',
      inputSchema: { type: 'object', additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: async (args: unknown) => {
        const parsed = shareInput.safeParse(args);
        if (!parsed.success || parsed.data.busy.some((e) => !selected(parsed.data.calendarIds, e.calendarId))) return invalid();
        try {
          const { calendarIds: _ids, busy, ...request } = parsed.data;
          void _ids;
          return result(createBusyOnlyExport({ ...request, busy: busy.map(({ start, end }) => ({ start, end })) }));
        } catch { return invalid(); }
      },
    },
  ];
}
