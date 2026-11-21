import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadCatalog,root} from '../scripts/lib/editorial-content.mjs';
import {delta,fingerprint} from '../scripts/lib/editorial-patch.mjs';
const catalog=loadCatalog();
const manifest=JSON.parse(readFileSync(new URL('content/revisao-etapa-47.json',root),'utf8'));
const get=label=>catalog.questions.find(q=>q.label===label);
const answer=q=>q.options['ABCDE'.indexOf(q.correctAnswer)];

test('C33 pede o mínimo entre todas as áreas que respeitam o teto de pressão',()=>{
 const q=get('C33');
 const areas=q.options.map(s=>Number(s.split(' ')[0].replace(',','.')));
 const feasible=areas.filter(a=>600/a<=5000);
 assert.equal(feasible.length,2); // 0,12 e 0,3 respeitam o teto; só uma é mínima.
 assert.match(q.statement,/área mínima.*no máximo 5.000 Pa/);
 assert.equal(Number(answer(q).split(' ')[0].replace(',','.')),Math.min(...feasible));
});

test('precisão final distingue rapidez escalar, quantificador e redução média',()=>{
 for(const q of catalog.questions.filter(q=>q.family==='M16')){
  assert.match(q.topic,/Velocidade escalar média/);
  assert.doesNotMatch(q.statement,/velocidade média/);
  if(q.variant!==2)assert.match(q.statement,/velocidade escalar média/);
 }
 const expected=48/(24/12+24/18);
 assert.ok(Math.abs(expected-14.4)<1e-10);assert.equal(answer(get('M16')),'14,4 km/h');
 assert.equal(get('M50').options.filter(s=>s==='1 estudantes').length,0);
 assert.match(answer(get('P72')),/^Somente os moradores/);
 assert.equal(answer(get('G59')),'6.000 minutos');
 assert.equal(400*50-400*35,6000);
 assert.match(get('G59').explanation,/não significa que cada viagem individual/);
});

test('dispensa do responsável e revisão por IA não inventam assinatura humana nem alteram versões por publicação',()=>{
 assert.equal(manifest.decision.humanReviewRequired,false);
 assert.match(manifest.decision.reviewMethod,/IA/);
 assert.equal(manifest.changes.length,500);assert.equal(manifest.contentChanges,13);
 assert.equal(manifest.changes.filter(c=>c.after.version===c.before.version+1).length,13);
 assert.equal(manifest.changes.filter(c=>c.after.version===c.before.version).length,487);
 for(const c of manifest.changes){
  assert.equal(c.before.status,'draft');assert.equal(c.after.status,'published');
  assert.deepEqual({...c.before,...delta(c)},c.after);
  assert.notEqual(fingerprint(c.before),fingerprint(c.after));
 }
 assert.ok(catalog.questions.every(q=>q.status==='published'&&q.provenance.includes('revisão editorial por IA')));
 for(const m of manifest.models){assert.equal(m.before.published,false);assert.deepEqual(m.after,{...m.before,published:true});}
});

test('carga de publicação preserva isolamento comercial e confere hashes antes/depois',()=>{
 const sql=readFileSync(new URL('supabase/content/publicacao-etapa-47.sql',root),'utf8');
 assert.ok(Buffer.byteLength(JSON.stringify({query:sql}))<500000);
 assert.match(sql,/stage47_content_diverged/);assert.match(sql,/stage47_model_diverged/);assert.match(sql,/stage47_after_mismatch/);
 assert.doesNotMatch(sql,/\bgrant\b|\btruncate\b|\bdelete from\b|\bcreate table\b/i);
 assert.doesNotMatch(sql,/update\s+(?:private\.)?(?:subscriptions|subscription_periods|cakto_)/i);
 // Publishing content must not itself mutate the separate commercial launch flag.
 assert.doesNotMatch(sql,/checkoutEnabled/);
});
