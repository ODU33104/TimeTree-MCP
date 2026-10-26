import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path = new URL('../docs/official-ai-compatibility.md', import.meta.url);
const doc = await readFile(path, 'utf8');

test('official compatibility claims are anchored in first-party public references', () => {
  assert.match(doc, /2026-10-13\/web-ai-chat/);
  assert.match(doc, /2026-09-01\/mvw-redefine/);
  assert.match(doc, /timetreeapp\.com/);
  assert.match(doc, /unofficial/i);
});

test('official AI and SCE are not represented as available private APIs', () => {
  assert.match(doc, /no publicly verified SCE integration API/i);
  assert.match(doc, /undocumented official AI or SCE endpoints/i);
  assert.match(doc, /future AI context platform/i);
});

test('safe interoperability requires confirmation, authorization and data minimization', () => {
  assert.match(doc, /explicit confirmation/i);
  assert.match(doc, /explicitly authorized/i);
  assert.match(doc, /avoid logging event titles/i);
  assert.match(doc, /non-atomic partial-failure/i);
});
