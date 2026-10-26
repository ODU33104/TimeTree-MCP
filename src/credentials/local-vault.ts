/**
 * Local-only credential vault for an unofficial TimeTree integration.
 * Never expose these values as MCP tool results or prompt arguments.
 */
import { mkdir, readFile, rename, stat, writeFile, chmod } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

export interface StoredCredential {
  session: string;
  createdAt: string;
  expiresAt?: string;
}

export function credentialPath(home = homedir()): string {
  return join(home, '.config', 'timetree-mcp', 'credentials.json');
}

export function validateCredential(value: unknown): StoredCredential {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid credential format');
  const record = value as Record<string, unknown>;
  if (typeof record.session !== 'string' || !record.session.trim()) throw new Error('Missing credential');
  if (typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt))) throw new Error('Invalid creation date');
  if (record.expiresAt !== undefined && (typeof record.expiresAt !== 'string' || !Number.isFinite(Date.parse(record.expiresAt)))) {
    throw new Error('Invalid expiry date');
  }
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) throw new Error('Credential expired; rotate it locally');
  return { session: record.session, createdAt: record.createdAt, ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}) };
}

export async function saveCredential(value: StoredCredential, file = credentialPath()): Promise<void> {
  validateCredential(value);
  const directory = dirname(file);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  const temp = join(directory, '.credentials-' + randomBytes(12).toString('hex'));
  try {
    await writeFile(temp, JSON.stringify(value), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await chmod(temp, 0o600);
    await rename(temp, file);
  } finally {
    const { unlink } = await import('node:fs/promises');
    await unlink(temp).catch(() => {});
  }
}

export async function loadCredential(file = credentialPath()): Promise<StoredCredential> {
  const info = await stat(file);
  if (!info.isFile() || (process.platform !== 'win32' && (info.mode & 0o077) !== 0)) {
    throw new Error('Credential file permissions are unsafe');
  }
  return validateCredential(JSON.parse(await readFile(file, 'utf8')));
}
