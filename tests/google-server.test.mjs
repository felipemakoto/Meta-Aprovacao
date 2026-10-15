import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import {isVerifiedGoogleSession} from '../src/lib/auth/google-contract.ts';
import {signupAgreement} from '../src/lib/auth/legal-documents.ts';

function adapter({exchangeError=false,wrongIdentity=false,recordError=false}={}) {
 const committed=[],recorded=[],signedOut=[];let cookieOptions;
 const client={auth:{
  exchangeCodeForSession:async()=>{cookieOptions.setAll([{name:'sb-test-auth-token',value:'opaque-session',options:{path:'/'}}]);return {error:exchangeError?{code:'invalid_code'}:null};},
  getUser:async()=>({error:null,data:{user:{id:'owner',email_confirmed_at:'2026-10-15T22:00:00Z',identities:[{provider:wrongIdentity?'email':'google'}]}}}),
  getClaims:async()=>({error:null,data:{claims:{sub:'owner',role:'authenticated',amr:[{method:'oauth'}]}}}),
  updateUser:async value=>{assert.equal(committed.length,0);recorded.push(value);return {error:recordError?{code:'unavailable'}:null};},
  signOut:async value=>signedOut.push(value),
 }};
 const dependencies={
  'server-only':{},
  '@/lib/supabase/server':{createClient:async()=>client},
  '@/lib/supabase/config':{getSupabaseConfig:()=>({url:'https://abcdefghijklmnopqrst.supabase.co',publishableKey:'sb_publishable_test'})},
  './user':{getVerifiedUser:async()=>null},
  './google-http':{googleHandlers:deps=>deps},
  './google-contract':{isVerifiedGoogleSession},
  '@supabase/ssr':{createServerClient:(url,key,{cookies})=>{cookieOptions=cookies;return client;}},
  'next/headers':{cookies:async()=>({getAll:()=>[],set:(...args)=>committed.push(args)})},
 };
 const filename=fileURLToPath(new URL('../src/lib/auth/google-server.ts',import.meta.url)),require=createRequire(filename),mod=new Module(filename);mod.filename=filename;
 mod.require=name=>Object.hasOwn(dependencies,name)?dependencies[name]:require(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);
 return {finish:mod.exports.googleAuth.finish,committed,recorded,signedOut};
}
test('cookie de sessão só é publicado depois de identidade e registro de concordância aprovados',async()=>{
 const a=adapter(),agreement=signupAgreement();assert.equal(await a.finish('opaque-code',agreement),true);
 assert.deepEqual(a.recorded,[{data:{legal_acceptance:agreement}}]);assert.equal(a.committed.length,1);assert.equal(a.signedOut.length,0);
});
test('troca inválida, identidade errada e falha ao registrar concordância não publicam sessão',async()=>{
 for(const config of [{exchangeError:true},{wrongIdentity:true},{recordError:true}]){
  const a=adapter(config);assert.equal(await a.finish('opaque-code',signupAgreement()),false);assert.equal(a.committed.length,0);
  assert.equal(a.signedOut.length,config.exchangeError?0:1);
  if(a.signedOut.length)assert.deepEqual(a.signedOut[0],{scope:'local'});
 }
});
