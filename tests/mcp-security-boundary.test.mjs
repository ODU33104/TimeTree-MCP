import test from 'node:test';
import assert from 'node:assert/strict';
import { safeToolErrorResult } from '../.test-dist/utils/mcp-errors.js';
import { sanitizeForLogging } from '../.test-dist/utils/logger.js';

test('tool failure response never exposes upstream private diagnostics', () => {
  const privateValues = ['password-secret', 'session-cookie-secret', 'private-event-title'];
  const upstream = new Error(privateValues.join(' '));
  upstream.response = JSON.stringify({ password: privateValues[0], title: privateValues[2] });
  const result = safeToolErrorResult(upstream);
  assert.equal(result.isError, true);
  for (const value of privateValues) assert.equal(JSON.stringify(result).includes(value), false);
});

test('structured logger masks sensitive fields', () => {
  const sanitized = sanitizeForLogging({
    email: 'someone@example.com',
    password: 'password-secret',
    cookie: 'session-secret',
    body: { title: 'private-event-title' },
  });
  const serialized = JSON.stringify(sanitized);
  for (const value of ['someone@example.com', 'password-secret', 'session-secret', 'private-event-title']) {
    assert.equal(serialized.includes(value), false);
  }
});
