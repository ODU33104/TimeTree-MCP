import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleCalendarApi, GoogleApiError, GoogleWriteUncertainError, googleSourceMarker } from '../.test-dist/bridge/google-api.js';

const ok = json => ({ ok: true, status: 200, json: async () => json });
const calendar = { id: 'family@example.com', summary: 'Family', accessRole: 'owner', primary: true };
const googleEvent = { id: 'google-event-1', summary: 'Doctor', start: { dateTime: '2026-11-10T09:00:00Z' }, end: { dateTime: '2026-11-10T10:00:00Z' } };

test('lists paginated Google calendars with bearer authentication and no added dependencies', async () => {
  const urls = [];
  const headers = [];
  const api = new GoogleCalendarApi(() => 'fake-secret', { fetcher: async (url, opts) => {
    urls.push(url);
    headers.push(opts.headers);
    return ok(urls.length === 1
      ? { items: [calendar], nextPageToken: 'cursor token' }
      : { items: [{ id: 'work@example.com', summary: 'Work', accessRole: 'reader' }] });
  } });
  const result = await api.listCalendars();
  assert.equal(result.length, 2);
  assert.equal(result[0].primary, true);
  assert.match(urls[1], /pageToken=cursor%20token/);
  assert.equal(headers[0].Authorization, 'Bearer fake-secret');
});

test('accepts an empty Google calendar list', async () => {
  const api = new GoogleCalendarApi(() => 'fake', { fetcher: async () => ok({}) });
  assert.deepEqual(await api.listCalendars(), []);
});

test('lists calendar events with timezone-safe UTC range and instance expansion', async () => {
  let url;
  const api = new GoogleCalendarApi(() => 'fake', { fetcher: async nextUrl => {
    url = new URL(nextUrl);
    return ok({ items: [googleEvent] });
  } });
  const from = Date.parse('2026-11-10T00:00:00Z');
  const to = Date.parse('2026-11-11T00:00:00Z');
  assert.equal((await api.listEvents('family@example.com', from, to))[0].id, 'google-event-1');
  assert.equal(url.searchParams.get('singleEvents'), 'true');
  assert.equal(url.searchParams.get('timeMin'), new Date(from).toISOString());
  assert.equal(url.pathname, '/calendar/v3/calendars/family%40example.com/events');
});

test('rejects invalid windows and calendar IDs before any request', async () => {
  let calls = 0;
  const api = new GoogleCalendarApi(() => 'fake', { fetcher: async () => { calls++; return ok({ items: [] }); } });
  await assert.rejects(() => api.listEvents('x', 1000, 1000));
  await assert.rejects(() => api.listEvents('', 1000, 2000));
  assert.equal(calls, 0);
});

test('write capability defaults to disabled and confirmed is required', async () => {
  let calls = 0;
  const api = new GoogleCalendarApi(() => 'fake', { fetcher: async () => { calls++; return ok({items: []}); } });
  const payload = { summary: 'Dinner', startMs: 1000, endMs: 2000 };
  await assert.rejects(() => api.createTimedEvent('cal', 'source', payload, true), /disabled/);
  assert.equal(calls, 0);
  const writable = new GoogleCalendarApi(() => 'fake', {
    allowWrites: true, fetcher: async () => { calls++; return ok({ items: [] }); },
  });
  await assert.rejects(() => writable.createTimedEvent('cal', 'source', payload, false), /disabled/);
  assert.equal(calls, 0);
});

test('finds an existing source marker before attempting to write', async () => {
  let calls = 0;
  const api = new GoogleCalendarApi(() => 'fake', {
    allowWrites: true,
    fetcher: async (url, init) => {
      calls++;
      assert.equal(init.method, 'GET');
      assert.match(url, /privateExtendedProperty=/);
      return ok({ items: [googleEvent] });
    },
  });
  const result = await api.createTimedEvent('cal', '["a","b"]', { summary: 'Dinner', startMs: 1000, endMs: 2000 }, true);
  assert.equal(result.created, false);
  assert.equal(calls, 1);
});

test('confirmed write attaches hashed private source identity, not raw event IDs', async () => {
  const sourceKey = '["private-calendar","event-1"]';
  let posted;
  const api = new GoogleCalendarApi(() => 'fake', {
    allowWrites: true,
    fetcher: async (_url, init) => {
      if (init.method === 'GET') return ok({ items: [] });
      posted = JSON.parse(init.body);
      return ok(googleEvent);
    },
  });
  const result = await api.createTimedEvent('cal', sourceKey,
    { summary: 'Dinner', startMs: 1000, endMs: 2000 }, true);
  assert.equal(result.created, true);
  assert.equal(posted.extendedProperties.private.timetreeMcpKey, googleSourceMarker(sourceKey));
  assert.equal(JSON.stringify(posted).includes(sourceKey), false);
});

test('an uncertain write is not retried', async () => {
  let posts = 0;
  const api = new GoogleCalendarApi(() => 'fake', {
    allowWrites: true,
    fetcher: async (_url, init) => {
      if (init.method === 'GET') return ok({ items: [] });
      posts++;
      throw new Error('secret internal provider details');
    },
  });
  await assert.rejects(() => api.createTimedEvent('cal', 'source',
    { summary: 'Dinner', startMs: 1000, endMs: 2000 }, true),
  e => e instanceof GoogleWriteUncertainError && !e.message.includes('secret'));
  assert.equal(posts, 1);
});

test('provider errors are status-only and cannot leak OAuth credentials', async () => {
  const api = new GoogleCalendarApi(() => 'secret-token', {
    fetcher: async () => ({ ok: false, status: 401, json: async () => ({ error: 'secret-token' }) }),
  });
  await assert.rejects(() => api.listCalendars(),
    e => e instanceof GoogleApiError && e.status === 401 && !e.message.includes('secret-token'));
});

test('detects pagination cursor loops instead of returning incomplete snapshots', async () => {
  const api = new GoogleCalendarApi(() => 'fake', { fetcher: async () => ok({
    items: [calendar], nextPageToken: 'same',
  }) });
  await assert.rejects(() => api.listCalendars(), /cursor loop/);
});
