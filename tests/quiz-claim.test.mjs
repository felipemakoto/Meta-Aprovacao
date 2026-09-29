import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { createClaimHandlers } from '../src/lib/quiz/claim-http.ts';
const origin='https://estudos.example', token='a'.repeat(64);
const req=(method='POST',headers={},body,query='')=>new NextRequest(origin+'/api/quiz/saved'+query,{method,headers:{origin,cookie:`__Host-guest_quiz=${token}`,...headers},...(body===undefined?{}:{body})});
const handlers=(deps={},settings={secure:true,origin})=>createClaimHandlers({user:async()=>'verified-user',claim:async()=>{},read:async()=>null,...deps},settings);
test('associa apenas token do cookie e identidade verificada; sem cache',async()=>{
 let args; const r=await handlers({claim:async(...a)=>{args=a}}).POST(req());
 assert.equal(r.status,200);assert.deepEqual(args,[token,'verified-user']);assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('bloqueia CSRF e origem de produção ausente ou insegura antes de acessar dados',async()=>{
 const deps={user:async()=>assert.fail('auth chamada')};
 for(const headers of [{origin:''},{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}]) assert.equal((await handlers(deps).POST(req('POST',headers))).status,403);
 for(const settings of [{secure:true},{secure:true,origin:'invalid'},{secure:true,origin:'http://estudos.example'}]) assert.equal((await handlers(deps,settings).POST(req())).status,403);
});
test('recusa payload e query, inclusive usuário ou tentativa forjados',async()=>{
 const h=handlers({claim:async()=>assert.fail('claim chamada')});
 for(const body of ['{}','{"userId":"other"}','x'.repeat(5000)]) assert.equal((await h.POST(req('POST',{},body))).status,400);
 assert.equal((await h.POST(req('POST',{},undefined,'?id=other'))).status,400);
 assert.equal((await h.GET(req('GET',{},undefined,'?user=other'))).status,400);
});
test('exige sessão e cookie válido, sem chamar associação',async()=>{
 const deps={claim:async()=>assert.fail('claim chamada')};
 assert.equal((await handlers({...deps,user:async()=>null}).POST(req())).status,401);
 for(const cookie of ['', 'guest_quiz='+token,'__Host-guest_quiz=bad']) assert.equal((await handlers(deps).POST(req('POST',{cookie}))).status,404);
});
test('resultado ausente e falha operacional não viram sucesso',async()=>{
 assert.equal((await handlers({claim:async()=>{throw new Error('attempt_unavailable')}}).POST(req())).status,404);
 assert.equal((await handlers({claim:async()=>{throw new Error('private detail')}}).POST(req())).status,503);
 const r=await handlers({user:async()=>{throw new Error('secret')}}).GET(req('GET'));
 assert.equal(r.status,503);assert.equal((await r.text()).includes('secret'),false);
});
test('leitura usa exclusivamente usuário verificado e não precisa de cookie visitante',async()=>{
 let user; const r=await handlers({read:async id=>{user=id;return null}}).GET(req('GET',{cookie:''}));
 assert.equal(user,'verified-user');assert.equal(r.status,404);
 assert.equal((await handlers({user:async()=>null}).GET(req('GET'))).status,401);
 assert.equal((await handlers().GET(req('GET',{'sec-fetch-site':'cross-site'}))).status,403);
});
