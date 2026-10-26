import test from 'node:test';
import assert from 'node:assert/strict';
import { assertLoopbackHost } from '../.test-dist/remote-server.js';
test('remote endpoint refuses all non-loopback interfaces', () => {
  for (const host of ['0.0.0.0', '::', '192.168.1.1', 'localhost', 'example.com']) assert.throws(() => assertLoopbackHost(host), /Public bind forbidden/);
  assert.doesNotThrow(() => assertLoopbackHost('127.0.0.1'));
  assert.doesNotThrow(() => assertLoopbackHost('::1'));
});
