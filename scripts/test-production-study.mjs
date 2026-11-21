// Exercises the published site with one disposable account. Never calls the payment provider.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {checkoutEnabled} from '../src/lib/subscriptions/checkout-launch.ts';

const origin='https://meta-aprovacao.vercel.app';
const tag=randomUUID(),email=`production-smoke-${tag}@example.invalid`,password=randomBytes(32).toString('base64url');
const checks=[],jar=new Map();let phase='configuration',fixtureAttempted=false,cleaned=false,admin;
const bank=new Map(JSON.parse(readFileSync('content/banco-etec-if.json','utf8')).questions.map(q=>[q.id,q]));
const models=JSON.parse(readFileSync('content/revisao-etapa-47.json','utf8')).models.map(m=>m.after);
function passed(name){checks.push(name);}
async function request(route,{body,method='GET',authenticated=true,expected=200}={}){
 const headers={};
 if(authenticated&&jar.size)headers.Cookie=[...jar].map(([k,v])=>`${k}=${v}`).join('; ');
 if(method==='POST'){headers.Origin=origin;if(body!==undefined)headers['Content-Type']='application/json';}
 const response=await fetch(origin+route,{method,headers,redirect:'manual',signal:AbortSignal.timeout(15000),...(body!==undefined?{body:JSON.stringify(body)}:{})});
 if(authenticated)for(const value of response.headers.getSetCookie()){
  const pair=value.split(';')[0],i=pair.indexOf('=');
  if(/max-age=0(?:;|$)/i.test(value))jar.delete(pair.slice(0,i));else jar.set(pair.slice(0,i),pair.slice(i+1));
 }
 assert.equal(response.status,expected);return response;
}
async function json(route,options){const r=await request(route,options);assert.match(r.headers.get('cache-control'),/no-store/);return r.json();}
function noAnswers(value){assert.doesNotMatch(JSON.stringify(value),/"(?:correctAnswer|explanation|snapshots|answer)"\s*:/);}
function checkFeedback(value){const source=bank.get(value.id);assert.ok(source);assert.equal(value.correctAnswer,source.correctAnswer);assert.equal(value.explanation,source.explanation);}
async function cleanup(){
 if(!fixtureAttempted)return;
 // Exact random email AND marker scope deletion, including an uncertain create-user response.
 const sql=`begin;set local statement_timeout='15s';
 create temporary table smoke_fixture as select id from auth.users where email='${email}' and raw_app_meta_data->>'fixture'='${tag}';
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
 assert.equal(checkoutEnabled,true);
 assert.match(process.env.NEXT_PUBLIC_SUPABASE_URL??'',/^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
 assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,readFileSync('supabase/.temp/project-ref','utf8').trim()+'.supabase.co');
 assert.ok(process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'));
 assert.equal(models.length,6);assert.equal(models.filter(m=>m.free_access).length,1);
 admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 phase='public_routes';
 await request('/',{authenticated:false});await request('/login',{authenticated:false});
 assert.equal((await request('/premium',{authenticated:false,expected:307})).headers.get('location'),'/login');
 assert.deepEqual(await json('/api/auth/status',{authenticated:false,expected:401}),{authenticated:false});
 passed('public_routes_and_anonymous_protection');
 phase='create_fixture';fixtureAttempted=true;
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{fixture:tag}});
 assert.equal(created.error,null);assert.ok(created.data.user?.id);
 phase='login';
 assert.deepEqual(await json('/api/auth/login',{method:'POST',body:{email,password}}),{status:'signed_in'});
 assert.ok(jar.size);assert.deepEqual(await json('/api/auth/status'),{authenticated:true});
 passed('production_login_and_session');
 phase='account_navigation';
 const account=await (await request('/login')).text();
 assert.match(account,/Desbloquear Premium/);assert.doesNotMatch(account,/Mudar de plano|Escolher plano e fazer um simulado/);
 for(const [href,label] of [['/dashboard','Meus estudos'],['/simulados','Fazer um simulado'],['/premium','Desbloquear Premium']])assert.ok(account.includes(`href="${href}"`)&&account.includes(label));
 passed('published_account_offer_and_direct_simulation');
 phase='private_pages';
 for(const route of ['/dashboard','/questoes','/simulados','/historico','/estatisticas'])await request(route);
 passed('five_authenticated_pages');
 phase='premium_and_checkout';
 const premium=(await (await request('/premium')).text()).replaceAll('<!-- -->','');
 assert.match(premium,/<button[^>]*disabled[^>]*>Premium em breve/);assert.match(premium,/10 questões por dia/);
 assert.match(premium,/R\$\s*23,98/);assert.doesNotMatch(premium,/Premium ativo até/);
 assert.deepEqual(await json('/api/premium/checkout',{method:'POST',expected:503}),{error:'checkout_unavailable'});
 passed('premium_denied_and_checkout_disabled');
 phase='limits_before';
 const before=await json('/api/limits');assert.equal(before.hasPremium,false);
 assert.deepEqual(before.practice,{limit:10,used:0,remaining:10});assert.deepEqual(before.simulations,{limit:1,used:0,remaining:1});
 passed('free_daily_limits');
 phase='practice';
 const input={action:'next',filters:{subject:'matematica',topic:'',difficulty:'all',exam:'all'},previous:null,requestId:randomUUID()};
 const question=(await json('/api/practice',{method:'POST',body:input})).question;assert.ok(question?.id);noAnswers(question);
 const source=bank.get(question.questionId);assert.ok(source);assert.equal(question.statement,source.statement);
 assert.deepEqual((await json('/api/practice',{method:'POST',body:input})).question,question);
 const answer={action:'answer',id:question.id,answer:'A'};
 const feedback=(await json('/api/practice',{method:'POST',body:answer})).feedback;
 assert.equal(feedback.correctAnswer,source.correctAnswer);assert.equal(feedback.correct,source.correctAnswer==='A');assert.equal(feedback.explanation,source.explanation);
 assert.deepEqual((await json('/api/practice',{method:'POST',body:answer})).feedback,feedback);
 passed('practice_privacy_correction_and_replay');
 phase='simulations';
 const catalog=await json('/api/simulations'),quick=models.find(m=>m.free_access);
 assert.equal(catalog.items.length,1);assert.equal(catalog.items[0].id,quick.id);
 for(const model of models.filter(m=>!m.free_access))assert.deepEqual(await json('/api/simulations',{method:'POST',body:{action:'start',id:model.id},expected:404}),{error:'simulation_unavailable'});
 passed('premium_models_denied_to_free_account');
 const quiz=(await json('/api/simulations',{method:'POST',body:{action:'start',id:quick.id}})).quiz;
 assert.equal(quiz.questionCount,10);assert.equal(new Set(quiz.questions.map(q=>q.id)).size,10);noAnswers(quiz);
 assert.equal(new Set(quiz.questions.map(q=>q.subject)).size,5);
 for(const subject of new Set(quiz.questions.map(q=>q.subject)))assert.equal(quiz.questions.filter(q=>q.subject===subject).length,2);
 assert.equal((await json('/api/simulations',{method:'POST',body:{action:'start',id:quick.id}})).quiz.id,quiz.id);
 const submission={action:'submit',id:quiz.id,answers:quiz.questions.map(q=>({questionId:q.id,answer:'A'}))};
 const result=(await json('/api/simulations',{method:'POST',body:submission})).result;
 assert.equal(result.total,10);result.questions.forEach(checkFeedback);
 assert.equal(result.score,result.questions.filter(q=>q.correctAnswer==='A').length);
 assert.deepEqual((await json('/api/simulations',{method:'POST',body:submission})).result,result);
 assert.deepEqual(await json('/api/simulations',{method:'POST',body:{action:'start',id:quick.id},expected:403}),{error:'daily_simulation_limit'});
 passed('quick_simulation_privacy_correction_replay_and_daily_limit');
 phase='history_statistics_limits';
 const practiceHistory=await json('/api/history?kind=practice'),simulationHistory=await json('/api/history?kind=simulations');
 assert.equal(practiceHistory.items.length,1);assert.equal(simulationHistory.items.length,1);
 assert.equal(practiceHistory.items[0].id,question.id);assert.equal(simulationHistory.items[0].id,quiz.id);
 const statistics=await json('/api/statistics');assert.equal(statistics.answered,11);assert.equal(statistics.simulations,1);
 assert.equal(statistics.correct,result.score+Number(feedback.correct));
 const after=await json('/api/limits');assert.equal(after.hasPremium,false);
 assert.deepEqual(after.practice,{limit:10,used:1,remaining:9});assert.deepEqual(after.simulations,{limit:1,used:1,remaining:0});
 passed('private_history_statistics_and_single_quota_consumption');
 phase='logout';
 assert.deepEqual(await json('/api/auth/logout',{method:'POST',body:{}}),{status:'signed_out'});
 assert.deepEqual(await json('/api/auth/status',{expected:401}),{authenticated:false});
 passed('logout_revokes_browser_access');
}catch{
 // No assertion payloads, cookies, account credentials, answers or provider responses in output.
 console.error(JSON.stringify({passed:false,phase,checks}));process.exitCode=1;
}finally{
 try{await cleanup();}catch{console.error(JSON.stringify({passed:false,phase:'fixture_cleanup'}));process.exitCode=1;}
}
console.log(JSON.stringify({sampledAt:new Date().toISOString(),origin,passed:!process.exitCode,checks,fixtureRemoved:cleaned,paymentAttempted:false,checkoutEnabled:false}));
