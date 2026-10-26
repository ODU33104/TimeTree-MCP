import { stdin, stdout } from 'node:process';
import { storeCredential, credentialPath } from '../credentials/local-vault.js';

/** Run locally in a trusted terminal. Never expose this command as an MCP tool. */
export async function onboardLocalCredential(): Promise<void> {
  if (!stdin.isTTY || !stdout.isTTY) throw new Error('Interactive terminal required');
  stdout.write('Paste TimeTree credential (input hidden): ');
  const chunks: string[] = [];
  const previous = stdin.isRaw;
  try {
    if (stdin.setRawMode) stdin.setRawMode(true);
    await new Promise<void>((resolve, reject) => {
      const onData = (buffer: Buffer) => {
        for (const c of buffer.toString('utf8')) {
          if (c === '\r' || c === '\n') { cleanup(); resolve(); return; }
          if (c === '\u0003') { cleanup(); reject(new Error('Cancelled')); return; }
          if (c === '\u007f') chunks.pop();
          else chunks.push(c);
        }
      };
      const cleanup = () => stdin.off('data', onData);
      stdin.on('data', onData);
    });
  } finally {
    if (stdin.setRawMode) stdin.setRawMode(Boolean(previous));
    stdout.write('\n');
  }
  const secret = chunks.join('');
  chunks.fill('');
  await storeCredential(secret);
  stdout.write('Credential stored at ' + credentialPath() + '\n');
}
