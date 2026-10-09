import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {parseDailyLimits,dailyLimitMessage,nextLimitsRefresh} from '../src/lib/quiz/limits-contract.ts';
import {limitsHandler} from '../src/lib/quiz/limits-http.ts';
import {createPracticeHandlers} from '../src/lib/quiz/practice-http.ts';
import {simulationHandlers} from '../src/lib/quiz/simulation-http.ts';
import {parsePracticeInput} from '../src/lib/quiz/practice-contract.ts';
const limits={hasPremium:false,accessUntil:null,resetsAt:'2026-10-03T03:00:00Z',practice:{limit:10,used:10,remaining:0},simulations:{limit:1,used:2,remaining:0}};
const id='00000000-0000-4000-8000-000000000023';
const next={action:'next',filters:{subject:'matematica',topic:'',difficulty:'all',exam:'all'},previous:null,requestId:id};
test('saldo validado, uso anterior acima do limite permitido e campos privados removidos',()=>{
 assert.deepEqual(parseDailyLimits({...limits,user_id:'secret',premium:true}),limits);
 for(const x of [{...limits,resetsAt:'no'},{...limits,practice:{limit:10,used:-1,remaining:11}},{...limits,practice:{limit:10,used:10,remaining:1}},{...limits,simulations:{limit:2,used:0,remaining:2}}])assert.throws(()=>parseDailyLimits(x));
});
test('Premium exige período informado e cotas nulas; gratuito nunca aceita ilimitado',()=>{
 const paid={...limits,hasPremium:true,accessUntil:'2026-10-02T18:00:00Z',practice:{limit:null,used:80,remaining:null},simulations:{limit:null,used:12,remaining:null}};
 assert.deepEqual(parseDailyLimits({...paid,secret:'remove'}),paid);
 for(const x of [{...paid,accessUntil:null},{...paid,practice:limits.practice},{...paid,simulations:{limit:null,used:0,remaining:Infinity}},{...paid,hasPremium:false,accessUntil:null},{...limits,hasPremium:'true'},{...limits,accessUntil:paid.accessUntil}])assert.throws(()=>parseDailyLimits(x));
 assert.equal(dailyLimitMessage(paid,'practice'),'Premium ativo · Questões sem limite diário.');
 assert.equal(dailyLimitMessage(paid,'simulations'),'Premium ativo · Simulados sem limite diário.');
 assert.match(dailyLimitMessage(limits,'practice'),/0 de 10/);
 const now=Date.parse('2026-10-02T17:59:00Z');
 assert.equal(nextLimitsRefresh(paid,now),61000);
 assert.equal(nextLimitsRefresh(limits,now),Date.parse(limits.resetsAt)-now+1000);
 assert.equal(nextLimitsRefresh({...paid,accessUntil:'2026-10-02T17:58:00Z'},now),1000);
});
test('consulta usa conta verificada, proíbe parâmetros e origem externa, nunca transforma falha em saldo',async()=>{
 let read=0;const deps={user:async()=>'verified',read:async u=>{assert.equal(u,'verified');read++;return limits;}};
 const get=limitsHandler(deps),req=(suffix='',headers={})=>new Request('http://localhost:3000/api/limits'+suffix,{headers});
 const r=await get(req());assert.equal(r.status,200);assert.deepEqual(await r.json(),limits);assert.match(r.headers.get('cache-control'),/private, no-store/);
 assert.equal((await get(req('?premium=true'))).status,400);assert.equal((await get(req('',{'sec-fetch-site':'cross-site'}))).status,403);assert.equal(read,1);
 assert.equal((await limitsHandler({...deps,user:async()=>null})(req())).status,401);assert.equal(read,1);
 const failed=await limitsHandler({...deps,read:async()=>{throw Error('secret');}})(req());assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{error:'limits_unavailable'});
});
test('busca aceita nonce válido e recusa bypass de plano/usuário ou nonce malformado',()=>{
 assert.deepEqual(parsePracticeInput(next),next);
 for(const x of [{...next,requestId:'bad'},{...next,premium:true},{...next,user_id:id}])assert.throws(()=>parsePracticeInput(x));
});
test('limites comerciais 403 distinguem-se de throttling 429 e falhas 503',async()=>{
 const request=body=>new NextRequest('http://localhost:3000/api/practice',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify(body)});
 const p=createPracticeHandlers({user:async()=>'verified',topics:async()=>[],run:async()=>{throw Error('daily_practice_limit');}},{secure:false});
 const r=await p.POST(request(next));assert.equal(r.status,403);assert.deepEqual(await r.json(),{error:'daily_practice_limit'});
 const s=simulationHandlers({user:async()=>'verified',catalog:async()=>[],read:async()=>null,run:async()=>{throw Error('daily_simulation_limit');}},{secure:false});
 const sr=await s.POST(request({action:'start',id}));assert.equal(sr.status,403);assert.deepEqual(await sr.json(),{error:'daily_simulation_limit'});
});
