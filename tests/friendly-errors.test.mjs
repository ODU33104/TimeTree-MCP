import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  classifyError,
  InvalidArgumentError,
  parseToolInput,
  toolErrorResult,
  withSafeMessage,
} from '../.test-dist/utils/mcp-errors.js';
import { SERVER_VERSION } from '../.test-dist/config/config.js';
import { TimeTreeAPIError, TimeTreeAPIClient } from '../.test-dist/client/api.js';
import { AuthenticationError } from '../.test-dist/client/auth.js';
import { HttpError } from '../.test-dist/utils/http-client.js';
import { createListCalendarsTool } from '../.test-dist/tools/calendar-tools.js';

// Synthetic values only. They must never reach a tool response.
const SECRET_BODY = 'SYNTHETIC-BODY-7f3a';
const SECRET_EMAIL = 'synthetic.user@example.test';
const SECRET_TOKEN = 'SYNTHETIC-CSRF-TOKEN-9c1e';

function text(result) {
  return result.content[0].text;
}

function assertNoLeak(result) {
  const serialized = JSON.stringify(result);
  for (const value of [SECRET_BODY, SECRET_EMAIL, SECRET_TOKEN, 'invalid_type', '"expected"', 'ZodError']) {
    assert.equal(serialized.includes(value), false, `response leaked ${value}`);
  }
}

function zodErrorFor(schema, value) {
  const parsed = schema.safeParse(value);
  assert.equal(parsed.success, false);
  return parsed.error;
}

test('authentication failures are classified as AUTH_FAILED with sign-in guidance', () => {
  for (const error of [
    new AuthenticationError('Invalid email or password', 401),
    Object.assign(new Error(SECRET_BODY), { statusCode: 401 }),
    Object.assign(new Error(SECRET_BODY), { statusCode: 403 }),
  ]) {
    const result = toolErrorResult(error);
    assert.equal(result.isError, true);
    assert.match(text(result), /^\[AUTH_FAILED\]\n日本語: TimeTree へのサインインに失敗しました。.*メールアドレスとパスワード.*Google・Apple/);
    assert.match(text(result), /\nEnglish: Sign-in to TimeTree failed\. .*Google or Apple/);
    assertNoLeak(result);
  }
});

test('a response that does not match the expected shape is UPSTREAM_FORMAT and names only the field path', () => {
  const schema = z.object({ calendars: z.array(z.object({ id: z.string() })) });
  const zodError = zodErrorFor(schema, { calendars: [{ id: SECRET_BODY }, { id: 42 }] });
  // Same wrapping as TimeTreeAPIClient: the original exception travels as `cause`.
  const wrapped = new TimeTreeAPIError(`Failed to fetch calendars: ${zodError.message}`, undefined, zodError);
  const result = toolErrorResult(wrapped);

  assert.match(text(result), /^\[UPSTREAM_FORMAT\]/);
  assert.match(text(result), /項目: calendars\[1\]\.id/);
  assert.match(text(result), /field: calendars\[1\]\.id/);
  assert.match(text(result), new RegExp(`バージョン ${SERVER_VERSION.replace(/\./g, '\\.')} と`));
  assert.match(text(result), /https:\/\/github\.com\/ODU33104\/TimeTree-MCP\/issues/);
  assertNoLeak(result);
});

test('path segments that could carry values are replaced with *', () => {
  const schema = z.record(z.string(), z.object({ id: z.number() }));
  const zodError = zodErrorFor(schema, { [SECRET_EMAIL]: { id: 'x' } });
  const result = toolErrorResult(new TimeTreeAPIError('Failed to sync events: x', undefined, zodError));
  assert.match(text(result), /項目: \*\.id/);
  assert.equal(text(result).includes(SECRET_EMAIL), false);
});

test('network and timeout failures are NETWORK with a retry hint', () => {
  for (const error of [
    Object.assign(new Error('Network request failed'), { code: 'NETWORK' }),
    Object.assign(new Error('Request timeout after 30000ms'), { code: 'NETWORK' }),
    new TimeTreeAPIError('Failed to fetch calendars: Network request failed', undefined,
      Object.assign(new Error('Network request failed'), { code: 'NETWORK' })),
  ]) {
    const result = toolErrorResult(error);
    assert.match(text(result), /^\[NETWORK\]/);
    assert.match(text(result), /ネットワーク.*再実行/);
    assert.match(text(result), /network error or timeout/);
  }
});

