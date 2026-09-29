import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {createRecoveryHandlers} from '../src/lib/auth/recovery-http.ts';
import {createSignupHandlers} from '../src/lib/auth/signup-http.ts';
import {isRecentRecovery,parseNewPassword,parseRecoveryEmail} from '../src/lib/auth/recovery-contract.ts';
const origin='https://estudos.example';
const password={password:'nova-senha-teste',confirmPassword:'nova-senha-teste'};
const request=(body,headers={},query='')=>new NextRequest(origin+'/api/auth/recovery'+query,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const handlers=(overrides={},settings={secure:true,origin})=>createRecoveryHandlers({request:async()=>({error:null}),authorized:async()=>true,update:async()=>({error:null}),finish:async()=>{},...overrides},settings);
test('campos exatos, confirmação e limite em bytes',()=>{
 assert.equal(parseRecoveryEmail({email:' aluno@example.test '}),'aluno@example.test');
 for(const input of [null,[],{email:'invalido'},{email:'a@b.co',next:'/admin'}]) assert.equal(parseRecoveryEmail(input),null);
 assert.equal(parseNewPassword(password),password.password);
 for(const input of [null,{}, {...password,role:'admin'}, {...password,password:'curta'}, {...password,confirmPassword:'outra'}, {password:'á'.repeat(40),confirmPassword:'á'.repeat(40)}]) assert.equal(parseNewPassword(input),null);
});
test('claims de recuperação devem estar verificados, recentes e ligados ao usuário',()=>{
 const claims={sub:'user',role:'authenticated',session_id:'session',exp:2000,amr:[{method:'recovery',timestamp:900}]};
 assert.equal(isRecentRecovery(claims,'user',1000),true);
 for(const altered of [{sub:'other'},{exp:999},{amr:[{method:'password',timestamp:999}]},{amr:[{method:'recovery',timestamp:1001}]},{amr:[{method:'recovery',timestamp:100}]},{amr:[null]},{amr:undefined},{session_id:null}]) assert.equal(isRecentRecovery({...claims,...altered},'user',1000),false);
});
test('solicitação usa destino fixo e resposta neutra sem dados pessoais',async()=>{
 let received;
 const r=await handlers({request:async(...args)=>{received=args;return {error:null,user:'private'};}}).request(request({email:'aluno@example.test'}));
 assert.deepEqual(received,['aluno@example.test',origin+'/auth/confirm']);
 assert.equal(r.status,202);assert.deepEqual(await r.json(),{status:'check_email'});assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('CSRF, produção sem origem, corpos abusivos, query e conteúdo inválido bloqueados',async()=>{
 const deps={request:async()=>assert.fail(),update:async()=>assert.fail()};
 for(const method of ['request','update']) {
  for(const headers of [{origin:''},{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}]) assert.equal((await handlers(deps)[method](request({},headers))).status,403);
  assert.equal((await handlers(deps,{secure:true})[method](request({}))).status,403);
  assert.equal((await handlers(deps)[method](request('x'.repeat(2049)))).status,413);
  assert.equal((await handlers(deps)[method](request('{'))).status,400);
  assert.equal((await handlers(deps)[method](request({}, {}, '?next=evil'))).status,400);
  assert.equal((await handlers(deps)[method](request({}, {'content-type':'text/plain'}))).status,415);
 }
});
test('sessão comum ou expirada nunca chega à atualização',async()=>{
 const r=await handlers({authorized:async()=>false,update:async()=>assert.fail(),finish:async()=>assert.fail()}).update(request(password));
 assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'recovery_required'});
});
test('atualização autorizada encerra contexto apenas após sucesso',async()=>{
 const calls=[];
 const h=handlers({authorized:async()=>{calls.push('authorize');return true;},update:async p=>{assert.equal(p,password.password);calls.push('update');return {error:null};},finish:async()=>calls.push('finish')});
 assert.deepEqual(await (await h.update(request(password))).json(),{status:'password_updated'});
 assert.deepEqual(calls,['authorize','update','finish']);
 assert.equal((await handlers({update:async()=>({error:{code:'same_password'}}),finish:async()=>assert.fail()}).update(request(password))).status,422);
});
test('falhas remotas não vazam senha nem mensagens; limite distinguível',async()=>{
 for(const [code,status] of [['over_request_rate_limit',429],['weak_password',422],['session_not_found',401],['unexpected',503]]) {
  const r=await handlers({update:async()=>({error:{code,message:password.password}})}).update(request(password));
  assert.equal(r.status,status);assert.ok(!(await r.text()).includes(password.password));
 }
 assert.equal((await handlers({request:async()=>{throw Error('private');}}).request(request({email:'a@b.co'}))).status,503);
});
test('callback distingue recuperação verificada e ignora parâmetro type arbitrário',async()=>{
 for(const [exchange,path] of [[async()=> 'recovery','/nova-senha'],[async()=>true,'/cadastro/confirmado'],[async()=>false,'/cadastro/confirmacao-invalida']]) {
  const h=createSignupHandlers({signedIn:async()=>false,signup:async()=>({error:null,confirmed:false}),exchange},{secure:true,origin});
  const r=await h.GET(new NextRequest(origin+'/auth/confirm?code=abcdefghijklmnop&type=recovery&next=https://evil.example'));
  assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+path);
 }
});
