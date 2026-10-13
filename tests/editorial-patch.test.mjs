import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {root} from '../scripts/lib/editorial-content.mjs';
import {delta,fingerprint} from '../scripts/lib/editorial-patch.mjs';
const revision=JSON.parse(readFileSync(new URL('content/revisao-etapa-45.json',root),'utf8'));
test('transporte compacto reconstrói integralmente os 499 conteúdos nas duas direções',()=>{
 for(const change of revision.changes){
  assert.deepEqual({...change.before,...delta(change)},change.after);
  assert.deepEqual({...change.after,...delta(change,'before')},change.before);
  assert.notEqual(fingerprint(change.before),fingerprint(change.after));
 }
});
test('fingerprint protege também conteúdo que não foi enviado no delta',()=>{
 const change=revision.changes.find(c=>!Object.hasOwn(delta(c),'targetExam'));
 assert.ok(change);
 for(const changed of [
  {...change.before,targetExam:change.before.targetExam==='both'?'etec':'both'},
  {...change.before,status:'reviewed'},
  {...change.before,options:[...change.before.options].reverse()},
  {...change.before,explanation:change.before.explanation+' Divergência editorial.'},
 ])assert.ok(![fingerprint(change.before),fingerprint(change.after)].includes(fingerprint(changed)));
 const file=readFileSync(new URL('supabase/content/revisao-etapa-45.sql',root),'utf8');
 assert.ok(Buffer.byteLength(JSON.stringify({query:file}))<500000,'A carga deve caber no limite de transporte.');
});
