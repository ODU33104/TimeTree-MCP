import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

export interface LocalCredential { token: string; updatedAt: string }
export function credentialPath(): string {
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'timetree-mcp', 'credentials.json');
}
export async function storeCredential(token: string, path = credentialPath()): Promise<void> {
  if (!token || !token.trim() || /[\r\n]/.test(token)) throw new Error('Invalid credential');
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await chmod(dirname(path), 0o700);
  const temporary = path + '.' + randomBytes(8).toString('hex') + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify({ token, updatedAt: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
    await chmod(temporary, 0o600);
    await rename(temporary, path);
    await chmod(path, 0o600);
  } catch {
    const { unlink } = await import('node:fs/promises');
    await unlink(temporary).catch(() => {});
    throw new Error('Credential storage failed');
  }
}
export async function loadCredential(path = credentialPath()): Promise<LocalCredential> {
  const { lstat } = await import('node:fs/promises');
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0) throw new Error('Unsafe credential file permissions');
  const data: unknown = JSON.parse(await readFile(path, 'utf8'));
  if (!data || typeof data !== 'object' || !('token' in data) || typeof data.token !== 'string' || !data.token) throw new Error('Invalid credential file');
  return { token: data.token, updatedAt: 'updatedAt' in data && typeof data.updatedAt === 'string' ? data.updatedAt : '' };
}
