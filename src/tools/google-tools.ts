/**
 * Google Calendar MCP tools for local stdio clients. All calendar data tools
 * are read-only; OAuth setup and disconnect only change in-memory session
 * state. No write tools are exposed, even with a write-capable Google token.
 */
import { z } from 'zod';
import type { GoogleConnection } from '../bridge/google-connection.js';
import type { GoogleCalendarApi } from '../bridge/google-api.js';
import { logger } from '../utils/logger.js';
import { parseToolInput, toolErrorResult, InvalidArgumentError } from '../utils/mcp-errors.js';
import { READ_ONLY } from './shared-schemas.js';

const SESSION_CHANGE = {
  readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true,
} as const;

const EMPTY = z.object({}).strict();
const Window = z.object({
  calendar_id: z.string().trim().min(1).max(512),
  start_at: z.number().int().safe(),
  end_at: z.number().int().safe(),
  privacy: z.enum(['full', 'busy']).default('full'),
}).strict().refine(v => v.end_at > v.start_at && v.end_at - v.start_at <= 366 * 86_400_000, {
  path: ['end_at'], message: 'Invalid 366-day window',
});

const windowProperties = {
  calendar_id: { type: 'string', description: 'Google calendar ID obtained from list_google_calendars' },
  start_at: { type: 'number', description: 'Inclusive Unix milliseconds' },
  end_at: { type: 'number', description: 'Exclusive Unix milliseconds, up to 366 days' },
  privacy: { type: 'string', enum: ['full', 'busy'], description: 'Busy mode hides titles and descriptions' },
} as const;

export function createConnectGoogleCalendarTool(connection: GoogleConnection) {
  return {
    name: 'connect_google_calendar',
    description: 'Begin an opt-in, read-only Google Calendar authorization on this computer. ' +
      'Requires GOOGLE_OAUTH_CLIENT_ID in the local server environment and a browser on the same computer. ' +
      'The returned authorization URL contains no OAuth verifier or token. Never paste callback URL or code in chat. ' +
      'No Google or TimeTree calendar data is modified.',
    annotations: SESSION_CHANGE,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object',
      properties: {
        authorization_url: { type: 'string' }, expires_at: { type: 'string' },
        instruction: { type: 'string' },
      }, required: ['authorization_url', 'expires_at', 'instruction'],
    },
    handler: async (args: unknown) => {
      try {
        parseToolInput(EMPTY, args ?? {});
        const started = await connection.begin();
        return { content: [{ type: 'text', text: JSON.stringify({
          authorization_url: started.authorizationUrl,
          expires_at: new Date(started.expiresAtMs).toISOString(),
          instruction: started.notice,
        }) }] };
      } catch (error) {
        logger.error('Tool: connect_google_calendar failed');
        return toolErrorResult(error);
      }
    },
  };
}

export function createGoogleConnectionStatusTool(connection: GoogleConnection) {
  return {
    name: 'google_connection_status',
    description: 'Check the status of a local Google Calendar read-only authorization without revealing tokens or account data.',
    annotations: READ_ONLY,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object', properties: {
        configured: { type: 'boolean' }, connected: { type: 'boolean' },
        authorization_pending: { type: 'boolean' },
        expires_at: { type: ['string', 'null'] },
        granted_scopes: { type: 'array', items: { type: 'string' } },
      }, required: ['configured', 'connected', 'authorization_pending', 'expires_at', 'granted_scopes'],
    },
    handler: async (args: unknown) => {
      try {
        parseToolInput(EMPTY, args ?? {});
        const state = connection.status();
        return { content: [{ type: 'text', text: JSON.stringify({
          configured: state.configured, connected: state.connected,
          authorization_pending: state.authorizationPending,
          expires_at: state.expiresAtMs === null ? null : new Date(state.expiresAtMs).toISOString(),
          granted_scopes: state.grantedScopes,
        }) }] };
      } catch (error) {
        return toolErrorResult(error);
      }
    },
  };
}

export function createDisconnectGoogleCalendarTool(connection: GoogleConnection) {
  return {
    name: 'disconnect_google_calendar',
    description: 'Discard this MCP process\'s Google Calendar tokens and pending authorization. ' +
      'Does not modify events or revoke Google consent at the Google Account security page.',
    annotations: SESSION_CHANGE,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object', properties: { disconnected: { type: 'boolean' }, notice: { type: 'string' } },
      required: ['disconnected', 'notice'],
    },
    handler: async (args: unknown) => {
      try {
        parseToolInput(EMPTY, args ?? {});
        connection.disconnect();
        return { content: [{ type: 'text', text: JSON.stringify({
          disconnected: true,
          notice: 'In-memory Google authorization cleared. To revoke account-level consent, use Google Account settings.',
        }) }] };
      } catch (error) {
        return toolErrorResult(error);
      }
    },
  };
}

