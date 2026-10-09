// Fixture isolada. As questões ficam draft em todo estado confirmado no banco.
// A função temporária publica somente dentro da transação da chamada, restaurando
// draft antes do commit. Isso permite testar os RPCs reais sem expor conteúdo.
import {randomUUID,randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key?.startsWith('sb_secret_'))throw Error('Configure o ambiente do servidor antes deste teste.');
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json');
const entry=path.resolve(path.dirname(pkg),JSON.parse(readFileSync(pkg,'utf8')).bin.supabase);
const dir=path.resolve('supabase/.temp');mkdirSync(dir,{recursive:true});
const user=randomUUID(),simIds=[randomUUID(),randomUUID()],qIds=Array.from({length:10},()=>randomUUID());
const paidOrder=randomUUID(),paidSub=randomUUID(),reference=randomBytes(32).toString('hex');
const fn='test_limits_'+user.replaceAll('-',''),topic='__'+fn+'__';
const file=path.join(dir,fn+'.sql');
function query(sql){
 writeFileSync(file,sql);
 const r=spawnSync(process.execPath,[entry,'db','query','--linked','--file',file],{encoding:'utf8',timeout:60000,windowsHide:true});
 if(r.status!==0||r.error||r.stdout.includes('"_tag":"Error"'))throw Error('Consulta de fixture falhou; SQL temporário preservado para diagnóstico.');
}
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const rpc=(name,args)=>client.rpc(name,args).abortSignal(AbortSignal.timeout(20000));
const subjects=['matematica','portugues','ciencias','historia','geografia'];
const questions=qIds.map((id,i)=>`('${id}','Concorrência privada','1','2','3','4','5','${subjects[Math.floor(i/2)]}','${topic}','easy','both','draft')`).join(',');
const ids=qIds.map(id=>`'${id}'::uuid`).join(',');
let created=false;
try{
 query(`begin;
 insert into auth.users(id,email_confirmed_at) values('${user}',now());
 insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status) values ${questions};
 insert into public.question_answers(question_id,correct_answer,explanation) select id,'B','Fixture privada' from public.questions where id in (${ids});
 insert into private.simulations(id,title,question_count,published,free_access) values('${simIds[0]}','Fixture limites A',10,true,true),('${simIds[1]}','Fixture limites B',10,true,true);
 insert into private.practice_attempts(user_id,question_id,snapshot) select '${user}','${qIds[0]}','{}'::jsonb from generate_series(1,9);
 create function public.${fn}(p_nonce uuid,p_simulation uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
 declare value jsonb;
 begin
  perform pg_advisory_xact_lock(hashtextextended('${user}',23));
  update public.questions set status='published' where id in (${ids});
  if p_simulation is null then
   value:=public.start_question_practice_request('${user}','matematica','${topic}','easy','all',null,p_nonce);
  else
   if p_simulation not in ('${simIds[0]}'::uuid,'${simIds[1]}'::uuid) then raise exception 'invalid_input';end if;
   value:=public.start_simulation('${user}',p_simulation);
  end if;
  update public.questions set status='draft' where id in (${ids});
  return value;
 end;$$;
 revoke all on function public.${fn}(uuid,uuid) from public,anon,authenticated,service_role;
 grant execute on function public.${fn}(uuid,uuid) to service_role;
 notify pgrst,'reload schema';commit;`);
 created=true;
 // Não usar a função até o cache de schema reconhecê-la. Nenhuma cota é
 // consumida pela leitura do catálogo pg_proc feita pela CLI acima.
 let trials;
 for(let i=0;i<5;i++){
  trials=await Promise.all([rpc(fn,{p_nonce:randomUUID()}),rpc(fn,{p_nonce:randomUUID()})]);
  if(!trials.every(r=>r.error?.code==='PGRST202'))break;
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 assert.equal(trials.filter(r=>!r.error).length,1);
 assert.equal(trials.find(r=>r.error)?.error.message,'daily_practice_limit');
 const practice=await rpc('read_daily_limits',{p_user_id:user});assert.equal(practice.error,null);assert.equal(practice.data.practice.used,10);
 const sims=await Promise.all(simIds.map(id=>rpc(fn,{p_nonce:randomUUID(),p_simulation:id})));
 assert.equal(sims.filter(r=>!r.error).length,1);assert.equal(sims.find(r=>r.error)?.error.message,'daily_simulation_limit');
 const winner=sims[0].error?simIds[1]:simIds[0],state=sims.find(r=>!r.error).data;
 const resumes=await Promise.all([rpc('start_simulation',{p_user_id:user,p_simulation_id:winner}),rpc('start_simulation',{p_user_id:user,p_simulation_id:winner})]);
 resumes.forEach(r=>{assert.equal(r.error,null);assert.deepEqual(r.data,state);});
 const usage=await rpc('read_daily_limits',{p_user_id:user});assert.equal(usage.error,null);assert.equal(usage.data.simulations.used,1);
 // Concessão sintética pelo mesmo RPC transacional da aplicação; não consulta nem cobra a Cakto.
 query(`do $$declare paid timestamptz:=clock_timestamp()-interval '1 minute';event_value bigint;begin
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values('${reference}','${user}','cakto','concurrency-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,paid-interval '1 minute',paid+interval '59 minutes');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest('${reference}','sha256'),'hex'),'purchase_approved','${paidOrder}','concurrency-fixture','offer','{}') returning id into event_value;
 perform public.record_cakto_payment_check(event_value,jsonb_build_object('outcome','verified','reason','payment_verified','reference','${reference}','evidence',jsonb_build_object('orderId','${paidOrder}','subscriptionId','${paidSub}','productId','concurrency-fixture','offerId','offer','orderCreatedAt',paid-interval '30 seconds','paidAt',paid,'paidPriceCents',1150,'currency','BRL')));
 end$$;`);
 const paidTrials=await Promise.all([rpc(fn,{p_nonce:randomUUID()}),rpc(fn,{p_nonce:randomUUID()})]);paidTrials.forEach(r=>assert.equal(r.error,null));
 const sameNonce=randomUUID(),duplicates=await Promise.all([rpc(fn,{p_nonce:sameNonce}),rpc(fn,{p_nonce:sameNonce})]);duplicates.forEach(r=>assert.equal(r.error,null));assert.deepEqual(duplicates[0].data,duplicates[1].data);
 const otherTemplate=simIds.find(id=>id!==winner),paidSims=await Promise.all([rpc(fn,{p_nonce:randomUUID(),p_simulation:otherTemplate}),rpc(fn,{p_nonce:randomUUID(),p_simulation:otherTemplate})]);
 paidSims.forEach(r=>assert.equal(r.error,null));assert.deepEqual(paidSims[0].data,paidSims[1].data);
 const premium=await rpc('read_daily_limits',{p_user_id:user});assert.equal(premium.error,null);assert.equal(premium.data.hasPremium,true);assert.equal(premium.data.practice.used,13);assert.equal(premium.data.practice.limit,null);assert.equal(premium.data.simulations.used,2);assert.equal(premium.data.simulations.remaining,null);
 query(`with t as(select clock_timestamp() at) update private.cakto_access_periods set paid_at=t.at-interval '31 days',access_from=t.at-interval '31 days',access_until=t.at-interval '1 day' from t where order_id='${paidOrder}';`);
 const expired=await rpc('read_daily_limits',{p_user_id:user});assert.equal(expired.error,null);assert.equal(expired.data.hasPremium,false);assert.equal(expired.data.practice.remaining,0);assert.equal(expired.data.simulations.remaining,0);
 const deniedAfterExpiry=await rpc(fn,{p_nonce:randomUUID()});assert.equal(deniedAfterExpiry.error?.message,'daily_practice_limit');
 const resumeAfterExpiry=await rpc('start_simulation',{p_user_id:user,p_simulation_id:otherTemplate});assert.equal(resumeAfterExpiry.error,null);assert.deepEqual(resumeAfterExpiry.data,paidSims[0].data);
 query(`do $$begin if exists(select 1 from public.questions where id in (${ids}) and status<>'draft') then raise exception 'fixture published';end if;end$$;`);
 console.log('Concorrência aprovada: gratuito respeita a última vaga; Premium passa das cotas, deduplica a mesma solicitação e retoma sem duplicar. Expiração volta ao gratuito preservando tentativas abertas.');
}finally{
 // Limpeza também se a configuração parcial falhar; o setup é transacional.
 query(`begin;
 drop function if exists public.${fn}(uuid,uuid);
 delete from private.cakto_event_inbox where order_id='${paidOrder}';
 delete from auth.users where id='${user}';
 delete from private.simulations where id in ('${simIds[0]}','${simIds[1]}');
 delete from public.question_answers where question_id in (${ids});
 delete from public.questions where id in (${ids});
 do $$begin if exists(select 1 from auth.users where id='${user}') or exists(select 1 from public.questions where id in (${ids})) or exists(select 1 from private.cakto_event_inbox where order_id='${paidOrder}') or exists(select 1 from private.cakto_access_periods where order_id='${paidOrder}') then raise exception 'cleanup failed';end if;end$$;
 notify pgrst,'reload schema';commit;`);
 rmSync(file,{force:true});
 console.log(created?'Usuário, tentativas, questões draft, modelos e função temporária removidos.':'Setup revertido e limpeza conferida.');
}
