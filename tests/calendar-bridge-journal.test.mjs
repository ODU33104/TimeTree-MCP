import test from 'node:test';
import assert from 'node:assert/strict';
import { addSyncLink, canRollback, emptySyncJournal, reconcileLink, validateSyncJournal } from '../.test-dist/bridge/journal.js';

const link = {
  sourceCalendarId: 'family', sourceEventId: 't1',
  destinationCalendarId: 'google-family', destinationEventId: 'g1',
  sourceFingerprint: 'source-v1', destinationFingerprint: 'google-v1',
  createdByBridge: true,
};

test('journal is immutable and accepts a unique mapping', () => {
  const original = emptySyncJournal();
  const updated = addSyncLink(original, link);
  assert.equal(original.links.length, 0);
  assert.equal(updated.links.length, 1);
  assert.deepEqual(validateSyncJournal(updated), updated);
});

test('rejects duplicate source identity', () => {
  const journal = addSyncLink(emptySyncJournal(), link);
  assert.throws(() => addSyncLink(journal, { ...link, destinationEventId: 'g2' }), /Duplicate/);
});

test('rejects duplicate destination identity', () => {
  const journal = addSyncLink(emptySyncJournal(), link);
  assert.throws(() => addSyncLink(journal, { ...link, sourceEventId: 't2' }), /Duplicate/);
});

test('rejects invalid journal versions and ownership', () => {
  assert.throws(() => validateSyncJournal({ version: 2, links: [] }), /Unsupported/);
  assert.throws(() => addSyncLink(emptySyncJournal(), { ...link, createdByBridge: undefined }), /ownership/);
});

test('one-way reconciliation updates only when source alone changed', () => {
  assert.equal(reconcileLink(link, 'source-v2', 'google-v1').kind, 'update-destination');
  assert.equal(reconcileLink(link, 'source-v1', 'google-v1').kind, 'unchanged');
});

test('destination edits and simultaneous edits are conflicts', () => {
  assert.equal(reconcileLink(link, 'source-v1', 'google-v2').reason, 'destination-changed');
  assert.equal(reconcileLink(link, 'source-v2', 'google-v2').reason, 'both-changed');
});

test('missing events are conflicts rather than delete instructions', () => {
  assert.equal(reconcileLink(link, null, 'google-v1').reason, 'source-missing');
  assert.equal(reconcileLink(link, 'source-v1', null).reason, 'destination-missing');
});

test('rollback requires bridge ownership', () => {
  assert.equal(canRollback(link), true);
  assert.equal(canRollback({ ...link, createdByBridge: false }), false);
});
