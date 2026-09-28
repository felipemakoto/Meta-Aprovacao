import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { createLoginHandlers } from '../src/lib/auth/login-http.ts';
import { parseLogin } from '../src/lib/auth/login-contract.ts';
const origin = 'https://estudos.example';
const input = {email:'aluno@example.test',password:' existing password '};
const req = (body=input, headers={}, query='') => new NextRequest(origin+'/api/auth/login'+query,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const handlers = (overrides={},settings={secure:true,origin}) => createLoginHandlers({signedIn:async()=>false,login:async()=>({error:null}),logout:async()=>({error:null}),...overrides},settings);
test('login preserva senha existente e rejeita campos extras e tamanho abusivo',()=>{
 assert.deepEqual(parseLogin({...input,email:' aluno@example.test '}),input);
 assert.ok(parseLogin({...input,password:'curta'}));
 for(const value of [null, [], {}, {...input,password:''}, {...input,email:'a'}, {...input,role:'admin'}, {...input,password:'á'.repeat(513)}]) assert.equal(parseLogin(value),null);
});
test('sucesso não expõe credenciais ou tokens e impede cache',async()=>{
 let received;
 const r=await handlers({login:async value=>{received=value;return {error:null,session:{access_token:'secret'}};}}).login(req());
 assert.deepEqual(received,input);assert.deepEqual(await r.json(),{status:'signed_in'});
 assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('CSRF, origem ausente e configuração insegura bloqueiam login e logout',async()=>{
 const deps={login:async()=>assert.fail('indevido'),logout:async()=>assert.fail('indevido')};
 for(const method of ['login','logout']) {
  for(const headers of [{origin:''},{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}]) assert.equal((await handlers(deps)[method](req(method==='logout'?{}:input,headers))).status,403);
  assert.equal((await handlers(deps,{secure:true})[method](req())).status,403);
 }
});
test('corpo grande, JSON malformado, query e tipo inadequado são rejeitados',async()=>{
 for(const method of ['login','logout']) {
  const h=handlers({login:async()=>assert.fail(),logout:async()=>assert.fail()});
  assert.equal((await h[method](req('x'.repeat(4097)))).status,413);
  assert.equal((await h[method](req('{'))).status,400);
  assert.equal((await h[method](req(input,{},'?next=https://evil.example'))).status,400);
  assert.equal((await h[method](req(input,{'content-type':'text/plain'}))).status,415);
 }
});
test('erros de conta recebem resposta genérica; limite e falhas operacionais são distintos',async()=>{
 for(const [code,status] of [['invalid_credentials',401],['email_not_confirmed',401],['user_banned',401],['over_request_rate_limit',429],['unexpected',503]]) {
  const r=await handlers({login:async()=>({error:{code,message:input.password}})}).login(req());
  assert.equal(r.status,status);const body=await r.json();
  if(status===401) assert.deepEqual(body,{error:'invalid_credentials'});
  assert.ok(!JSON.stringify(body).includes(input.password));
 }
 assert.equal((await handlers({login:async()=>{throw Error('private');}}).login(req())).status,503);
});
test('sessão existente não troca conta; logout aceita só objeto vazio e reporta falhas',async()=>{
 assert.deepEqual(await (await handlers({signedIn:async()=>true,login:async()=>assert.fail()}).login(req())).json(),{status:'signed_in'});
 assert.deepEqual(await (await handlers().logout(req({}))).json(),{status:'signed_out'});
 for(const body of [[],null,{scope:'global'}]) assert.equal((await handlers().logout(req(body))).status,400);
 assert.equal((await handlers({logout:async()=>({error:{status:503}})}).logout(req({}))).status,503);
});
