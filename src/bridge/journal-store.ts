/**
 * Crash-resistant, local-only Calendar Bridge journal persistence.
 * The journal contains event mappings and fingerprints, NEVER OAuth tokens.
 *
 * The caller controls the file location and must retain the revision returned
 * by loadSyncJournalFile. Concurrent writers fail instead of overwriting.
 */
import { createHash, randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, open, rename, rm, lstat } from 'node:fs/promises';
import { basename, dirname, resolve, join } from 'node:path';
import { emptySyncJournal, validateSyncJournal, type SyncJournal } from './journal.js';

const MAX_JOURNAL_BYTES = 5 * 1024 * 1024;

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function validatePath(file: string): string {
  if (typeof file !== 'string' || !file.trim() || file.includes('\0')) {
    throw new Error('Invalid sync journal path');
  }
  return resolve(file);
}

function serialize(journal: SyncJournal): string {
  validateSyncJournal(journal);
  const value = JSON.stringify(journal) + '\n';
  if (Buffer.byteLength(value, 'utf8') > MAX_JOURNAL_BYTES) {
    throw new Error('Sync journal is too large');
  }
  return value;
}

async function checkParent(parent: string): Promise<void> {
  const st = await lstat(parent);
  if (!st.isDirectory() || st.isSymbolicLink()) {
    throw new Error('Sync journal parent must be a real directory');
  }
}

export type LoadedSyncJournal = {
  journal: SyncJournal;
  revision: string;
};

async function readExisting(file: string): Promise<LoadedSyncJournal> {
  let handle;
  try {
    handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const journal = emptySyncJournal();
      return { journal, revision: digest(serialize(journal)) };
    }
    throw error;
  }
  try {
    const st = await handle.stat();
    if (!st.isFile() || st.size > MAX_JOURNAL_BYTES) throw new Error('Invalid sync journal file');
    const raw = await handle.readFile({ encoding: 'utf8' });
    const parsed: unknown = JSON.parse(raw);
    // JSON has no executable content; refuse malformed or ambiguous mappings.
    const journal = validateSyncJournal(parsed as SyncJournal);
    return { journal, revision: digest(serialize(journal)) };
  } finally {
    await handle.close();
  }
}

export async function loadSyncJournalFile(filePath: string): Promise<LoadedSyncJournal> {
  const file = validatePath(filePath);
  return readExisting(file);
}

/**
 * Atomic file replacement guarded by a per-journal lock and expected revision.
 * An interrupted process may leave a .lock file; remove it only after
 * verifying no other process is writing. A leftover .tmp file is harmless.
 */
export async function saveSyncJournalFile(
  filePath: string,
  journal: SyncJournal,
  expectedRevision: string,
): Promise<string> {
  const file = validatePath(filePath);
  if (!/^[a-f0-9]{64}$/.test(expectedRevision)) throw new Error('Invalid expected revision');
  const raw = serialize(journal);
  const parent = dirname(file);
  await mkdir(parent, { recursive: true, mode: 0o700 });
  await checkParent(parent);
  const lockPath = file + '.lock';
  const lock = await open(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
  const temporary = join(parent, '.' + basename(file) + '.' + process.pid + '.' + randomBytes(8).toString('hex') + '.tmp');
  let tempCreated = false;
  try {
    const current = await readExisting(file);
    if (current.revision !== expectedRevision) {
      throw new Error('Sync journal revision changed; reload before writing');
    }
    const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    tempCreated = true;
    try {
      await handle.writeFile(raw, { encoding: 'utf8' });
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, file);
    tempCreated = false;
    return digest(raw);
  } finally {
    if (tempCreated) await rm(temporary, { force: true }).catch(() => {});
    await lock.close();
    await rm(lockPath, { force: true });
  }
}
