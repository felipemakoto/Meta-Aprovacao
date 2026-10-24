import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import {NextRequest} from 'next/server.js';
import {trustedAuthOrigin,authHeaders} from '../src/lib/auth/signup-http.ts';
import {readAuthJson,AuthBodyError} from '../src/lib/auth/request-body.ts';
import {parsePreferences,preferenceDefaults,changesPremiumPreferences} from '../src/lib/account/settings-contract.ts';
const origin='https://settings.example';process.env.APP_ORIGIN=origin;
function load({authenticated=true,provider='email',passwordOK=true,financial=false,premium=false,subscriptionFailure=false,currentPreferences=preferenceDefaults,amr=[{method:'oauth',timestamp:Math.floor(Date.now()/1000)}]}={}){
 const calls=[];const user={id:'owner',email:'owner@example.test',email_confirmed_at:'2026-10-24',app_metadata:{provider},user_metadata:{}};
 const client={auth:{getClaims:async()=>({data:{claims:{sub:'owner',amr}},error:null}),getSession:async()=>({data:{session:{access_token:'opaque'}}}),signOut:async()=>{calls.push('signout');return {error:null};}}};
 const stubs={
 'server-only':{},
 '@supabase/supabase-js':{createClient:()=>({auth:{signInWithPassword:async input=>{calls.push(['password',input.email]);return {error:passwordOK?null:{},data:{user:passwordOK?{id:'owner'}:null,session:null}};},signOut:async()=>({error:null})}})},
 '@/lib/supabase/server':{createClient:async()=>client},
 '@/lib/supabase/admin':{createAdminClient:()=>({auth:{admin:{signOut:async()=>({error:null})}}})},
 '@/lib/supabase/config':{getSupabaseConfig:()=>({url:'https://example.supabase.co',publishableKey:'public'})},
 '@/lib/auth/user':{getVerifiedUser:async()=>authenticated?user:null},
 '@/lib/auth/signup-http':{trustedAuthOrigin,authHeaders},
 '@/lib/auth/request-body':{readAuthJson,AuthBodyError},
 '@/lib/data/account-settings':{readPreferences:async()=>currentPreferences,accountSettingsRpc:async(name,args)=>{calls.push([name,args]);if(name==='delete_unbilled_account'){if(financial)throw Error('subscription_review_required');return true;}return name==='account_security_summary'?{sessions:[]}:{};}},
 '@/lib/data/account':{readAccountAvatar:async()=>null,reserveAccountUpdate:async id=>calls.push(['reserve',id])},
 '@/lib/account/settings-contract':{parsePreferences,changesPremiumPreferences},
 '@/lib/data/subscriptions':{readSubscriptionAccess:async()=>{if(subscriptionFailure)throw Error('subscription_unavailable');return {hasPremium:premium,accessUntil:premium?'2099-01-01T00:00:00Z':null};}},
 '@/lib/subscriptions/contract':{parseSubscriptionAccess:v=>v},
 };
 const filename=fileURLToPath(new URL('../src/app/api/account/settings/route.ts',import.meta.url)),require=createRequire(filename),mod=new Module(filename);mod.filename=filename;mod.require=name=>Object.hasOwn(stubs,name)?stubs[name]:require(name);mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,filename);return {...mod.exports,calls};
}
const req=(body,headers={})=>new NextRequest(origin+'/api/account/settings',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const deletion={action:'delete',confirmation:'EXCLUIR',password:'test-only'};
test('configurações rejeitam visitante, CSRF, IDOR e campos fora do contrato antes de gravar',async()=>{
 const guest=load({authenticated:false});assert.equal((await guest.GET(new Request(origin+'/api/account/settings'))).status,401);
 const app=load();assert.equal((await app.POST(req({action:'export'},{origin:'https://evil.example'}))).status,403);
 assert.equal((await app.POST(req({action:'export',userId:'other'}))).status,400);
 assert.equal((await app.POST(req({action:'save',preferences:{...preferenceDefaults,role:'admin'}}))).status,400);assert.deepEqual(app.calls,[]);
 assert.equal((await app.GET(new Request(origin+'/api/account/settings?userId=other'))).status,400);
 assert.equal((await app.GET(new Request(origin+'/api/account/settings?view=preferences'))).status,200);assert.deepEqual(app.calls,[]);
 assert.equal((await app.POST(req({action:'save',preferences:preferenceDefaults}))).status,200);assert.equal(app.calls[0][1].p_user_id,'owner');
});
test('exclusão exige confirmação, senha e resultado confirmado; pendência financeira preserva conta',async()=>{
 const app=load({passwordOK:false});assert.equal((await app.POST(req({...deletion,confirmation:'sim'}))).status,400);assert.equal((await app.POST(req(deletion))).status,403);assert.ok(!app.calls.some(c=>c[0]==='delete_unbilled_account'));
 const paid=load({financial:true});const blocked=await paid.POST(req(deletion));assert.equal(blocked.status,409);assert.equal((await blocked.json()).error,'subscription_review_required');assert.ok(!paid.calls.includes('signout'));
 const free=load();assert.deepEqual(await(await free.POST(req(deletion))).json(),{status:'deleted'});assert.ok(free.calls.includes('signout'));
});
test('Google requer OAuth recente, não aceita recuperação nem relógio futuro',async()=>{
 const now=Math.floor(Date.now()/1000);
 for(const amr of [[{method:'oauth',timestamp:now-301}],[{method:'oauth',timestamp:now+60}],[{method:'recovery',timestamp:now}],['oauth']])assert.equal((await load({provider:'google',amr}).POST(req({...deletion,password:''}))).status,403);
 const google=load({provider:'google'});assert.equal((await google.POST(req({...deletion,password:''}))).status,200);assert.ok(!google.calls.some(c=>c[0]==='password'));
});

test('preferências exclusivas exigem Premium no servidor, sem bloquear o Gratuito ou apagar dados no downgrade',async()=>{
 for(const patch of [{customCount:30},{customMinutes:90},{notifyStudy:false},{notifyReview:false},{quietStart:'22:00',quietEnd:'08:00'}]){const app=load();const r=await app.POST(req({action:'save',preferences:{...preferenceDefaults,...patch}}));assert.equal(r.status,403);assert.equal((await r.json()).error,'premium_required');assert.ok(!app.calls.some(c=>c[0]==='save_account_preferences'));}
 const paid=load({premium:true});assert.equal((await paid.POST(req({action:'save',preferences:{...preferenceDefaults,customCount:30}}))).status,200);
 const offline=load({premium:true,subscriptionFailure:true});assert.equal((await offline.POST(req({action:'save',preferences:{...preferenceDefaults,customCount:30}}))).status,503);assert.ok(!offline.calls.some(c=>c[0]==='save_account_preferences'));
 const previous={...preferenceDefaults,customCount:40,quietStart:'22:00',quietEnd:'08:00'};const downgraded=load({currentPreferences:previous});assert.equal((await downgraded.POST(req({action:'save',preferences:{...previous,dailyGoal:15,difficulty:'hard'}}))).status,200);
});
