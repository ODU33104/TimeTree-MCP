import test from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient, HttpError } from '../.test-dist/utils/http-client.js';

test('HTTP client refuses credential-bearing calls to untrusted origins', async () => {
  const client = new HttpClient();
  client.setSessionCookie('dummy-secret');
  await assert.rejects(client.get('https://evil.example/path'), /Untrusted/);
  await assert.rejects(client.get('http://timetreeapp.com/path'), /Untrusted/);
  await assert.rejects(client.get('https://timetreeapp.com.evil.example/path'), /Untrusted/);
});
test('HTTP client suppresses secret response text and preserves status', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify({ error: { code: -493, message: 'private-data' } }), { status: 400, statusText: 'Bad Request' });
  };
  try {
    const client = new HttpClient();
    await assert.rejects(client.get('https://timetreeapp.com/'), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.statusCode, 400);
      assert.ok(!JSON.stringify(error).includes('private-data'));
      return true;
    });
  } finally {
    globalThis.fetch = previous;
  }
});
