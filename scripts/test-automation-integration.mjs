import {randomUUID,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {runCaktoAutomation} from '../src/lib/subscriptions/automation.ts';
const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');
if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'))throw Error('Configuração necessária.');
const user=randomUUID(),origin=randomUUID(),renewal=randomUUID(),subId=randomUUID(),ref=randomBytes(32).toString('hex'),product='automation-fixture-'+user;
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),JSON.parse(readFileSync(pkg,'utf8')).bin.supabase);
const file=path.resolve('supabase/.temp/automation-integration.sql');
function query(sql){writeFileSync(file,sql);const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file],{encoding:'utf8',timeout:45000,windowsHide:true});if(r.status!==0||r.error||r.stdout.includes('"_tag":"Error"'))throw Error('Fixture SQL falhou. Não executar com automação configurada/ativa.');}
const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function rpc(name,args={}){const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));if(error)throw Error('RPC da fixture falhou.');return data;}
try{
 query(`begin;do $$begin if exists(select 1 from private.cakto_automation where enabled or product_id is not null) then raise exception 'automation already configured';end if;end$$;
 insert into auth.users(id,email_confirmed_at) values('${user}',clock_timestamp());
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values('${ref}','${user}','cakto','${product}','offer','https://pay.cakto.com.br/fixture',1150,2299,clock_timestamp()-interval '2 minutes',clock_timestamp()+interval '57 minutes');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details) values
 (encode(extensions.digest('${origin}','sha256'),'hex'),'purchase_approved','${origin}','${product}','offer','{}'),
 (encode(extensions.digest('${renewal}','sha256'),'hex'),'subscription_renewed','${renewal}','${product}','offer','{}');
 update private.cakto_automation set enabled=true,product_id='${product}',offer_ids=array['offer'],next_discovery_at=clock_timestamp()+interval '1 day';commit;`);
 const lookup=await admin.rpc('resolve_cakto_payment_intent',{p_event_id:(await rpc('lease_cakto_payment_job',{p_product_id:product,p_offer_ids:['offer']})).eventId,p_reference:ref});
 assert.equal(lookup.error,null);const expected=lookup.data;
 // Return the intentionally reserved fixture to the queue before racing full workers.
 query(`update private.cakto_payment_jobs set state='queued',attempts=0,lease_token=null,lease_until=null where event_id in(select id from private.cakto_event_inbox where product_id='${product}');`);
 const createdAt=new Date(Date.parse(expected.createdAt)+5000).toISOString(),paidAt=new Date(Date.parse(expected.createdAt)+10000).toISOString(),renewAt=new Date(Date.parse(expected.createdAt)+20000).toISOString();
 const order={id:origin,product:{id:product},subscription:subId,sck:ref,type:'subscription',offer_type:'main',subscription_period:1,status:'paid',createdAt,paidAt,refundedAt:null,chargedbackAt:null,canceledAt:null,currency:'BRL',baseAmount:'22.99',discount:'11.49',amount:'12.49',couponCode:'primeiracompra'};
 const subscription={id:subId,product,offer:'offer',orders:[origin,renewal],parent_order:origin,status:'active',canceledAt:null,recurrence_period:30,quantity_recurrences:-1,amount:'22.99',updatedAt:renewAt};
 const provider={recentOrderIds:async()=>{throw Error('unexpected discovery');},orderAndSubscription:async id=>({order:id===origin?order:{...order,id:renewal,sck:null,subscription_period:2,createdAt:paidAt,paidAt:renewAt,discount:'0.00',amount:'23.98',couponCode:null},subscription})};
 const results=await Promise.all([runCaktoAutomation(rpc,provider),runCaktoAutomation(rpc,provider)]);
 assert.equal(results.filter(r=>r.skipped).length,1);assert.equal(results.find(r=>!r.skipped).summary.verified,2);
 const access=await rpc('read_subscription_access',{p_user_id:user});assert.equal(access.hasPremium,true);assert.equal(Date.parse(access.accessUntil)-Date.parse(paidAt),60*86400000);
 const status=await rpc('cakto_automation_status');assert.equal(status.running,false);assert.equal(status.lastOk,true);
 console.log('Worker integrado aprovado: dois workers concorrentes reservam uma execução; primeira mensalidade e renovação totalizam 60 dias. Provedor simulado, sem cobrança.');
}finally{
 query(`begin;delete from private.cakto_event_inbox where product_id='${product}';delete from auth.users where id='${user}';
 update private.cakto_automation set enabled=false,product_id=null,offer_ids=null,lease_token=null,lease_until=null,lease_mode=null,next_discovery_at=clock_timestamp(),last_finished_at=null,last_ok=null,last_summary=null where product_id='${product}';
 do $$begin if exists(select 1 from auth.users where id='${user}') or exists(select 1 from private.cakto_access_periods where order_id in('${origin}','${renewal}')) then raise exception 'fixture cleanup failed';end if;end$$;commit;`);
 rmSync(file,{force:true});console.log('Fixtures e configuração de teste removidas.');
}
