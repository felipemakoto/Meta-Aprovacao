import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {createServerClient} from '@supabase/ssr';
import {googleHandlers} from '../src/lib/auth/google-http.ts';
import {googleCallbackPath, googleCookieName, openGoogleAgreement, sealGoogleAgreement, validGoogleAuthorizeUrl, isVerifiedGoogleSession} from '../src/lib/auth/google-contract.ts';
import {legalDocuments} from '../src/lib/auth/legal-documents.ts';

const origin='https://estudos.example',supabaseOrigin='https://abcdefghijklmnopqrst.supabase.co',secret='somente-teste-google-60-'.repeat(3),now=Date.parse('2026-10-15T22:00:00Z');
const settings={secure:true,origin,supabaseOrigin,signingSecret:()=>secret};
const input={acceptedLegal:true,legalVersion:legalDocuments.version};
function authorize(){const url=new URL(supabaseOrigin+'/auth/v1/authorize');url.search=new URLSearchParams({provider:'google',redirect_to:origin+googleCallbackPath,code_challenge_method:'s256',code_challenge:'a'.repeat(43)});return url.href;}
const handlers=(overrides={},s=settings)=>googleHandlers({available:async()=>true,signedIn:async()=>false,begin:async()=>authorize(),finish:async()=>true,...overrides},s);
const request=(body=input,headers={},query='')=>new NextRequest(origin+'/api/auth/google'+query,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const callback=(query='?code=abcdefghijklmnop',cookie=sealGoogleAgreement(origin,secret))=>new NextRequest(origin+googleCallbackPath+query,{headers:{cookie:googleCookieName(true)+'='+cookie}});

test('início exige origem, concordância explícita, versão atual e corpo limitado',async()=>{
 const h=handlers({begin:async()=>assert.fail('início indevido')});
 for(const body of [{},{...input,acceptedLegal:false},{...input,acceptedLegal:'true'},{...input,legalVersion:'anterior'},{...input,provider:'outro'},{...input,accepted_at:'2000-01-01'}])assert.equal((await h.start(request(body))).status,400);
 for(const headers of [{origin:'https://evil.example'},{origin:''},{'sec-fetch-site':'cross-site'}])assert.equal((await h.start(request(input,headers))).status,403);
 assert.equal((await h.start(request('x'.repeat(513)))).status,413);
 assert.equal((await h.start(request(input,{'content-type':'text/plain'}))).status,415);
 assert.equal((await h.start(request(input,{},'?next=https://evil.example'))).status,400);
});
test('provedor desativado, sessão existente e falhas não expõem erros ou iniciam OAuth',async()=>{
 for(const [overrides,status] of [[{available:async()=>false},503],[{signedIn:async()=>true},409],[{available:async()=>{throw Error('private-credential')}},503]]){
  const response=await handlers({...overrides,begin:async()=>assert.fail()}).start(request());assert.equal(response.status,status);assert.doesNotMatch(await response.text(),/private-credential/);assert.equal(response.cookies.get(googleCookieName(true)),undefined);
 }
 assert.deepEqual(await (await handlers({available:async()=>false}).status(new NextRequest(origin+'/api/auth/google/status'))).json(),{enabled:false});
});
test('PKCE real da biblioteca gera URL aceita e cookie temporário HttpOnly assinado',async()=>{
 const jar=new Map();const client=createServerClient(supabaseOrigin,'sb_publishable_apenas_teste_60',{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:changes=>changes.forEach(c=>jar.set(c.name,c.value))}});
 const actual=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:origin+googleCallbackPath,skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
 assert.equal(actual.error,null);assert.equal(validGoogleAuthorizeUrl(actual.data.url,supabaseOrigin,origin),true);assert.ok([...jar.keys()].some(k=>k.includes('code-verifier')));
 const response=await handlers({begin:async value=>{assert.equal(value,origin+googleCallbackPath);return actual.data.url;}}).start(request());
 assert.equal(response.status,200);assert.equal((await response.json()).url,actual.data.url);
 const cookie=response.cookies.get(googleCookieName(true));assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.maxAge,600);assert.equal(cookie.path,'/auth/google');
 assert.equal(openGoogleAgreement(cookie.value,origin,secret).version,legalDocuments.version);assert.match(response.headers.get('cache-control'),/no-store/);
});
test('URL de autorização recusa host, caminho, redirecionamento, provedor ou PKCE adulterados',async()=>{
 for(const mutate of [u=>u.hostname='evil.example',u=>u.pathname='/other',u=>u.searchParams.set('provider','github'),u=>u.searchParams.append('provider','google'),u=>u.searchParams.set('redirect_to','https://evil.example'),u=>u.searchParams.delete('code_challenge'),u=>u.searchParams.set('code_challenge_method','plain')]){
  const url=new URL(authorize());mutate(url);assert.equal(validGoogleAuthorizeUrl(url.href,supabaseOrigin,origin),false);assert.equal((await handlers({begin:async()=>url.href}).start(request())).status,503);
 }
});
test('aceite assinado recusa adulteração, origem diferente, chave alterada e prazo vencido/futuro',()=>{
 const cookie=sealGoogleAgreement(origin,secret,now);assert.equal(openGoogleAgreement(cookie,origin,secret,now).accepted_at,new Date(now).toISOString());
 for(const [value,site,key,time] of [[cookie+'x',origin,secret,now],[cookie,'https://evil.example',secret,now],[cookie,origin,secret+'x',now],[cookie,origin,secret,now+600001],[cookie,origin,secret,now-1],[undefined,origin,secret,now]])assert.equal(openGoogleAgreement(value,site,key,time),null);
});
test('callback só troca código com concordância válida e apaga cookie, sem destino externo',async()=>{
 let received;const response=await handlers({finish:async(...args)=>{received=args;return true;}}).callback(callback());
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),origin+'/cadastro/confirmado');assert.equal(received[0],'abcdefghijklmnop');assert.equal(received[1].terms_accepted,true);assert.equal(response.cookies.get(googleCookieName(true)).maxAge,0);assert.equal(response.headers.get('referrer-policy'),'no-referrer');
 for(const query of ['','?error=access_denied','?code=curto','?code=abcdefghijklmnop&code=abcdefghijklmnop','?code=abcdefghijklmnop&next=https://evil.example']){
  const r=await handlers({finish:async()=>assert.fail('troca indevida')}).callback(callback(query));assert.equal(r.headers.get('location'),origin+'/auth/google/erro');
 }
 assert.equal((await handlers({finish:async()=>assert.fail()}).callback(callback('?code=abcdefghijklmnop','invalid'))).headers.get('location'),origin+'/auth/google/erro');
 assert.equal((await handlers({finish:async()=>{throw Error('provider-secret')}}).callback(callback())).headers.get('location'),origin+'/auth/google/erro');
});
test('identidade Google confirmada precisa de autenticação OAuth verificada, nunca recuperação',()=>{
 const user={id:'owner',email_confirmed_at:'2026-10-15T22:00:00Z',identities:[{provider:'google'}]},claims={sub:'owner',role:'authenticated',amr:[{method:'oauth'}]};
 assert.equal(isVerifiedGoogleSession(user,claims),true);
 for(const patch of [{sub:'other'},{role:'anon'},{amr:[{method:'password'}]},{amr:[{method:'oauth'},{method:'recovery'}]},{amr:[]}])assert.equal(isVerifiedGoogleSession(user,{...claims,...patch}),false);
 assert.equal(isVerifiedGoogleSession({...user,email_confirmed_at:null},claims),false);assert.equal(isVerifiedGoogleSession({...user,identities:[{provider:'email'}]},claims),false);
});
