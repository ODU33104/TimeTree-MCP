import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createConnectGoogleCalendarTool, createGoogleConnectionStatusTool,
  createListGoogleCalendarsTool, createGetGoogleCalendarEventsTool,
  createDisconnectGoogleCalendarTool,
} from '../.test-dist/tools/google-tools.js';
import { isToolAllowed } from '../.test-dist/utils/tool-access.js';

const start = Date.parse('2026-11-10T00:00:00Z');
const end = Date.parse('2026-11-11T00:00:00Z');
const calls = [];
function makeConnection() {
  return {
    begin: async () => ({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?synthetic=1',
      expiresAtMs: Date.now() + 300_000,
      notice: 'Use the browser on the same computer',
    }),
    status: () => ({ configured: true, connected: true, authorizationPending: false,
      expiresAtMs: Date.now() + 300_000, grantedScopes: ['read-only'] }),
    accessToken: async () => { calls.push('accessToken'); return 'secret'; },
    disconnect: () => { calls.push('disconnect'); },
  };
}
const connection = makeConnection();
const google = {
  listCalendars: async () => [
    { id: 'google-owner', summary: 'Family', accessRole: 'owner', primary: true, timeZone: 'Asia/Tokyo' },
    { id: 'google-read', summary: 'Imported', accessRole: 'reader', primary: false },
  ],
  listEvents: async () => [{
    id: 'g1', summary: 'Private title', description: 'Private body',
    start: { dateTime: '2026-11-10T09:00:00Z' },
    end: { dateTime: '2026-11-10T10:00:00Z' },
  }],
};

test('connection initiation returns only an authorization URL and instructions', async () => {
  const result = await createConnectGoogleCalendarTool(connection).handler({});
  const data = JSON.parse(result.content[0].text);
  assert.ok(data.authorization_url.startsWith('https://accounts.google.com/'));
  assert.ok(data.expires_at);
  assert.doesNotMatch(JSON.stringify(data), /secret|code_verifier|refresh_token/);
});

test('status tool never returns access tokens', async () => {
  const data = JSON.parse((await createGoogleConnectionStatusTool(connection).handler({})).content[0].text);
  assert.equal(data.configured, true);
  assert.equal(data.connected, true);
  assert.deepEqual(data.granted_scopes, ['read-only']);
  assert.equal('accessToken' in data, false);
});

test('Google calendars return writable role without credentials', async () => {
  const result = await createListGoogleCalendarsTool(connection, google).handler({});
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.total, 2);
  assert.equal(data.calendars[0].can_write, true);
  assert.equal(data.calendars[1].can_write, false);
  assert.equal(data.calendars[1].time_zone, null);
  assert.equal(JSON.stringify(data).includes('secret'), false);
});

test('busy mode redacts private titles and descriptions', async () => {
  const result = await createGetGoogleCalendarEventsTool(connection, google).handler({
    calendar_id: 'google-owner', start_at: start, end_at: end, privacy: 'busy',
  });
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.events[0].title, 'Busy');
  assert.equal(data.events[0].description, null);
  assert.doesNotMatch(JSON.stringify(data), /Private title|Private body|secret/);
});

test('rejects invalid Google read windows before touching the API', async () => {
  let providerCalls = 0;
  const provider = { listEvents: async () => { providerCalls++; return []; } };
  const result = await createGetGoogleCalendarEventsTool(connection, provider).handler({
    calendar_id: 'google-owner', start_at: end, end_at: start,
  });
  assert.equal(result.isError, true);
  assert.equal(providerCalls, 0);
});

test('Google session disconnect tool drops process-local authorization', async () => {
  const result = await createDisconnectGoogleCalendarTool(connection).handler({});
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.disconnected, true);
  assert.ok(calls.includes('disconnect'));
});

test('local Google connection tools are allowed in read-only calendar mode', () => {
  for (const name of [
    'connect_google_calendar', 'google_connection_status',
    'list_google_calendars', 'get_google_calendar_events', 'disconnect_google_calendar',
    'preview_google_calendar_bridge',
  ]) assert.equal(isToolAllowed(name, true), true);
  assert.equal(isToolAllowed('create_event', true), false);
});
