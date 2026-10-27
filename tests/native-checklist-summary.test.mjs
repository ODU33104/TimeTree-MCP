import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeChecklists as summarize } from '../.test-dist/features/checklist-summary/index.js';
const filter = {calendarIds:['1']};
const snap = (checklist, uuid='same', calendar_id='1') => ({calendar_id, events:[{uuid, checklist}]});
test('counts mixed items without exposing titles by default', () => {
  const r=summarize([snap([{checked:true,title:'secret'},{checked:false,title:'next'}])],filter);
  assert.deepEqual([r.total,r.completed,r.incomplete],[2,1,1]);
  assert.equal('titles' in r.entries[0],false);
});
test('distinguishes empty, missing and malformed',()=>{
 const r=summarize([{calendar_id:'1',events:[{uuid:'a',checklist:[]},{uuid:'b'},{uuid:'c',checklist:[{checked:'yes',title:'bad'}]},{uuid:'d',checklist:null}]}],filter);
 assert.deepEqual([r.empty,r.unavailable,r.malformed,r.total],[1,2,1,0]);
});
test('calendar scoped identities and duplicate snapshots',()=>{
 const r=summarize([snap([{checked:true,title:'x'}]),snap([{checked:true,title:'x'}]),snap([{checked:false,title:'y'}],'same','2')],{calendarIds:['1','2']});
 assert.deepEqual([r.completed,r.incomplete,r.entries.length],[1,1,2]);
});
test('scope filters, memo-only and event memo de-duplication',()=>{
 const r=summarize([{calendar_id:1,events:[{uuid:'m',category:2,checklist:[{checked:true,title:'x'}]}],memos:[{uuid:'m',checklist:[{checked:false,title:'y'}]}]}],filter);
 assert.deepEqual([r.completed,r.incomplete,r.entries.length],[0,1,1]);
 assert.equal(summarize([{calendar_id:1,memos:[{uuid:'m',checklist:[]}]}],{...filter,scope:'events'}).entries.length,0);
});
test('rejects excessive and malformed checklists without partial counts',()=>{
 const r=summarize([snap(Array.from({length:501},()=>({checked:true,title:'x'})))],filter);
 assert.deepEqual([r.malformed,r.total],[1,0]);
 assert.throws(()=>summarize([snap([])],{calendarIds:[]}));
});
test('all-day/timezone metadata never changes item totals; titles are opt-in',()=>{
 const r=summarize([{calendar_id:'1',events:[{uuid:'a',all_day:true,start_timezone:'Asia/Tokyo',start_at:'2026-11-01T00:00:00+09:00',checklist:[{checked:false,title:'買い物'}]}]}],{...filter,includeTitles:true});
 assert.equal(r.incomplete,1); assert.deepEqual(r.entries[0].titles,['買い物']);
});
test('rejects long or empty titles and avoids accidental leakage',()=>{
 const r=summarize([snap([{checked:true,title:'ok'},{checked:false,title:' '.repeat(2)}])],{...filter,includeTitles:true});
 assert.equal(r.malformed,1); assert.equal(r.total,0); assert.equal('titles' in r.entries[0],false);
});
