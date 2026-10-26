import test from 'node:test';
import assert from 'node:assert/strict';
import { isNewerVersion, fetchNewerVersion, formatUpdateNotice } from '../.test-dist/utils/update-check.js';
import { UPDATE_CHECK_URL, CHANGELOG_URL, RELEASES_URL } from '../.test-dist/config/config.js';

test('update sources belong to this fork', () => {
  for (const url of [UPDATE_CHECK_URL, CHANGELOG_URL, RELEASES_URL]) {
    assert.match(url, /ODU33104\/TimeTree-MCP/);
    assert.doesNotMatch(url, /ehs208\/TimeTree-MCP/);
  }
});

test('version comparison accepts only valid three-part versions', () => {
  assert.equal(isNewerVersion('0.7.1', '0.7.0'), true);
  assert.equal(isNewerVersion('0.7.0', '0.7.0'), false);
  assert.equal(isNewerVersion('0.6.9', '0.7.0'), false);
  for (const malformed of ['garbage', '0.8', '0.8.0-beta.1', '1.2.3.4', '1.x.0', '999999999999999999999.0.0']) {
    assert.equal(isNewerVersion(malformed, '0.7.0'), false, malformed);
  }
});

test('update check ignores malformed and failed responses', async () => {
  const response = (payload, ok = true) => async () => ({ ok, json: async () => payload });
  assert.equal(await fetchNewerVersion('0.7.0', response({ version: '0.7.1' })), '0.7.1');
  assert.equal(await fetchNewerVersion('0.7.0', response(null)), null);
  assert.equal(await fetchNewerVersion('0.7.0', response({ version: 10 })), null);
  assert.equal(await fetchNewerVersion('0.7.0', response({ version: 'oops' })), null);
  assert.equal(await fetchNewerVersion('0.7.0', response({ version: '0.8.0' }, false)), null);
});

test('update notice uses fork URLs', () => {
  const notice = formatUpdateNotice('0.7.0', '0.8.0', 'mcpb');
  assert.ok(notice.includes(RELEASES_URL));
  assert.ok(notice.includes(CHANGELOG_URL));
});
