import test from 'node:test';
import assert from 'node:assert/strict';
import { isToolAllowed } from '../.test-dist/utils/tool-access.js';

test('read-only mode defaults unknown and mutating tools to denied', () => {
  assert.equal(isToolAllowed('list_calendars', true), true);
  assert.equal(isToolAllowed('get_events', true), true);
  assert.equal(isToolAllowed('delete_event', true), false);
  assert.equal(isToolAllowed('create_event', true), false);
  assert.equal(isToolAllowed('get_future_secret', true), false);
});
test('write-enabled mode is explicit', () => {
  assert.equal(isToolAllowed('delete_event', false), true);
});
