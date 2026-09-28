import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { parseSignup } from '../src/lib/auth/signup-contract.ts';
import { createSignupHandlers } from '../src/lib/auth/signup-http.ts';
const origin = 'https://estudos.example';
const input = {email:'aluno@example.test', password:'apenas-teste-123',confirmPassword:'apenas-teste-123'};
const req = (body=input,headers={},query='') => new NextRequest(origin+'/api/auth/signup'+query,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const handlers = (overrides={},settings={secure:true,origin}) => createSignupHandlers({signedIn:async()=>false,signup:async()=>({error:null,confirmed:false}),exchange:async()=>true,...overrides},settings);

test('valida campos, tamanho em bytes e confirmação, sem aceitar metadados',()=>{
 assert.equal(parseSignup({...input,email:' aluno@example.test '}).email,input.email);
 for(const value of [null,[],{}, {...input,role:'admin'}, {...input,email:'invalido'}, {...input,password:'curta'}, {...input,confirmPassword:'diferente'}, {...input,password:'á'.repeat(40),confirmPassword:'á'.repeat(40)}, {...input,password:1}]) assert.equal(parseSignup(value),null);
});
test('cadastro não devolve identidade, senha ou sessão e destino é fixo',async()=>{
 let received;
 const r=await handlers({signup:async value=>{received=value;return {error:null,confirmed:false,user:{id:'private'},session:{access_token:'secret'}};}}).POST(req());
 assert.equal(r.status,202); assert.deepEqual(await r.json(),{status:'check_email'});
 assert.deepEqual(received,{email:input.email,password:input.password,redirectTo:origin+'/auth/confirm'});
 assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('origens inseguras, CSRF e origem ausente não chamam serviço',async()=>{
 const deps={signup:async()=>assert.fail('chamada indevida')};
 for(const headers of [{origin:''},{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}]) assert.equal((await handlers(deps).POST(req(input,headers))).status,403);
 for(const settings of [{secure:true},{secure:true,origin:'http://estudos.example'},{secure:true,origin:'invalid'}]) assert.equal((await handlers(deps,settings).POST(req())).status,403);
});
test('corpo inválido, gigante ou query não chegam ao serviço',async()=>{
 const h=handlers({signup:async()=>assert.fail('chamada indevida')});
 assert.equal((await h.POST(req('x'.repeat(2049)))).status,413);
 assert.equal((await h.POST(req('{'))).status,400);
 assert.equal((await h.POST(req({...input,redirectTo:'https://evil.example'}))).status,400);
 assert.equal((await h.POST(req(input,{},'?next=https://evil.example'))).status,400);
 assert.equal((await h.POST(req(input,{'content-type':'text/plain'}))).status,415);
});
test('conta existente recebe mesma resposta e erros remotos não vazam',async()=>{
 for(const code of ['user_already_exists','email_exists']) assert.deepEqual(await (await handlers({signup:async()=>({error:{code},confirmed:false})}).POST(req())).json(),{status:'check_email'});
 for(const [code,status] of [['over_email_send_rate_limit',429],['weak_password',422],['email_address_invalid',400],['unexpected',503]]) {
   const r=await handlers({signup:async()=>({error:{code,message:input.password},confirmed:false})}).POST(req());
   assert.equal(r.status,status);assert.ok(!(await r.text()).includes(input.password));
 }
 assert.equal((await handlers({signup:async()=>{throw Error('private');}}).POST(req())).status,503);
});
test('sessão ativa não é substituída pelo cadastro',async()=>{
 assert.equal((await handlers({signedIn:async()=>true,signup:async()=>assert.fail('chamada indevida')}).POST(req())).status,409);
});
test('confirmação remove código da URL e ignora destino externo',async()=>{
 let code;
 const r=await handlers({exchange:async value=>{code=value;return true;}}).GET(new NextRequest(origin+'/auth/confirm?code=abcdefghijklmnop&next=https://evil.example'));
 assert.equal(code,'abcdefghijklmnop'); assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+'/cadastro/confirmado');
 assert.equal(r.headers.get('referrer-policy'),'no-referrer');assert.match(r.headers.get('cache-control'),/no-store/);
});
test('código ausente, duplicado, expirado e falha de troca não confirmam conta',async()=>{
 for(const query of ['', '?code=curto','?code=abcdefghijklmnop&code=abcdefghijklmnop','?error=access_denied&code=abcdefghijklmnop']) {
   const r=await handlers({exchange:async()=>assert.fail('chamada indevida')}).GET(new NextRequest(origin+'/auth/confirm'+query));
   assert.equal(r.headers.get('location'),origin+'/cadastro/confirmacao-invalida');
 }
 for(const exchange of [async()=>false,async()=>{throw Error('indisponível');}]) assert.equal((await handlers({exchange}).GET(new NextRequest(origin+'/auth/confirm?code=abcdefghijklmnop'))).headers.get('location'),origin+'/cadastro/confirmacao-invalida');
});
test('callback local preserva host do cookie e rejeita host arbitrário',async()=>{
 const h=handlers({}, {secure:false});
 const make=host=>new NextRequest('http://localhost:3000/auth/confirm?code=abcdefghijklmnop',{headers:{host}});
 assert.equal((await h.GET(make('127.0.0.1:3000'))).headers.get('location'),'http://127.0.0.1:3000/cadastro/confirmado');
 assert.equal((await h.GET(make('evil.example'))).status,503);
});
