// Disposable, marked account; real application/database, no payment-provider calls.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {writeFileSync,rmSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createClient} from '@supabase/supabase-js';
import {parseWorkspace} from '../src/lib/premium-study/contract.ts';
import {parseSimulationState} from '../src/lib/quiz/simulation-contract.ts';
const origin=process.env.STUDY_TEST_ORIGIN??'http://127.0.0.1:3085';
assert.ok(['http://127.0.0.1:3085','http://localhost:3085','https://meta-aprovacao.vercel.app'].includes(origin));
const tag=randomUUID(),email=`study-smoke-${tag}@example.invalid`,password=randomBytes(32).toString('base64url');
const order=randomUUID(),subscription=randomUUID(),reference=randomBytes(32).toString('hex'),jar=new Map();
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const file=path.resolve(`supabase/.temp/study-smoke-${tag}.sql`),handoff=path.join(process.env.TEMP,'meta-study-browser-fixture.json'),done=handoff+'.done';
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let user,phase='create',attempted=false;
function sql(text,marker){writeFileSync(file,text);const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:45000});if(r.status!==0||r.error||!r.stdout.includes(marker)||/"_tag"\s*:\s*"Error"/.test(r.stdout)){writeFileSync(path.join(process.env.TEMP,'premium-http-sql-diagnostic.txt'),r.stdout+r.stderr);throw Error('fixture_sql_failed');}}
async function request(route,{body,status=200,anonymous=false}={}){
 const headers={Origin:origin,...(!anonymous?{Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{})};if(body)headers['Content-Type']='application/json';
 const r=await fetch(origin+route,{method:body?'POST':'GET',headers,redirect:'manual',signal:AbortSignal.timeout(45000),...(body?{body:JSON.stringify(body)}:{})});
 if(!anonymous)for(const s of r.headers.getSetCookie()){const pair=s.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1));}
 assert.equal(r.status,status,`${route}: status ${r.status}`);return r;
}
async function command(body,status=200){const r=await request('/api/premium/study',{body,status});assert.match(r.headers.get('cache-control'),/no-store/);const data=await r.json();return status===200?data.data:data;}
async function workspace(){return parseWorkspace(await(await request('/api/premium/study')).json());}
try{
 attempted=true;const created=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{fixture:tag}});assert.equal(created.error,null);user=created.data.user.id;
 phase='free_and_anonymous';await request('/api/premium/study',{anonymous:true,status:401});
 await request('/api/auth/login',{body:{email,password}});await request('/api/premium/study',{status:403});
 await command({action:'sync_plan'},403);const upsell=await(await request('/premium/estudos')).text();assert.match(upsell,/Continuar no Gratuito/);
 phase='premium_fixture';
 sql(`begin;set local statement_timeout='15s';
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values('${reference}','${user}','cakto','study-workspace-smoke','offer','https://pay.cakto.com.br/fixture',2299,2299,statement_timestamp()-interval '2 minutes',statement_timestamp()+interval '58 minutes');
 do $$declare ev bigint;t timestamptz:=clock_timestamp();begin
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details) values(encode(extensions.digest('${reference}','sha256'),'hex'),'purchase_approved','${order}','study-workspace-smoke','offer','{}') returning id into ev;
 perform public.record_cakto_payment_check(ev,jsonb_build_object('outcome','verified','reason','payment_verified','reference','${reference}','evidence',jsonb_build_object('orderId','${order}','subscriptionId','${subscription}','productId','study-workspace-smoke','offerId','offer','orderCreatedAt',t-interval '90 seconds','paidAt',t-interval '1 minute','paidPriceCents',2299,'currency','BRL')));
 end$$;select true as study_fixture_ready;commit;`,'study_fixture_ready');
 phase='nine_pages';let w=await workspace();assert.ok(w.institutions.length>=2);assert.ok(w.documents.length>=3);
 for(const area of ['plan','realistic','reviews','diagnosis','custom','radar','flashcards','calendar','library']){const html=await(await request('/premium/estudos?area='+area)).text();assert.match(html,/Seu espaço Premium/);assert.doesNotMatch(html,/Não foi possível carregar seus estudos/);}
 phase='plan_calendar';const examDate=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
 await command({action:'save_profile',profile:{institution:'etec',examDate,weekdays:[1,2,3,4,5],minutes:60,startTime:'18:00',dailyGoal:20,weeklyGoal:100,reminder:15}});await command({action:'sync_plan'});w=await workspace();assert.ok(w.sessions.length>0);
 const first=w.sessions[0],manual={title:'Sessão manual de conferência',date:first.study_date,time:'20:00',minutes:30,subject:'matematica',topic:'',kind:'practice',goal:10,reminder:5,completed:false,archived:false};
 await command({action:'save_session',id:first.id,requestId:randomUUID(),session:manual});await command({action:'sync_plan'});w=await workspace();assert.equal(w.sessions.find(s=>s.id===first.id).title,manual.title);
 const ics=await(await request('/api/premium/study?view=calendar')).text();assert.match(ics,/BEGIN:VCALENDAR/);assert.match(ics,/BEGIN:VALARM/);
 phase='flashcards';const cards=(await(await request('/api/premium/study?view=cards')).json()).cards;assert.ok(cards.length);await command({action:'rate_card',questionId:cards[0].id,mode:'flashcard',rating:3,requestId:randomUUID()});
 phase='custom_exam';const config={mode:'custom',institution:'etec',subjects:['matematica'],topics:[],difficulty:'all',count:5,minutes:10};
 const attempt=parseSimulationState(await command({action:'start_exam',config,requestId:randomUUID()}));assert.ok(attempt.quiz);assert.equal(attempt.quiz.questions.length,5);assert.doesNotMatch(JSON.stringify(attempt),/correctAnswer|explanation/);
 const aid=attempt.quiz.id,qid=attempt.quiz.questions[0].id;await command({action:'save_exam',id:aid,answers:{[qid]:'A'},marked:[qid],revision:1});
 const result=parseSimulationState(await command({action:'finish_exam',id:aid,answers:[{questionId:qid,answer:'A'}]}));assert.ok(result.result);assert.equal(result.result.questions.filter(q=>q.answer==='-').length,4);
 phase='realistic_exam';const realistic=parseSimulationState(await command({action:'start_exam',config:{...config,mode:'realistic',institution:'ifsp',subjects:['matematica','portugues']},requestId:randomUUID()}));assert.equal(realistic.quiz.questionCount,30);assert.equal(realistic.quiz.premium.durationMinutes,180);
 phase='etec_realistic';const etec=parseSimulationState(await command({action:'start_exam',config:{...config,mode:'realistic'},requestId:randomUUID()}));assert.equal(etec.quiz.questionCount,50);assert.equal(etec.quiz.premium.durationMinutes,240);
 phase='stats';w=await workspace();assert.ok(w.groups.some(g=>g.n>0));assert.ok(w.reviewHistory.length);assert.ok(w.exams.length>=2);
 phase='security';await command({action:'sync_plan',userId:randomUUID()},400);await request('/api/premium/study?userId='+randomUUID(),{status:400});
 const csrf=await fetch(origin+'/api/premium/study',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:JSON.stringify({action:'sync_plan'})});assert.equal(csrf.status,403);
 if(process.argv.includes('--browser')){
  rmSync(done,{force:true});writeFileSync(handoff,JSON.stringify({email,password,origin}));console.log('HTTP aprovado. Conta temporária pronta para conferência visual; limpeza automática em até 15 minutos.');
  for(let i=0;i<450&&!existsSync(done);i++)await delay(2000);
 }
 phase='expired_access';sql(`begin;update private.cakto_access_periods set revoked_at=clock_timestamp() where subscription_id in(select id from private.subscriptions where user_id='${user}');select true as study_fixture_revoked;commit;`,'study_fixture_revoked');await request('/api/premium/study',{status:403});await request('/api/simulations?id='+realistic.quiz.id,{status:403});
 console.log('HTTP aprovado: nove páginas, Premium/Gratuito, planejamento, calendário, flashcards, simulados, rascunho, relatório, dados compartilhados e proteção de origem. Sem compra real.');
}catch(e){console.error('Teste não concluído:',phase,e instanceof assert.AssertionError?e.message:'falha operacional sem exibir credenciais');process.exitCode=1;}
finally{
 if(attempted)try{
  sql(`begin;set local statement_timeout='15s';create temporary table fixture as select id from auth.users where email='${email}' and raw_app_meta_data->>'fixture'='${tag}';
 delete from private.cakto_event_inbox where order_id='${order}' and product_id='study-workspace-smoke';delete from auth.users where id in(select id from fixture);
 do $$begin if exists(select 1 from auth.users where email='${email}') or exists(select 1 from private.cakto_event_inbox where order_id='${order}') or exists(select 1 from private.subscriptions where external_subscription_id='${subscription}') then raise exception 'cleanup_failed';end if;end$$;select true as study_fixture_removed;commit;`,'study_fixture_removed');console.log('Conta e registros temporários removidos; ausência conferida.');
 }catch{console.error('Limpeza não confirmada: intervenção necessária para fixture '+tag);process.exitCode=1;}
 rmSync(file,{force:true});if(process.argv.includes('--browser')){rmSync(handoff,{force:true});rmSync(done,{force:true});}
}
