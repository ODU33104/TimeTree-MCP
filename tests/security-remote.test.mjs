import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeRemoteRequest, loadRemotePolicy } from '../.test-dist/remote/security.js';

const secret = 'a'.repeat(40);
const policy = loadRemotePolicy({
  TIMETREE_REMOTE_BEARER_TOKEN: secret,
  TIMETREE_REMOTE_ALLOWED_ORIGINS: 'https://example.org',
});

test('remote policy fails closed without a strong bearer token', () => {
  assert.throws(() => loadRemotePolicy({}), /32/);
  assert.throws(() => loadRemotePolicy({ TIMETREE_REMOTE_BEARER_TOKEN: 'short' }), /32/);
});
test('remote policy rejects wildcard and insecure origins', () => {
  assert.throws(() => loadRemotePolicy({ TIMETREE_REMOTE_BEARER_TOKEN: secret, TIMETREE_REMOTE_ALLOWED_ORIGINS: '*' }));
  assert.throws(() => loadRemotePolicy({ TIMETREE_REMOTE_BEARER_TOKEN: secret, TIMETREE_REMOTE_ALLOWED_ORIGINS: 'http://example.org' }));
});
test('remote policy enforces bounded bodies and read-only default', () => {
  assert.equal(policy.allowWrites, false);
  assert.equal(policy.maxBodyBytes, 1048576);
  assert.throws(() => loadRemotePolicy({ TIMETREE_REMOTE_BEARER_TOKEN: secret, TIMETREE_REMOTE_MAX_BODY_BYTES: '999999999' }));
});
test('remote authorization rejects missing or invalid tokens and hostile origins', () => {
  assert.equal(authorizeRemoteRequest({}, policy), 401);
  assert.equal(authorizeRemoteRequest({ authorization: 'Bearer wrong' }, policy), 401);
  assert.equal(authorizeRemoteRequest({ authorization: 'Bearer ' + secret, origin: 'https://attacker.example' }, policy), 403);
  assert.equal(authorizeRemoteRequest({ authorization: 'Bearer ' + secret, origin: 'https://example.org' }, policy), 200);
});
