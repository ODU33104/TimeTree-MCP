import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, lstat, symlink, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { addSyncLink, advanceSyncLink, emptySyncJournal } from '../.test-dist/bridge/journal.js';
import { loadSyncJournalFile, saveSyncJournalFile } from '../.test-dist/bridge/journal-store.js';

const link = {
  sourceCalendarId: 'family', sourceEventId: 'e1',
  destinationCalendarId: 'google-family', destinationEventId: 'g1',
  sourceFingerprint: 'source1', destinationFingerprint: 'google1', createdByBridge: true,
};

async function tempContext(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'timetree-bridge-'));
  try { await fn(dir); } finally { await rm(dir, { recursive: true, force: true }); }
}

test('journal persists a validated mapping atomically', async () => tempContext(async dir => {
  const file = join(dir, 'state', 'journal.json');
  const initial = await loadSyncJournalFile(file);
  assert.deepEqual(initial.journal, emptySyncJournal());
  const next = addSyncLink(initial.journal, link);
  const revision = await saveSyncJournalFile(file, next, initial.revision);
  assert.match(revision, /^[0-9a-f]{64}$/);
  const loaded = await loadSyncJournalFile(file);
  assert.deepEqual(loaded.journal, next);
  assert.equal(loaded.revision, revision);
  assert.equal((await lstat(file)).isFile(), true);
  assert.equal((await readFile(file, 'utf8')).includes('OAuth'), false);
}));

test('stale writers cannot overwrite a newer mapping', async () => tempContext(async dir => {
  const file = join(dir, 'journal.json');
  const initial = await loadSyncJournalFile(file);
  const once = addSyncLink(initial.journal, link);
  await saveSyncJournalFile(file, once, initial.revision);
  await assert.rejects(
    () => saveSyncJournalFile(file, emptySyncJournal(), initial.revision),
    /revision changed/,
  );
  assert.equal((await loadSyncJournalFile(file)).journal.links.length, 1);
}));

test('invalid existing JSON cannot be overwritten implicitly', async () => tempContext(async dir => {
  const file = join(dir, 'journal.json');
  await writeFile(file, 'NOT VALID JSON');
  await assert.rejects(() => loadSyncJournalFile(file));
  await assert.rejects(() => saveSyncJournalFile(file, emptySyncJournal(), '0'.repeat(64)));
  assert.equal(await readFile(file, 'utf8'), 'NOT VALID JSON');
}));

test('symlinked journal files are not followed', async () => tempContext(async dir => {
  const target = join(dir, 'target.json');
  const linkPath = join(dir, 'journal.json');
  await writeFile(target, JSON.stringify(emptySyncJournal()));
  await symlink(target, linkPath);
  await assert.rejects(() => loadSyncJournalFile(linkPath));
  assert.deepEqual(JSON.parse(await readFile(target, 'utf8')), emptySyncJournal());
}));

test('a held lock causes a safe failure', async () => tempContext(async dir => {
  const file = join(dir, 'journal.json');
  await writeFile(file + '.lock', 'held');
  const initial = await loadSyncJournalFile(file);
  await assert.rejects(() => saveSyncJournalFile(file, emptySyncJournal(), initial.revision));
  assert.equal(await readFile(file + '.lock', 'utf8'), 'held');
}));

test('can advance a confirmed sync revision without overwriting another writer', () => {
  const original = addSyncLink(emptySyncJournal(), link);
  const advanced = advanceSyncLink(original, link, 'source2', 'google2');
  assert.equal(original.links[0].sourceFingerprint, 'source1');
  assert.equal(advanced.links[0].sourceFingerprint, 'source2');
  assert.throws(() => advanceSyncLink(advanced, link, 'source3', 'google3'), /Stale/);
});
