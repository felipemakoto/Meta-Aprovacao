import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {loginRateKeys} from '../src/lib/auth/login-rate-limit.ts';
import {createLoginHandlers} from '../src/lib/auth/login-http.ts';
import {registerStudyDocument} from '../src/lib/premium-study/document-registration.ts';
const origin='https://audit.example';
const request=(headers={})=>new NextRequest(origin+'/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify({email:'User@example.test',password:'existing-password'})});

test('limite usa hashes separados e apenas IP do ingresso confiável, sem registrar dados pessoais',()=>{
 const secret='s'.repeat(40),email='User@example.test';
 const a=loginRateKeys(request({'x-vercel-forwarded-for':'192.0.2.1'}),email,secret,true);
 const b=loginRateKeys(request({'x-vercel-forwarded-for':'192.0.2.2'}),email.toUpperCase(),secret,true);
 assert.equal(a.account,b.account);assert.notEqual(a.network,b.network);assert.notEqual(a.pair,b.pair);assert.equal(new Set(Object.values(a)).size,3);
 for(const key of Object.values(a))assert.match(key,/^[a-f0-9]{64}$/);
 const fallback=loginRateKeys(request(),email,secret,false);
 assert.deepEqual(loginRateKeys(request({'x-forwarded-for':'192.0.2.2','x-vercel-forwarded-for':'192.0.2.2'}),email,secret,false),fallback);
 assert.deepEqual(loginRateKeys(request({'x-vercel-forwarded-for':'invalid'}),email,secret,true),fallback);
 assert.throws(()=>loginRateKeys(request(),email,'short',true));
});
test('login bloqueado não chega ao provedor; falha no contador falha fechado; logout permanece disponível',async()=>{
 const deps={signedIn:async()=>false,allowLogin:async()=>false,login:async()=>assert.fail('provedor chamado sem cota'),logout:async()=>({error:null})};
 const h=createLoginHandlers(deps,{secure:true,origin});const denied=await h.login(request());assert.equal(denied.status,429);assert.equal(denied.headers.get('retry-after'),'300');
 const outage=createLoginHandlers({...deps,allowLogin:async()=>{throw Error('private database detail');}},{secure:true,origin});const r=await outage.login(request());assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/private/);
 const logged=createLoginHandlers({...deps,signedIn:async()=>true},{secure:true,origin});assert.equal((await logged.login(request())).status,200);
 assert.equal((await h.logout(new NextRequest(origin+'/api/auth/logout',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'}))).status,200);
});
test('reserva de PDF antecede rede e gravação; limite ou falta de acesso não faz trabalho externo',async()=>{
 for(const message of ['rate_limited','activity_limit','premium_required']){
  await assert.rejects(()=>registerStudyDocument({}, {reserve:async()=>{throw Error(message);},verify:async()=>assert.fail(),save:async()=>assert.fail(),release:async()=>assert.fail()}),new RegExp(message));
 }
 const calls=[];const deps={reserve:async()=>{calls.push('reserve');return 'lease';},verify:async()=>{calls.push('verify');},save:async()=>{calls.push('save');return 'ok';},release:async lease=>{assert.equal(lease,'lease');calls.push('release');}};
 assert.equal(await registerStudyDocument({},deps),'ok');assert.deepEqual(calls,['reserve','verify','save','release']);
 calls.length=0;await assert.rejects(()=>registerStudyDocument({}, {...deps,verify:async()=>{throw Error('invalid_document');}}),/invalid_document/);assert.deepEqual(calls,['reserve','release']);
 calls.length=0;await assert.rejects(()=>registerStudyDocument({}, {...deps,save:async()=>{throw Error('save_failed');}}),/save_failed/);assert.deepEqual(calls,['reserve','verify','release']);
 assert.equal(await registerStudyDocument({}, {...deps,release:async()=>{throw Error('cleanup_failed');}}),'ok');
});
