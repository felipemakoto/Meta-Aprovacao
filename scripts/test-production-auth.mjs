// Real provider tokens for one disposable account; no email delivery or real-user password change.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
const origin='https://meta-aprovacao.vercel.app',tag=randomUUID(),email='auth-smoke-'+tag+'@example.invalid';
const password=randomBytes(24).toString('base64url'),nextPassword=randomBytes(24).toString('base64url');
const checks=[],jar=new Map();let phase='configuration',fixtureAttempted=false,cleaned=false;
function passed(name){checks.push(name);}
async function request(route,{body,method='GET',expected=200}={}){
 const headers={Cookie:[...jar].map(([k,v])=>k+'='+v).join('; ')};
 if(method==='POST'){headers.Origin=origin;headers['Content-Type']='application/json';}
 const r=await fetch(origin+route,{method,headers,redirect:'manual',signal:AbortSignal.timeout(15000),...(body!==undefined?{body:JSON.stringify(body)}:{})});
 for(const v of r.headers.getSetCookie()){const p=v.split(';')[0],i=p.indexOf('=');if(/max-age=0(?:;|$)/i.test(v))jar.delete(p.slice(0,i));else jar.set(p.slice(0,i),p.slice(i+1));}
 assert.equal(r.status,expected);return r;
}
async function json(route,options){const r=await request(route,options);assert.match(r.headers.get('cache-control'),/no-store/);return r.json();}
async function cleanup(){
 if(!fixtureAttempted)return;
 // Exact random email AND marker scope deletion, including an uncertain create-user response.
 const sql=`begin;set local statement_timeout='15s';
 create temporary table smoke_fixture as select id from auth.users where email='${email}' and raw_user_meta_data->>'fixture'='${tag}';
 do $$begin if (select count(*) from smoke_fixture)>1 then raise exception 'smoke_cleanup_ambiguous';end if;end$$;
 delete from auth.users where id in(select id from smoke_fixture);
 do $$begin if exists(select 1 from auth.users where email='${email}') or
 exists(select 1 from private.practice_attempts where user_id in(select id from smoke_fixture)) or
 exists(select 1 from private.practice_requests where user_id in(select id from smoke_fixture)) or
 exists(select 1 from private.simulation_attempts where user_id in(select id from smoke_fixture)) or
 exists(select 1 from private.checkout_intents where user_id in(select id from smoke_fixture)) or
 exists(select 1 from private.subscriptions where user_id in(select id from smoke_fixture)) then raise exception 'smoke_cleanup_failed';end if;end$$;
 select true as production_smoke_fixture_removed;commit;`;
 const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
 mkdirSync('supabase/.temp',{recursive:true});const file=path.resolve(`supabase/.temp/production-smoke-${tag}.sql`);
 try{
  writeFileSync(file,sql);
  const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file],{encoding:'utf8',windowsHide:true,timeout:45000});
  if(r.status!==0||r.error||/"_tag"\s*:\s*"Error"/.test(r.stdout)||!r.stdout.includes('production_smoke_fixture_removed'))throw Error('cleanup_unavailable');
  cleaned=true;
 }finally{rmSync(file,{force:true});}
}

