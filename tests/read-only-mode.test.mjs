// Starts the built server over stdio and counts the tools that tools/list reports for each
// TIMETREE_READ_ONLY value. Dummy credentials only; no tool is called and no network is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const serverPath = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const READ_ONLY_TOOL_COUNT = 24;
const ALL_TOOL_COUNT = 41;

function listToolCount(readOnlyValue, timeoutMs = 20000) {
  const env = {
    ...process.env,
    TIMETREE_EMAIL: 'your-email@example.com',
    TIMETREE_PASSWORD: 'dummy-password',
    TIMETREE_UPDATE_CHECK: 'false',
  };
  delete env.TIMETREE_READ_ONLY;
  if (readOnlyValue !== undefined) env.TIMETREE_READ_ONLY = readOnlyValue;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverPath], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let buffer = '';
    const fail = (error) => {
      clearTimeout(timer);
      child.kill();
      reject(error);
    };
    const timer = setTimeout(() => fail(new Error(`no tools/list response within ${timeoutMs} ms`)), timeoutMs);

    child.on('error', fail);
    child.on('exit', (code) => fail(new Error(`server exited early with code ${code}`)));
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        let message;
        try {
          message = JSON.parse(line);
        } catch {
          fail(new Error(`stdout carried a non-JSON line: ${line.slice(0, 80)}`));
          return;
        }
        if (message.id === 1) {
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
          child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
        } else if (message.id === 2) {
          clearTimeout(timer);
          child.kill();
          resolve(message.result.tools.length);
        }
      }
    });

    child.stdin.write(`${JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'read-only-mode-test', version: '0.0.0' },
      },
    })}\n`);
  });
}

test('TIMETREE_READ_ONLY=true lists only the read-only tools', { timeout: 90000 }, async () => {
  assert.equal(await listToolCount('true'), READ_ONLY_TOOL_COUNT);
});

test('TIMETREE_READ_ONLY=false, empty, or unset keeps every tool listed', { timeout: 90000 }, async () => {
  assert.equal(await listToolCount('false'), ALL_TOOL_COUNT);
  assert.equal(await listToolCount(''), ALL_TOOL_COUNT);
  assert.equal(await listToolCount(undefined), ALL_TOOL_COUNT);
});
