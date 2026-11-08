/**
 * Provider-neutral caller supplies a Google OAuth access token. This adapter
 * never stores tokens, opens a browser, or imports MCP/UI code.
 *
 * Google Calendar REST API is public and documented; TimeTree remains an
 * independent, unofficial web endpoint client elsewhere in the project.
 */
import { createHash } from 'node:crypto';

export type GoogleCalendarRef = {
  id: string;
  summary: string;
  accessRole: string;
  primary: boolean;
  timeZone?: string;
};

export type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  status?: string;
  etag?: string;
  recurringEventId?: string;
  originalStartTime?: { date?: string; dateTime?: string };
  extendedProperties?: { private?: Record<string, string> };
};

export type GoogleFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export class GoogleApiError extends Error {
  constructor(readonly status: number) {
    super('Google Calendar request failed with HTTP ' + status);
    this.name = 'GoogleApiError';
  }
}

export class GoogleWriteUncertainError extends Error {
  constructor() {
    super('Google write outcome is uncertain. Reconcile the destination before retrying.');
    this.name = 'GoogleWriteUncertainError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid Google ' + label);
  return value;
}

function asItems(json: unknown): { items: unknown[]; nextPageToken?: string } {
  if (!isRecord(json) || (json.items !== undefined && !Array.isArray(json.items))) throw new Error('Invalid Google list response');
  if (json.nextPageToken !== undefined && typeof json.nextPageToken !== 'string') {
    throw new Error('Invalid Google pagination cursor');
  }
  return { items: (json.items ?? []) as unknown[], nextPageToken: json.nextPageToken as string | undefined };
}

function normalizeEvent(value: unknown): GoogleEvent {
  if (!isRecord(value)) throw new Error('Invalid Google event');
  const id = requireString(value.id, 'event id');
  if (value.summary !== undefined && typeof value.summary !== 'string') throw new Error('Invalid Google event summary');
  if (value.status !== undefined && typeof value.status !== 'string') throw new Error('Invalid Google event status');
  return value as GoogleEvent & { id: string };
}

export function googleSourceMarker(sourceKey: string): string {
  requireString(sourceKey, 'source identity');
  return createHash('sha256').update(sourceKey).digest('hex');
}

export class GoogleCalendarApi {
  private readonly fetcher: GoogleFetch;
  private readonly allowWrites: boolean;

  constructor(
    private readonly accessToken: () => Promise<string> | string,
    opts: { fetcher?: GoogleFetch; allowWrites?: boolean } = {},
  ) {
    this.fetcher = opts.fetcher ?? ((url, init) => fetch(url, init));
    this.allowWrites = opts.allowWrites === true;
  }