try{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 assert.equal(new URL(url).hostname,readFileSync('supabase/.temp/project-ref','utf8').trim()+'.supabase.co');
 assert.ok(process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'));assert.ok(key?.startsWith('sb_publishable_'));
 const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const client=createServerClient(url,key,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>{for(const {name,value,options} of items){if(options?.maxAge===0)jar.delete(name);else jar.set(name,value);}}}});
 phase='public_auth_settings';
 const settingsResponse=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(10000)});assert.equal(settingsResponse.status,200);
 const settings=await settingsResponse.json();assert.equal(settings.external.email,true);assert.equal(settings.mailer_autoconfirm,false);assert.equal(settings.disable_signup,false);
 passed('signup_enabled_and_confirmation_required');
 phase='signup_token';fixtureAttempted=true;
 const signup=await admin.auth.admin.generateLink({type:'signup',email,password,options:{redirectTo:origin+'/auth/confirm',data:{fixture:tag}}});
 assert.equal(signup.error,null);assert.ok(signup.data.user.id);assert.ok(!signup.data.user.email_confirmed_at);
 assert.equal(signup.data.properties.redirect_to,origin+'/auth/confirm');
 assert.deepEqual(await json('/api/auth/login',{method:'POST',body:{email,password},expected:401}),{error:'invalid_credentials'});
 passed('unconfirmed_account_cannot_login');
 phase='verify_signup';
 const confirmed=await client.auth.verifyOtp({type:'signup',token_hash:signup.data.properties.hashed_token});assert.equal(confirmed.error,null);
 assert.ok(confirmed.data.user.email_confirmed_at);
 assert.deepEqual(await json('/api/auth/status'),{authenticated:true});
 assert.match(await (await request('/cadastro/confirmado')).text(),/E-mail confirmado/);
 passed('provider_confirmation_and_verified_page');
 const reused=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).auth.verifyOtp({type:'signup',token_hash:signup.data.properties.hashed_token});assert.ok(reused.error);
 passed('confirmation_token_cannot_be_reused');
 phase='ordinary_session';
 assert.deepEqual(await json('/api/auth/logout',{method:'POST',body:{}}),{status:'signed_out'});
 assert.deepEqual(await json('/api/auth/login',{method:'POST',body:{email,password}}),{status:'signed_in'});
 assert.deepEqual(await json('/api/auth/password',{method:'POST',body:{password:nextPassword,confirmPassword:nextPassword},expected:401}),{error:'recovery_required'});
 passed('ordinary_session_cannot_reset_password');
 phase='recovery_token';
 await json('/api/auth/logout',{method:'POST',body:{}});jar.clear();
 const recovery=await admin.auth.admin.generateLink({type:'recovery',email,options:{redirectTo:origin+'/auth/confirm'}});assert.equal(recovery.error,null);
 assert.equal(recovery.data.properties.redirect_to,origin+'/auth/confirm');
 const action=new URL(recovery.data.properties.action_link);assert.equal(action.origin,new URL(url).origin);assert.equal(action.pathname,'/auth/v1/verify');
 const verified=await fetch(action,{redirect:'manual',signal:AbortSignal.timeout(10000)});assert.ok([302,303].includes(verified.status));
 const target=new URL(verified.headers.get('location'));assert.equal(target.origin,origin);assert.equal(target.pathname,'/auth/confirm');
 const params=new URLSearchParams(target.hash.slice(1));assert.ok(params.get('access_token'));assert.ok(params.get('refresh_token'));
 const recovered=await client.auth.setSession({access_token:params.get('access_token'),refresh_token:params.get('refresh_token')});assert.equal(recovered.error,null);
 phase='implicit_session_guard';
 // Administrative links produce OTP sessions without this application's PKCE recovery context.
 // Do not weaken the recovery guard to turn this administrative test into a positive reset.
 assert.match(await (await request('/nova-senha')).text(),/Solicite um novo link/);
 assert.deepEqual(await json('/api/auth/password',{method:'POST',body:{password:nextPassword,confirmPassword:nextPassword},expected:401}),{error:'recovery_required'});
 assert.deepEqual(await json('/api/auth/logout',{method:'POST',body:{}}),{status:'signed_out'});
 assert.deepEqual(await json('/api/auth/login',{method:'POST',body:{email,password:nextPassword},expected:401}),{error:'invalid_credentials'});
 assert.deepEqual(await json('/api/auth/login',{method:'POST',body:{email,password}}),{status:'signed_in'});
 assert.deepEqual(await json('/api/auth/logout',{method:'POST',body:{}}),{status:'signed_out'});
 passed('implicit_session_denied_and_fixture_password_preserved');
 const replay=await createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).auth.verifyOtp({type:'recovery',token_hash:recovery.data.properties.hashed_token});assert.ok(replay.error);
 passed('recovery_token_cannot_be_reused');
}catch{console.error(JSON.stringify({passed:false,phase,checks}));process.exitCode=1;}
finally{try{await cleanup();}catch{console.error(JSON.stringify({passed:false,phase:'fixture_cleanup'}));process.exitCode=1;}}
console.log(JSON.stringify({sampledAt:new Date().toISOString(),passed:!process.exitCode,checks,fixtureRemoved:cleaned,emailSent:false,passwordChangeTested:false,pkceEmailFlowTested:false,userPasswordChanged:false}));
