// Mock provider responses + real private RPCs. Creates and removes only random fixtures.
import { randomUUID, randomBytes, randomInt } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { paymentProcessor } from '../src/lib/subscriptions/payment-processing.ts';
import { lifecycleProcessor } from '../src/lib/subscriptions/lifecycle.ts';
const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
if(url.protocol!=='https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password || url.port || url.pathname!=='/' || url.search || url.hash || !process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) throw Error('Configuração do servidor necessária.');
const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const require=createRequire(import.meta.url), pkg=require.resolve('supabase/package.json');
const cli=path.resolve(path.dirname(pkg),JSON.parse(readFileSync(pkg,'utf8')).bin.supabase);
const user=randomUUID(), order=randomUUID(), subscription=randomUUID(), reference=randomBytes(32).toString('hex'), eventId=randomInt(1000000000,2000000000);
const dir=path.resolve('supabase/.temp');mkdirSync(dir,{recursive:true});
const file=path.join(dir,`payment-integration-${user}.sql`);
function query(sql) {
 writeFileSync(file,sql);
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file],{encoding:'utf8',timeout:45000,windowsHide:true});
 if(r.status!==0 || r.error || r.stdout.includes('"_tag":"Error"')) throw Error('Verificação SQL/limpeza da fixture falhou.');
}
async function rpc(name,args) {
 const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));
 if(error)throw Error('RPC da fixture falhou.');return data;
}
try {
 query(`begin;
 insert into auth.users(id,email_confirmed_at) values('${user}',clock_timestamp());
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values('${reference}','${user}','cakto','fixture-product','fixture-offer','https://pay.cakto.com.br/fixture',1150,2299,clock_timestamp()-interval '1 minute',clock_timestamp()+interval '58 minutes');
 insert into private.cakto_event_inbox(id,fingerprint,event,order_id,product_id,offer_id,details) overriding system value
 values(${eventId},encode(extensions.digest('${order}','sha256'),'hex'),'purchase_approved','${order}','fixture-product','fixture-offer','{}');commit;`);
 const expected=await rpc('resolve_cakto_payment_intent',{p_event_id:eventId,p_reference:reference});
 assert.ok(expected);
 const createdAt=new Date(Date.parse(expected.createdAt)+5000).toISOString(),paidAt=new Date(Date.parse(expected.createdAt)+10000).toISOString();
 const data={id:order,product:{id:'fixture-product'},subscription,sck:reference,type:'subscription',offer_type:'main',subscription_period:1,status:'paid',createdAt,paidAt,refundedAt:null,chargedbackAt:null,canceledAt:null,currency:'BRL',baseAmount:'22.99',discount:'11.49',amount:'12.49',couponCode:'primeiracompra',customer:{email:'fixture-private@example.invalid'}};
 const sub={id:subscription,product:'fixture-product',offer:'fixture-offer',orders:[order],parent_order:order,status:'active',canceledAt:null,recurrence_period:30,quantity_recurrences:-1,amount:'22.99'};
 const deps={signal:id=>rpc('read_cakto_payment_signal',{p_event_id:id}),provider:async()=>({order:data,subscription:sub}),intent:(id,ref)=>rpc('resolve_cakto_payment_intent',{p_event_id:id,p_reference:ref}),save:async(id,result)=>{await rpc('record_cakto_payment_check',{p_event_id:id,p_result:result});},product:'fixture-product',offers:['fixture-offer'],now:()=>Date.parse(expected.expiresAt)};
 const process=paymentProcessor(deps);
 const repeated=await Promise.all([process(eventId),process(eventId)]);
 repeated.forEach(result=>assert.equal(result.outcome,'verified'));
 const review=await paymentProcessor({...deps,provider:async()=>({order:{...data,currency:undefined},subscription:sub})})(eventId);
 assert.equal(review.reason,'currency_unconfirmed');
 const access=await rpc('read_subscription_access',{p_user_id:user});assert.equal(access.hasPremium,false);
 // Real separate HTTP/RPC calls race for a single fixture reservation.
 const leases=await Promise.all([rpc('lease_cakto_payment_job',{p_product_id:'fixture-product',p_offer_ids:['fixture-offer']}),rpc('lease_cakto_payment_job',{p_product_id:'fixture-product',p_offer_ids:['fixture-offer']})]);
 assert.equal(leases.filter(Boolean).length,1,'Only one worker may reserve the signal');
 const lease=leases.find(Boolean);assert.equal(lease.eventId,eventId);
 await rpc('finish_cakto_payment_job',{p_event_id:eventId,p_lease_token:lease.leaseToken,p_result:repeated[0]});
 await assert.rejects(rpc('finish_cakto_payment_job',{p_event_id:eventId,p_lease_token:lease.leaseToken,p_result:repeated[0]}));
 const queue=await rpc('cakto_payment_job_summary',{p_product_id:'fixture-product'});assert.equal(queue.verified,1);
 assert.equal(await rpc('enqueue_cakto_api_order',{p_order_id:order,p_subscription_id:subscription,p_product_id:'fixture-product',p_offer_id:'fixture-offer',p_reference:reference}),true);
 // A temporary entitlement exists only for this random fixture, never for a customer.
 const lifecycleId=eventId+1;
 query(`begin;
 insert into private.cakto_event_inbox(id,fingerprint,event,order_id,product_id,offer_id,details) overriding system value
 values(${lifecycleId},encode(extensions.digest('${order}-lifecycle','sha256'),'hex'),'subscription_canceled','${order}','fixture-product','fixture-offer','{}');
 insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,external_plan_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at,last_synced_at)
 values('${user}','cakto','${subscription}','fixture-product','fixture-offer','active','granted',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '29 days','${order}',clock_timestamp()-interval '1 minute',clock_timestamp());commit;`);
 const updatedAt=new Date(Date.parse(expected.createdAt)+30000).toISOString();
 const lifecycleDeps={...deps,signal:id=>rpc('read_cakto_payment_signal',{p_event_id:id}),provider:async()=>({order:data,subscription:{...sub,status:'canceled',canceledAt:updatedAt,updatedAt}}),binding:(id,subscriptionId,originOrderId)=>rpc('resolve_cakto_lifecycle_binding',{p_event_id:id,p_subscription_id:subscriptionId,p_origin_order_id:originOrderId}),save:async(id,result)=>{await rpc('record_cakto_lifecycle_check',{p_event_id:id,p_result:result});}};
 assert.equal((await lifecycleProcessor(lifecycleDeps)(lifecycleId)).snapshot.action,'preserve');
 assert.equal((await rpc('read_subscription_access',{p_user_id:user})).hasPremium,true);
 assert.equal((await lifecycleProcessor({...lifecycleDeps,provider:async()=>({order:{...data,status:'refunded',refundedAt:updatedAt},subscription:{...sub,updatedAt}})})(lifecycleId)).snapshot.action,'revoke');
 assert.equal((await rpc('read_subscription_access',{p_user_id:user})).hasPremium,false);
 await lifecycleProcessor({...lifecycleDeps,provider:async()=>({order:data,subscription:{...sub,updatedAt}})})(lifecycleId);
 assert.equal((await rpc('read_subscription_access',{p_user_id:user})).hasPremium,false);
 query(`do $$begin
 if (select count(*) from private.cakto_payment_checks where event_id=${eventId} and outcome='verified')<>1 then raise exception 'concurrent proof duplicate';end if;
 if (select count(*) from private.cakto_payment_checks where event_id=${eventId} and outcome='review')<>1 then raise exception 'review lost';end if;
 if exists(select 1 from private.cakto_payment_checks where event_id=${eventId} and outcome='verified' and intent_reference<>'${reference}') then raise exception 'wrong intent';end if;
 if exists(select 1 from private.subscriptions where user_id='${user}' and access_state='granted') then raise exception 'unexpected entitlement';end if;
 end$$;`);
 console.log('Integração aprovada: evidência, concorrência, fila, descoberta e ciclo. Acesso sintético temporário preservado no cancelamento, revogado no reembolso e não restaurado por replay. Nenhuma concessão comercial.');
} finally {
 query(`begin;delete from private.cakto_event_inbox where order_id='${order}';delete from auth.users where id='${user}';
 do $$begin if exists(select 1 from private.cakto_event_inbox where order_id='${order}') or exists(select 1 from private.cakto_payment_checks where event_id=${eventId}) or exists(select 1 from private.cakto_payment_jobs where event_id=${eventId}) or exists(select 1 from private.checkout_intents where reference='${reference}') then raise exception 'fixture cleanup failed';end if;end$$;commit;`);
 rmSync(file,{force:true});
 console.log('Fixtures removidas. Nenhuma consulta ou cobrança real na Cakto.');
}
