import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { saveCredential, loadCredential, validateCredential } from '../.test-dist/credentials/local-vault.js';

test('credential vault saves atomically and reads with restrictive permissions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tt-vault-'));
  try {
    const path = join(dir, 'vault', 'credentials.json');
    const secret = { session: 'dummy-test-only', createdAt: '2026-10-26T00:00:00Z' };
    await saveCredential(secret, path);
    assert.deepEqual(await loadCredential(path), secret);
    assert.equal((await readFile(path, 'utf8')).includes('dummy-test-only'), true);
    if (process.platform !== 'win32') assert.equal((await stat(path)).mode & 0o077, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('credential validation rejects malformed and expired entries', () => {
  for (const value of [null, {}, { session: '', createdAt: '2026-10-26' },
    { session: 'x', createdAt: 'bad' },
    { session: 'x', createdAt: '2026-10-26T00:00:00Z', expiresAt: '2020-01-01T00:00:00Z' }]) {
    assert.throws(() => validateCredential(value));
  }
});
