// Synthetic stdio protocol tests: no TimeTree login and no network traffic.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const serverPath = fileURLToPath(new URL('../dist/index.js', import.meta.url));
const APP_URI = 'ui://timetree-mcp/calendar-bridge.html';
const MIME = 'text/html;profile=mcp-app';

function harness(ui) {
  const env = {
    ...process.env,
    TIMETREE_EMAIL: 'test@example.invalid',
    TIMETREE_PASSWORD: 'synthetic-only',
    TIMETREE_UPDATE_CHECK: 'false',
    TIMETREE_READ_ONLY: 'true',
  };
  const child = spawn(process.execPath, [serverPath], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  createInterface({ input: child.stdout }).on('line', line => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id != null && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });
  let nextId = 1;
  function rpc(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout ' + method)); }, 15000);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
  async function init() {
    await rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: ui ? { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: [MIME] } } } : {},
      clientInfo: { name: 'calendar-bridge-test', version: '0.0.1' },
    });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  }
  function close() {
    for (const { timer } of pending.values()) clearTimeout(timer);
    pending.clear();
    child.kill();
  }
  return { rpc, init, close };
}

test('MCP Apps capable client gets preview UI metadata and readable resource', { timeout: 45000 }, async () => {
  const h = harness(true);
  try {
    await h.init();
    const tools = (await h.rpc('tools/list')).tools;
    const bridge = tools.find(tool => tool.name === 'preview_calendar_bridge');
    assert.equal(bridge._meta?.ui?.resourceUri, APP_URI);
    assert.equal(bridge.annotations.readOnlyHint, true);
    const resources = (await h.rpc('resources/list')).resources;
    assert.ok(resources.some(resource => resource.uri === APP_URI && resource.mimeType === MIME));
    const result = await h.rpc('resources/read', { uri: APP_URI });
    assert.equal(result.contents[0].mimeType, MIME);
    assert.match(result.contents[0].text, /ui\/initialize/);
    assert.match(result.contents[0].text, /ui\/notifications\/tool-result/);
    assert.match(result.contents[0].text, /id="sourceCalendar"/);
    assert.match(result.contents[0].text, /id="googleCalendar"/);
    assert.match(result.contents[0].text, /id="compare"/);
    assert.match(result.contents[0].text, /preview_google_calendar_bridge/);
    assert.match(result.contents[0].text, /method: 'tools\/call'/);
    assert.doesNotMatch(result.contents[0].text, /'delete_event'|'create_event'|'update_event'/);
    assert.doesNotMatch(result.contents[0].text, /https:\/\/esm\.sh|https:\/\/unpkg\.com/);
  } finally { h.close(); }
});

test('plain MCP client sees the same tools without UI metadata', { timeout: 45000 }, async () => {
  const h = harness(false);
  try {
    await h.init();
    const tools = (await h.rpc('tools/list')).tools;
    assert.equal(tools.length, 18);
    assert.equal(tools.find(tool => tool.name === 'preview_calendar_bridge')._meta?.ui, undefined);
    assert.equal(tools.find(tool => tool.name === 'export_calendar_bridge_ics')._meta?.ui, undefined);
  } finally { h.close(); }
});
