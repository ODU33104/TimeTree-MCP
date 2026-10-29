import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDateExpression as parse } from '../.test-dist/features/natural-date/index.js';
const ja={reference:'2026-10-26T15:00:00+09:00',timeZone:'Asia/Tokyo',locale:'ja'};
test('Japanese relative and weekday',()=>{
 assert.equal(parse('明日',ja).date,'2026-10-27');
 assert.equal(parse('来週月曜',ja).date,'2026-11-02');
 assert.equal(parse('2026年2月29日',ja).status,'unsupported');
});
test('English expressions and ambiguity',()=>{
 const en={...ja,locale:'en'};
 assert.equal(parse('next monday',en).date,'2026-11-02');
 assert.equal(parse('10/11/2026',en).status,'ambiguous');
 assert.equal(parse('next week',en).status,'ambiguous');
});
test('year omission is never silently inferred',()=>assert.equal(parse('11月2日',ja).status,'ambiguous'));
test('reference is evaluated in target zone at midnight boundary',()=>{
 const opts={...ja,reference:'2026-11-01T23:30:00-07:00',timeZone:'Asia/Tokyo'};
 assert.equal(parse('今日',opts).date,'2026-11-02');
});
test('DST offset transition does not shift calendar arithmetic',()=>{
 const opts={...ja,locale:'en',timeZone:'America/New_York',reference:'2026-10-31T12:00:00-04:00'};
 assert.equal(parse('day after tomorrow',opts).date,'2026-11-02');
});
test('invalid zones and naive reference are rejected',()=>{
 assert.equal(parse('tomorrow',{...ja,timeZone:'Not/AZone'}).status,'unsupported');
 assert.equal(parse('明日',{...ja,reference:'2026-10-26T15:00:00'}).status,'unsupported');
});
