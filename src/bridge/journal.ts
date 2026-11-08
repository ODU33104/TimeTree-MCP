/**
 * Provider-neutral reconciliation journal for calendar sync.
 *
 * This module deliberately has no Google, TimeTree, MCP, or UI dependencies.
 * Storage adapters must persist revisions atomically before exposing them.
 */
export type SyncLink = {
  sourceCalendarId: string;
  sourceEventId: string;
  destinationCalendarId: string;
  destinationEventId: string;
  sourceFingerprint: string;
  destinationFingerprint: string;
  createdByBridge: boolean;
};

export type SyncJournal = {
  version: 1;
  links: SyncLink[];
};

export type SyncConflict = {
  sourceCalendarId: string;
  sourceEventId: string;
  destinationCalendarId: string;
  destinationEventId: string;
  reason: 'both-changed' | 'destination-changed' | 'source-missing' | 'destination-missing';
};

export type SyncDecision =
  | { kind: 'unchanged'; link: SyncLink }
  | { kind: 'update-destination'; link: SyncLink }
  | { kind: 'conflict'; link: SyncLink; reason: SyncConflict['reason'] };

export function emptySyncJournal(): SyncJournal {
  return { version: 1, links: [] };
}

function assertId(id: string, label: string): void {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Invalid ' + label);
}

function sourceIdentity(link: Pick<SyncLink, 'sourceCalendarId' | 'sourceEventId'>): string {
  return JSON.stringify([link.sourceCalendarId, link.sourceEventId]);
}

function destinationIdentity(link: Pick<SyncLink, 'destinationCalendarId' | 'destinationEventId'>): string {
  return JSON.stringify([link.destinationCalendarId, link.destinationEventId]);
}

/** Reject malformed or ambiguous journal state before any reconciliation. */
export function validateSyncJournal(journal: SyncJournal): SyncJournal {
  if (!journal || journal.version !== 1 || !Array.isArray(journal.links)) {
    throw new Error('Unsupported sync journal');
  }
  const sourceIds = new Set<string>();
  const destinationIds = new Set<string>();
  for (const link of journal.links) {
    assertId(link.sourceCalendarId, 'source calendar ID');
    assertId(link.sourceEventId, 'source event ID');
    assertId(link.destinationCalendarId, 'destination calendar ID');
    assertId(link.destinationEventId, 'destination event ID');
    assertId(link.sourceFingerprint, 'source fingerprint');
    assertId(link.destinationFingerprint, 'destination fingerprint');
    if (typeof link.createdByBridge !== 'boolean') throw new Error('Invalid ownership marker');
    const source = sourceIdentity(link);
    const destination = destinationIdentity(link);
    if (sourceIds.has(source) || destinationIds.has(destination)) {
      throw new Error('Duplicate journal identity');
    }
    sourceIds.add(source);
    destinationIds.add(destination);
  }
  return journal;
}

/** Returns a new journal; never mutates an input or overwrites a previous link. */
export function addSyncLink(journal: SyncJournal, link: SyncLink): SyncJournal {
  validateSyncJournal(journal);
  const next: SyncJournal = { version: 1, links: [...journal.links, { ...link }] };
  return validateSyncJournal(next);
}

/**
 * Advance a confirmed link without changing either event identity.
 * Compare-and-swap fingerprints prevent racing sync passes from clobbering
 * a newer journal revision.
 */
export function advanceSyncLink(
  journal: SyncJournal,
  previous: SyncLink,
  sourceFingerprint: string,
  destinationFingerprint: string,
): SyncJournal {
  validateSyncJournal(journal);
  assertId(sourceFingerprint, 'source fingerprint');
  assertId(destinationFingerprint, 'destination fingerprint');
  const index = journal.links.findIndex(link =>
    sourceIdentity(link) === sourceIdentity(previous));
  if (index < 0) throw new Error('Sync link not found');
  const current = journal.links[index];
  if (destinationIdentity(current) !== destinationIdentity(previous) ||
      current.sourceFingerprint !== previous.sourceFingerprint ||
      current.destinationFingerprint !== previous.destinationFingerprint ||
      current.createdByBridge !== previous.createdByBridge) {
    throw new Error('Stale sync journal revision');
  }
  const links = journal.links.map((link, i) => i === index
    ? { ...link, sourceFingerprint, destinationFingerprint }
    : { ...link });
  return validateSyncJournal({ version: 1, links });
}

/**
 * Decide whether a one-way sync may safely update a linked destination.
 * Missing events and destination-side edits require human review. Deletion is
 * never proposed, even when an event was originally created by the bridge.
 */
export function reconcileLink(
  link: SyncLink,
  sourceFingerprint: string | null,
  destinationFingerprint: string | null,
): SyncDecision {
  if (sourceFingerprint === null) return { kind: 'conflict', link, reason: 'source-missing' };
  if (destinationFingerprint === null) return { kind: 'conflict', link, reason: 'destination-missing' };
  assertId(sourceFingerprint, 'source fingerprint');
  assertId(destinationFingerprint, 'destination fingerprint');
  const sourceChanged = sourceFingerprint !== link.sourceFingerprint;
  const destinationChanged = destinationFingerprint !== link.destinationFingerprint;
  if (sourceChanged && destinationChanged) return { kind: 'conflict', link, reason: 'both-changed' };
  if (destinationChanged) return { kind: 'conflict', link, reason: 'destination-changed' };
  if (sourceChanged) return { kind: 'update-destination', link };
  return { kind: 'unchanged', link };
}

/** Rollback eligibility is based on explicit ownership, never event titles. */
export function canRollback(link: SyncLink): boolean {
  return link.createdByBridge === true;
}
