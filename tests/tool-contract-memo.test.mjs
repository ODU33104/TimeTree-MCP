import test from 'node:test';
import assert from 'node:assert/strict';
import { CreateMemoInputSchema, DeleteMemoInputSchema, ListMemosInputSchema } from '../.test-dist/tools/memo-tools.js';

const calendar_id = 1;
test('rejects nonexistent memo dates', () => {
  assert.equal(CreateMemoInputSchema.safeParse({ calendar_id, title: 'Memo', date: '2026-02-30' }).success, false);
  assert.equal(CreateMemoInputSchema.safeParse({ calendar_id, title: 'Memo', date: '2024-02-29' }).success, true);
});
test('rejects blank memo identifier', () => {
  assert.equal(DeleteMemoInputSchema.safeParse({ calendar_id, memo_uuid: '   ' }).success, false);
});
test('requires bounded integer list limit', () => {
  for (const limit of [0, -1, 1.5, 1001]) assert.equal(ListMemosInputSchema.safeParse({ calendar_id, limit }).success, false);
  assert.equal(ListMemosInputSchema.safeParse({ calendar_id, limit: 1000 }).success, true);
});
