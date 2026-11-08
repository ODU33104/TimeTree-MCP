import test from 'node:test';
import assert from 'node:assert/strict';
import {
  startGoogleOAuth, completeGoogleOAuth, refreshGoogleOAuth,
  GOOGLE_CALENDAR_LIST_SCOPE, GOOGLE_EVENTS_READ_SCOPE, GOOGLE_EVENTS_WRITE_SCOPE,
} from '../.test-dist/bridge/google-oauth.js';

const tokens = { access_token: 'fake-access-token', refresh_token: 'fake-refresh-token', expires_in: 3600, scope: GOOGLE_EVENTS_READ_SCOPE };

test('OAuth desktop flow uses PKCE S256 and a random anti-CSRF state', () => {
  const a = startGoogleOAuth('fake-client-id', 'http://127.0.0.1:8765/oauth/callback');
  const b = startGoogleOAuth('fake-client-id', 'http://127.0.0.1:8765/oauth/callback');
  const url = new URL(a.authorizationUrl);
  assert.equal(url.host, 'accounts.google.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('state'), a.state);
  assert.ok(url.searchParams.get('scope').includes(GOOGLE_CALENDAR_LIST_SCOPE));
  assert.ok(url.searchParams.get('scope').includes(GOOGLE_EVENTS_READ_SCOPE));
  assert.notEqual(a.state, b.state);
  assert.notEqual(a.codeVerifier, b.codeVerifier);
  assert.equal(url.searchParams.has('code_verifier'), false);
});

test('OAuth refuses non-loopback redirects and arbitrary privilege scopes', () => {
  for (const redirect of [
    'https://evil.example/callback', 'http://10.0.0.1:8765/callback',
    'http://127.0.0.1:80/callback', 'http://127.0.0.1:8765/callback?token=1',
  ]) assert.throws(() => startGoogleOAuth('fake-client', redirect), /loopback/);
  assert.throws(() => startGoogleOAuth('fake-client', 'http://127.0.0.1:8765/', ['https://www.googleapis.com/auth/drive']), /scope/);
});

test('OAuth callback checks state before any token request', async () => {
  const attempt = startGoogleOAuth('fake-client', 'http://127.0.0.1:8765/');
  let calls = 0;
  await assert.rejects(() => completeGoogleOAuth(attempt, 'authorization-code', 'bad-state', {
    fetcher: async () => { calls++; throw new Error('should not run'); },
  }), /state mismatch/);
  assert.equal(calls, 0);
});

test('OAuth code exchange sends client ID and verifier without logging secrets', async () => {
  const attempt = startGoogleOAuth('fake-client', 'http://127.0.0.1:8765/', [GOOGLE_EVENTS_WRITE_SCOPE]);
  let url;
  let body;
  const response = await completeGoogleOAuth(attempt, 'authorization-code', attempt.state, {
    fetcher: async (next, init) => {
      url = next; body = new URLSearchParams(init.body);
      return { ok: true, status: 200, json: async () => tokens };
    },
  });
  assert.equal(url, 'https://oauth2.googleapis.com/token');
  assert.equal(body.get('code_verifier'), attempt.codeVerifier);
  assert.equal(body.get('client_id'), 'fake-client');
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(response.refreshToken, 'fake-refresh-token');
  assert.ok(response.expiresAtMs > Date.now());
});

test('refresh uses a refresh token and preserves privacy on errors', async () => {
  let body;
  await refreshGoogleOAuth('fake-client', 'fake-refresh-token', {
    fetcher: async (_url, init) => {
      body = new URLSearchParams(init.body);
      return { ok: true, status: 200, json: async () => ({ access_token: 'new', expires_in: 3600 }) };
    },
  });
  assert.equal(body.get('grant_type'), 'refresh_token');
  assert.equal(body.get('refresh_token'), 'fake-refresh-token');
  await assert.rejects(() => refreshGoogleOAuth('fake-client', 'secret', {
    fetcher: async () => ({ ok: false, status: 400, json: async () => ({ error: 'secret' }) }),
  }), error => !error.message.includes('secret'));
});

test('invalid Google OAuth token responses are rejected', async () => {
  const attempt = startGoogleOAuth('fake-client', 'http://localhost:8765/');
  await assert.rejects(() => completeGoogleOAuth(attempt, 'code', attempt.state, {
    fetcher: async () => ({ ok: true, status: 200, json: async () => ({ access_token: 'a', expires_in: -1 }) }),
  }), /expiry/);
});
