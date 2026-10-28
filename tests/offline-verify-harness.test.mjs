import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('offline harness never installs packages or dispatches Actions',()=>{
 const s=readFileSync(new URL('../scripts/offline-verify.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(s,/spawnSync\(['"](?:curl|wget|gh)['"]/);
 assert.doesNotMatch(s,/['"](?:install|ci|audit)['"]\s*\]/);
 assert.match(s,/NOT RUN/);
});