export function createListGoogleCalendarsTool(
  connection: GoogleConnection,
  googleApi: Pick<GoogleCalendarApi, 'listCalendars'>,
) {
  return {
    name: 'list_google_calendars',
    description: 'List calendars available in the connected Google account, with calendar IDs and access roles. ' +
      'Read-only. Requires connect_google_calendar and a completed local authorization.',
    annotations: READ_ONLY,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: {
      type: 'object', properties: {
        calendars: { type: 'array', items: { type: 'object', properties: {
          id: { type: 'string' }, name: { type: 'string' }, access_role: { type: 'string' },
          can_write: { type: 'boolean' }, primary: { type: 'boolean' },
          time_zone: { type: ['string', 'null'] },
        }, required: ['id', 'name', 'access_role', 'can_write', 'primary', 'time_zone'] } },
        total: { type: 'number' },
      }, required: ['calendars', 'total'],
    },
    handler: async (args: unknown) => {
      try {
        parseToolInput(EMPTY, args ?? {});
        await connection.accessToken();
        const calendars = (await googleApi.listCalendars()).map(cal => ({
          id: cal.id, name: cal.summary, access_role: cal.accessRole,
          can_write: cal.accessRole === 'owner' || cal.accessRole === 'writer',
          primary: cal.primary, time_zone: cal.timeZone ?? null,
        }));
        return { content: [{ type: 'text', text: JSON.stringify({ calendars, total: calendars.length }) }] };
      } catch (error) {
        logger.error('Tool: list_google_calendars failed');
        return toolErrorResult(error);
      }
    },
  };
}

export function createGetGoogleCalendarEventsTool(
  connection: GoogleConnection,
  googleApi: Pick<GoogleCalendarApi, 'listEvents'>,
) {
  return {
    name: 'get_google_calendar_events',
    description: 'Read Google calendar events from a bounded time window for migration review. ' +
      'All-day and recurring instance metadata is preserved; no writes. ' +
      'Privacy busy mode redacts event titles and descriptions.',
    annotations: READ_ONLY,
    inputSchema: {
      type: 'object', properties: windowProperties,
      required: ['calendar_id', 'start_at', 'end_at'], additionalProperties: false,
    },
    outputSchema: {
      type: 'object', properties: {
        calendar_id: { type: 'string' }, total: { type: 'number' },
        events: { type: 'array', items: { type: 'object', properties: {
          id: { type: 'string' }, title: { type: 'string' },
          description: { type: ['string', 'null'] },
          start: { type: 'object' }, end: { type: 'object' },
          recurring_event_id: { type: ['string', 'null'] },
          original_start_time: { type: ['object', 'null'] },
        }, required: ['id', 'title', 'description', 'start', 'end', 'recurring_event_id', 'original_start_time'] } },
      }, required: ['calendar_id', 'total', 'events'],
    },
    handler: async (args: unknown) => {
      try {
        const input = parseToolInput(Window, args);
        await connection.accessToken();
        const events = await googleApi.listEvents(input.calendar_id, input.start_at, input.end_at);
        if (events.length > 250) {
          throw new InvalidArgumentError('end_at', '予定が250件を超えます。期間を短くしてください',
            'More than 250 events; shorten the requested window');
        }
        const normalized = events.map(event => {
          if (!event.start || !event.end) {
            throw new Error('Google returned an event without a time range');
          }
          return {
            id: event.id,
            title: input.privacy === 'busy' ? 'Busy' : event.summary ?? '(untitled)',
            description: input.privacy === 'busy' ? null : event.description ?? null,
            start: event.start, end: event.end,
            recurring_event_id: event.recurringEventId ?? null,
            original_start_time: event.originalStartTime ?? null,
          };
        });
        return { content: [{ type: 'text', text: JSON.stringify({
          calendar_id: input.calendar_id, total: normalized.length, events: normalized,
        }) }] };
      } catch (error) {
        logger.error('Tool: get_google_calendar_events failed');
        return toolErrorResult(error);
      }
    },
  };
}
