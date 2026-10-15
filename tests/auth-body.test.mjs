import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {createSignupHandlers} from '../src/lib/auth/signup-http.ts';
import {createLoginHandlers} from '../src/lib/auth/login-http.ts';
import {createRecoveryHandlers} from '../src/lib/auth/recovery-http.ts';
import {googleHandlers} from '../src/lib/auth/google-http.ts';

const origin='https://auth.example',settings={secure:true,origin};
const forbidden=async()=>assert.fail('Body inválido chegou à autenticação');
const signup=createSignupHandlers({signedIn:forbidden,signup:forbidden,exchange:forbidden},settings);
const login=createLoginHandlers({signedIn:forbidden,login:forbidden,logout:forbidden},settings);
const recovery=createRecoveryHandlers({request:forbidden,authorized:forbidden,update:forbidden,finish:forbidden},settings);
const google=googleHandlers({available:forbidden,signedIn:forbidden,begin:forbidden,finish:forbidden},{...settings,supabaseOrigin:'https://abcdefghijklmnopqrst.supabase.co',signingSecret:forbidden});
const handlers=[signup.POST,login.login,login.logout,recovery.request,recovery.update,google.start];
const request=body=>new NextRequest(origin+'/api/auth/test',{method:'POST',headers:{origin,'content-type':'application/json'},body,duplex:'half'});

test('todos os formulários encerram corpo parado mesmo com cancelamento que não resolve',{timeout:8000},async()=>{
 const responses=await Promise.all(handlers.map(handle=>handle(request(new ReadableStream({
  start(c){c.enqueue(new TextEncoder().encode('{'));},cancel(){return new Promise(()=>{});},
 })))));
 for(const response of responses){assert.equal(response.status,408);assert.deepEqual(await response.json(),{error:'request_timeout'});assert.match(response.headers.get('cache-control'),/private.*no-store/);}
});

test('limite em bytes e UTF-8 inválido recusados sem aguardar cancelamento ou chamar provedor',async()=>{
 for(const handle of handlers){
  const large=await handle(request(new ReadableStream({start(c){c.enqueue(new Uint8Array(4097));},cancel(){return new Promise(()=>{});}})));
  assert.equal(large.status,413);assert.deepEqual(await large.json(),{error:'invalid_input'});
  const invalid=await handle(request(new ReadableStream({start(c){c.enqueue(new Uint8Array([255]));c.close();}})));
  assert.equal(invalid.status,400);assert.deepEqual(await invalid.json(),{error:'invalid_input'});
  const broken=await handle(request(new ReadableStream({start(c){c.error(Error('private-stream-detail'));}})));
  assert.equal(broken.status,400);assert.deepEqual(await broken.json(),{error:'invalid_input'});
 }
});