  private async request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
    const token = requireString(await this.accessToken(), 'access token');
    const headers: Record<string, string> = {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json',
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let response: Awaited<ReturnType<GoogleFetch>>;
    try {
      response = await this.fetcher('https://www.googleapis.com/calendar/v3/' + path, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      // A failed POST may have succeeded upstream. Do not blindly retry it.
      if (method !== 'GET') throw new GoogleWriteUncertainError();
      throw new Error('Google Calendar network request failed');
    }
    if (!response.ok) throw new GoogleApiError(response.status);
    try {
      return await response.json();
    } catch {
      if (method !== 'GET') throw new GoogleWriteUncertainError();
      throw new Error('Google Calendar returned invalid JSON');
    }
  }

  private async pages(path: string, limit: number): Promise<unknown[]> {
    const all: unknown[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const connector = path.includes('?') ? '&' : '?';
      const json = await this.request(path + (cursor ? connector + 'pageToken=' + encodeURIComponent(cursor) : ''));
      const data = asItems(json);
      all.push(...data.items);
      if (all.length > limit) throw new Error('Google result set exceeds the safety limit');
      if (!data.nextPageToken) return all;
      if (seen.has(data.nextPageToken)) throw new Error('Google pagination cursor loop');
      seen.add(data.nextPageToken);
      cursor = data.nextPageToken;
    }
    throw new Error('Google result pagination incomplete');
  }

  async listCalendars(): Promise<GoogleCalendarRef[]> {
    const items = await this.pages('users/me/calendarList?maxResults=250', 2000);
    const seen = new Set<string>();
    return items.map(value => {
      if (!isRecord(value)) throw new Error('Invalid Google calendar');
      const id = requireString(value.id, 'calendar id');
      if (seen.has(id)) throw new Error('Duplicate Google calendar id');
      seen.add(id);
      return {
        id,
        summary: requireString(value.summary, 'calendar summary'),
        accessRole: requireString(value.accessRole, 'calendar access'),
        primary: value.primary === true,
        ...(typeof value.timeZone === 'string' ? { timeZone: value.timeZone } : {}),
      };
    });
  }

  /** Expands Google recurring instances; caller must preserve originalStartTime. */
  async listEvents(calendarId: string, fromMs: number, toMs: number): Promise<GoogleEvent[]> {
    requireString(calendarId, 'calendar id');
    if (!Number.isSafeInteger(fromMs) || !Number.isSafeInteger(toMs) ||
      toMs <= fromMs || toMs - fromMs > 366 * 86_400_000) {
      throw new Error('Invalid Google event window');
    }
    const params = new URLSearchParams({
      timeMin: new Date(fromMs).toISOString(),
      timeMax: new Date(toMs).toISOString(),
      maxResults: '2500',
      singleEvents: 'true',
      showDeleted: 'false',
    });
    const items = await this.pages('calendars/' + encodeURIComponent(calendarId) + '/events?' + params, 5000);
    return items.map(normalizeEvent).filter(item => item.status !== 'cancelled');
  }

  /** Look up an event created by this bridge using a hashed private property. */
  async findBySourceKey(calendarId: string, sourceKey: string): Promise<GoogleEvent[]> {
    requireString(calendarId, 'calendar id');
    const params = new URLSearchParams({
      privateExtendedProperty: 'timetreeMcpKey=' + googleSourceMarker(sourceKey),
      maxResults: '2500',
      showDeleted: 'false',
    });
    const items = await this.pages('calendars/' + encodeURIComponent(calendarId) + '/events?' + params, 2500);
    return items.map(normalizeEvent).filter(item => item.status !== 'cancelled');
  }

  /**
   * No implicit writes. The call must explicitly opt in twice.
   * A timed non-recurring event is required; all-day and recurrence need a
   * separate transformation design before being enabled.
   */
  async createTimedEvent(
    calendarId: string,
    sourceKey: string,
    event: { summary: string; description?: string; startMs: number; endMs: number },
    confirmed: true,
  ): Promise<{ created: boolean; event: GoogleEvent }> {
    if (!this.allowWrites || confirmed !== true) throw new Error('Google writes are disabled');
    requireString(calendarId, 'calendar id');
    requireString(sourceKey, 'source identity');
    if (!Number.isSafeInteger(event.startMs) || !Number.isSafeInteger(event.endMs) ||
      event.endMs <= event.startMs || !event.summary.trim() || event.summary.length > 1024) {
      throw new Error('Invalid Google event input');
    }
    const found = await this.findBySourceKey(calendarId, sourceKey);
    if (found.length > 1) throw new Error('Multiple matching Google events require manual reconciliation');
    if (found.length === 1) return { created: false, event: found[0] };
    const body = {
      summary: event.summary,
      ...(event.description ? { description: event.description } : {}),
      start: { dateTime: new Date(event.startMs).toISOString() },
      end: { dateTime: new Date(event.endMs).toISOString() },
      extendedProperties: { private: { timetreeMcpKey: googleSourceMarker(sourceKey) } },
    };
    const json = await this.request('calendars/' + encodeURIComponent(calendarId) + '/events', 'POST', body);
    return { created: true, event: normalizeEvent(json) };
  }
}