test('rate limiting is RATE_LIMITED with a wait-and-retry hint', () => {
  const result = toolErrorResult(new HttpError(429, 'HTTP 429: Too Many Requests'));
  assert.match(text(result), /^\[RATE_LIMITED\]/);
  assert.match(text(result), /少し待って/);
  assert.match(text(result), /Wait a moment/);
});

test('unknown failures are UNKNOWN and never echo the raw message', () => {
  const result = toolErrorResult(new Error(`boom ${SECRET_BODY} ${SECRET_EMAIL}`));
  assert.equal(classifyError(new Error('x')).code, 'UNKNOWN');
  assert.match(text(result), /^\[UNKNOWN\]\n日本語: TimeTree の操作に失敗しました。/);
  assert.match(text(result), /See the server log/);
  assertNoLeak(result);
});

test('argument validation reports the argument name and reason, never the value', () => {
  const schema = z.object({
    purpose: z.enum(['work', 'family']),
    name: z.string().min(1).max(5),
  }).strict();
  for (const [args, expectedFragment] of [
    [{ purpose: SECRET_BODY, name: 'ok' }, /purpose: サポートされていない値です/],
    [{ purpose: 'work', name: 'toolongname' }, /name: 長すぎます/],
    [{ purpose: 'work', name: 'ok', [SECRET_EMAIL]: 1 }, /引数が不正です（.*許可されていないフィールド/],
  ]) {
    let caught;
    try {
      parseToolInput(schema, args);
    } catch (error) {
      caught = error;
    }
    assert.ok(caught, 'expected parseToolInput to throw');
    const result = toolErrorResult(caught);
    assert.match(text(result), /^\[INVALID_INPUT\]/);
    assert.match(text(result), expectedFragment);
    assert.match(text(result), /\nEnglish: Invalid argument \(/);
    assertNoLeak(result);
    assert.equal(text(result).includes(SECRET_EMAIL), false);
  }
});

test('argument errors written by a tool carry the argument name and reason', () => {
  const result = toolErrorResult(new InvalidArgumentError('start_date', '開始日は終了日以前にしてください', 'must be on or before end_date'));
  assert.match(text(result), /^\[INVALID_INPUT\]\n日本語: 引数が不正です（start_date: 開始日は終了日以前にしてください）。/);
  assert.match(text(result), /English: Invalid argument \(start_date: must be on or before end_date\)\./);
});

test('self-written messages pass through with identifiers redacted', () => {
  const error = withSafeMessage(new Error('Could not download the comment image. Try again.'));
  assert.match(text(toolErrorResult(error)), /English: Could not download the comment image\. Try again\./);

  const withId = withSafeMessage(new Error('event 3f8a9c2b1d4e5f60 was kept; use delete_event.'));
  const redacted = text(toolErrorResult(withId));
  assert.equal(redacted.includes('3f8a9c2b1d4e5f60'), false);
  assert.match(redacted, /<id>/);
  assert.match(redacted, /delete_event/);
});

test('write attempts that may have been applied add a check-before-retry note, except auth and input errors', () => {
  const uncertain = toolErrorResult(new Error('timeout'), { writeMayHaveSucceeded: true });
  assert.match(text(uncertain), /作成された可能性があります。.*list_calendars/);
  assert.match(text(uncertain), /It may have been applied\. Check with list_calendars/);

  const auth = toolErrorResult(new AuthenticationError('x', 401), { writeMayHaveSucceeded: true });
  assert.equal(text(auth).includes('list_calendars'), false);
});

test('list_calendars returns UPSTREAM_FORMAT for a malformed TimeTree response, without the raw issues', async () => {
  const client = new TimeTreeAPIClient({
    isAuthenticated: () => true,
    getCsrfToken: () => SECRET_TOKEN,
    getHttpClient: () => ({ get: async () => ({ calendars: [{ id: SECRET_BODY, name: 99 }] }) }),
  });
  const result = await createListCalendarsTool(client).handler({});
  assert.equal(result.isError, true);
  assert.match(text(result), /^\[UPSTREAM_FORMAT\]/);
  assert.match(text(result), /項目: calendars/);
  assertNoLeak(result);
  assert.equal(text(result).includes(SECRET_TOKEN), false);
});
