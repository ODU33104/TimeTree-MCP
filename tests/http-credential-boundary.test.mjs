import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../.test-dist/utils/http-client.js';

test('authenticated HTTP client blocks unexpected origins before fetch', async () => {
  const client = new HttpClient();
  client.setSessionCookie('sensitive-session');
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('should not fetch'); };
  try {
    for (const url of [
      'https://evil.example/api',
      'http://timetreeapp.com/api/v1/calendars',
      'https://timetreeapp.com.evil.example/api',
      'https://user:password@timetreeapp.com/api',
    ]) {
      await assert.rejects(client.get(url), /untrusted TimeTree API origin/);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('authenticated requests reject redirects and keep credentials on TimeTree origin', async () => {
  const client = new HttpClient();
  client.setSessionCookie('sensitive-session');
  const originalFetch = globalThis.fetch;
  let observed;
  globalThis.fetch = async (url, options) => {
    observed = { url, options };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    assert.deepEqual(await client.get('https://timetreeapp.com/api/v1/calendars'), { ok: true });
    assert.equal(observed.options.redirect, 'error');
    assert.equal(observed.options.headers.Cookie, '_session_id=sensitive-session');
    assert.equal(new URL(observed.url).hostname, 'timetreeapp.com');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('network errors do not reveal arbitrary fetch error contents', async () => {
  const client = new HttpClient();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('password=supersecret in proxy diagnostics'); };
  try {
    await assert.rejects(client.get('https://timetreeapp.com/api/v1/calendars'), (error) => {
      assert.doesNotMatch(error.message, /supersecret/);
      assert.match(error.message, /TimeTree network request failed/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('nonstandard ports and invalid URLs are rejected', async () => {
  const client = new HttpClient();
  await assert.rejects(client.get('https://timetreeapp.com:444/api'), /untrusted TimeTree API origin/);
  await assert.rejects(client.get('not a url'), /invalid TimeTree API URL/);
});
