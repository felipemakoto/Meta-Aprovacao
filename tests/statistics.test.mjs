import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStatistics,statisticsQuery,subjectPercentage} from '../src/lib/quiz/statistics-contract.ts';
import {statisticsHandler} from '../src/lib/quiz/statistics-http.ts';
import {demoStatistics} from '../src/app/estatisticas/statistics-preview.ts';
const example=demoStatistics();
test('agregado valida somas entre matérias/fontes e remove campos privados',()=>{
 const safe=parseStatistics({...example,secret:'private',subjects:example.subjects.map(x=>({...x,correctAnswer:'B'})),recent:example.recent.map(x=>({...x,questions:['private']}))},'all');assert.deepEqual(safe,example);
 for(const bad of [{...example,answered:61},{...example,correct:41},{...example,subjects:example.subjects.map(x=>({...x,subject:'unknown'}))},{...example,simulations:3},{...example,recent:example.recent.map(x=>({...x,score:100}))},{...example,period:'30d'}])assert.throws(()=>parseStatistics(bad,'all'));
});
test('pouca amostra não mostra percentual e arredondamento é descritivo',()=>{assert.equal(subjectPercentage(0,0),null);assert.equal(subjectPercentage(4,4),null);assert.equal(subjectPercentage(5,4),80);assert.equal(subjectPercentage(6,5),83);assert.equal(subjectPercentage(6,4),67);assert.equal(subjectPercentage(6,6),100);});
test('consulta só aceita períodos previstos e nenhum proprietário do cliente',()=>{assert.equal(statisticsQuery(new URL('http://local/')),'all');assert.equal(statisticsQuery(new URL('http://local/?period=30d')),'30d');for(const query of ['period=7d','period=all&period=30d','user_id=forged','period='])assert.throws(()=>statisticsQuery(new URL('http://local/?'+query)));});
test('zero é válido e distinto de falha; período recente confere limites de data',()=>{
 const empty={...example,answered:0,correct:0,simulations:0,recent:[],subjects:example.subjects.map(x=>({...x,answered:0,correct:0}))};assert.equal(parseStatistics(empty,'all').answered,0);
 assert.equal(parseStatistics(demoStatistics('30d'),'30d').answered,40);
 assert.throws(()=>parseStatistics({...demoStatistics('30d'),recent:example.recent.map(x=>({...x,at:'2026-01-01T00:00:00Z'}))},'30d'));
 assert.throws(()=>parseStatistics({...example,recent:example.recent.map(x=>({...x,at:'2099-01-01T00:00:00Z'}))},'all'));
});
test('HTTP impede banco sem sessão, origem externa e identidade forjada; resposta privada',async()=>{
 let calls=0;const anon=statisticsHandler({user:async()=>null,read:async()=>{calls++;return example;}});
 assert.equal((await anon(new Request('http://local/api/statistics'))).status,401);assert.equal(calls,0);
 const h=statisticsHandler({user:async()=>'verified',read:async(u,p)=>{assert.equal(u,'verified');assert.equal(p,'all');calls++;return example;}});
 const r=await h(new Request('http://local/api/statistics'));assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private, no-store/);assert.deepEqual(await r.json(),example);
 assert.equal((await h(new Request('http://local/?user_id=forged'))).status,400);assert.equal((await h(new Request('http://local/',{headers:{'sec-fetch-site':'cross-site'}}))).status,403);assert.equal(calls,1);
});
test('falha de autenticação, banco ou agregado não vira zero nem expõe mensagem interna',async()=>{
 for(const deps of [{user:async()=>{throw Error('secret');},read:async()=>example},{user:async()=>'verified',read:async()=>{throw Error('secret');}},{user:async()=>'verified',read:async()=>({})}]){const r=await statisticsHandler(deps)(new Request('http://local/'));assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'statistics_unavailable'});}
});
