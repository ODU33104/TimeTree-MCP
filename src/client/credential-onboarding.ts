/**
 * Local-only credential entry. Never expose this function through MCP tools.
 * The caller must run it in a trusted interactive terminal.
 */
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import type { AuthConfig } from './auth.js';

export async function promptForLocalCredentials(): Promise<AuthConfig> {
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error('Interactive terminal required for local credential onboarding');
  }
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  try {
    const email = (await rl.question('TimeTree email (local terminal only): ')).trim();
    if (!email || email.includes('\n') || email.includes('\r')) {
      throw new Error('Invalid email input');
    }
    // readline does not provide reliable hidden input across platforms.
    // Refuse to echo a password rather than silently exposing it.
    throw new Error('Password entry requires a platform-secure hidden-input provider; onboarding not enabled');
  } finally {
    rl.close();
  }
}
