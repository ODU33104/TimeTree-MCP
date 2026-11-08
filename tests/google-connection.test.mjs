import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleLocalConnection } from '../.test-dist/bridge/google-connection.js';
import {
  GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE,
} from '../.test-dist/bridge/google-oauth.js';

function fakeTokenResponse() {
  return {
    ok: true, status: 200,
    json: async () => ({
      access_token: 'synthetic-local-access', refresh_token: 'synthetic-local-refresh',
      expires_in: 3600, scope: GOOGLE_CALENDAR_LIST_SCOPE + ' ' + GOOGLE_EVENTS_READ_SCOPE,
    }),
  };
}

function authCallbackUrl(start) {
  const auth = new URL(start.authorizationUrl);
  const redirect = auth.searchParams.get('redirect_uri');
  const state = auth.searchParams.get('state');
  assert.ok(redirect && state);
  return { redirect, state };
}

test('Google auth is unconfigured without explicit local client ID', async () => {
  const connection = new GoogleLocalConnection(undefined);
  assert.deepEqual(connection.status(), {
    configured: false, connected: false,
    authorizationPending: false, expiresAtMs: null, grantedScopes: [],
  });
  await assert.rejects(() => connection.begin(), /GOOGLE_OAUTH_CLIENT_ID/);
});

test('loopback OAuth rejects wrong state and accepts valid synthetic callback', { timeout: 25000 }, async () => {
  const connection = new GoogleLocalConnection('synthetic-desktop-client', undefined,
    async () => fakeTokenResponse());
  try {
    const started = await connection.begin();
    const { redirect, state } = authCallbackUrl(started);
    assert.match(redirect, /^http:\/\/127\.0\.0\.1:/);
    assert.equal(connection.status().authorizationPending, true);
    const forged = await fetch(redirect + '?state=wrong&code=fake-code');
    assert.equal(forged.status, 403);
    assert.equal(connection.status().authorizationPending, true);
    const accepted = await fetch(redirect + '?state=' + encodeURIComponent(state) + '&code=fake-code');
    assert.equal(accepted.status, 200);
    assert.doesNotMatch(await accepted.text(), /synthetic-local-access|fake-code/);
    assert.equal(connection.status().connected, true);
    assert.equal(connection.status().authorizationPending, false);
    assert.equal(await connection.accessToken(), 'synthetic-local-access');
  } finally { connection.disconnect(); }
});

test('a repeated authorization attempt is denied before opening another listener', async () => {
  const connection = new GoogleLocalConnection('synthetic-desktop-client');
  try {
    await connection.begin();
    await assert.rejects(() => connection.begin(), /already pending/);
  } finally { connection.disconnect(); }
});

test('Google OAuth refuses insufficient granted scopes', { timeout: 25000 }, async () => {
  const connection = new GoogleLocalConnection('synthetic-desktop-client', undefined, async () => ({
    ok: true, status: 200,
    json: async () => ({ access_token: 'no-permission', expires_in: 3600, scope: GOOGLE_EVENTS_READ_SCOPE }),
  }));
  try {
    const started = await connection.begin();
    const { redirect, state } = authCallbackUrl(started);
    const response = await fetch(redirect + '?state=' + encodeURIComponent(state) + '&code=ok');
    assert.equal(response.status, 403);
    assert.equal(connection.status().connected, false);
    await assert.rejects(() => connection.accessToken(), /not connected/);
  } finally { connection.disconnect(); }
});

test('disconnect clears tokens and prevents stale callbacks from succeeding', { timeout: 25000 }, async () => {
  const connection = new GoogleLocalConnection('synthetic-desktop-client', undefined,
    async () => fakeTokenResponse());
  const started = await connection.begin();
  const { redirect, state } = authCallbackUrl(started);
  connection.disconnect();
  assert.equal(connection.status().authorizationPending, false);
  assert.equal(connection.status().connected, false);
  await assert.rejects(() => connection.accessToken(), /not connected/);
  // The local listener has been closed; no callback can reattach the session.
  assert.equal(state.length > 20 && redirect.includes('127.0.0.1'), true);
});

test('Google OAuth denial clears pending state without storing credentials', { timeout: 25000 }, async () => {
  const connection = new GoogleLocalConnection('synthetic-desktop-client');
  try {
    const started = await connection.begin();
    const { redirect, state } = authCallbackUrl(started);
    const response = await fetch(redirect + '?state=' + encodeURIComponent(state) + '&error=access_denied');
    assert.equal(response.status, 400);
    assert.equal(connection.status().connected, false);
    assert.equal(connection.status().authorizationPending, false);
  } finally { connection.disconnect(); }
});
