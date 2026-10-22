// Authenticated readback of plan prices. Random expired-payment fixture; no Cakto calls or charges.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {checkoutEnabled} from '../src/lib/subscriptions/checkout-launch.ts';
import {configuredCheckout} from '../src/lib/subscriptions/checkout-contract.ts';
const origin=process.env.CHECKOUT_TEST_ORIGIN??'https://meta-aprovacao.vercel.app';
assert.ok(['http://127.0.0.1:3085','https://meta-aprovacao.vercel.app'].includes(origin));
const handoff=path.join(process.env.TEMP,'meta-checkout-browser-fixture.json'),done=handoff+'.done';
const tag=randomUUID(),email=`promotion-smoke-${tag}@example.invalid`,password=randomBytes(32).toString('base64url');
const order=randomUUID(),subscription=randomUUID(),reference=randomBytes(32).toString('hex');
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const file=path.resolve(`supabase/.temp/promotion-smoke-${tag}.sql`),jar=new Map();
let fixtureAttempted=false,phase='configuration',cleaned=false,user;
function query(sql,marker){
 writeFileSync(file,sql);
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file],{encoding:'utf8',windowsHide:true,timeout:45000});
 if(r.status!==0||r.error||/"_tag"\s*:\s*"Error"/.test(r.stdout)||!r.stdout.includes(marker))throw Error('fixture_sql_failed');
}
async function request(route,body){
 const headers={Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
 if(body){headers.Origin=origin;headers['Content-Type']='application/json';}
 const r=await fetch(origin+route,{method:body?'POST':'GET',headers,redirect:'manual',signal:AbortSignal.timeout(15000),...(body?{body:JSON.stringify(body)}:{})});
 for(const value of r.headers.getSetCookie()){
  const pair=value.split(';')[0],i=pair.indexOf('=');
  if(/max-age=0(?:;|$)/i.test(value))jar.delete(pair.slice(0,i));else jar.set(pair.slice(0,i),pair.slice(i+1));
 }
 assert.equal(r.status,200);return r;
}
async function checkPages(){
 for(const route of ['/premium','/cadastro/confirmado']){
  const html=await(await request(route)).text();
  assert.match(html,/Assinar Premium/);assert.doesNotMatch(html,/Premium em breve/);
  assert.match(html,/23,98/);
  assert.match(html,/22,99/);assert.doesNotMatch(html,/12,49|primeiracompra|no primeiro mês/);
 }
}
async function checkCheckout(hasPaidBefore){
 const response=await fetch(origin+'/api/premium/checkout',{method:'POST',headers:{Origin:origin,Accept:'application/json',Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},redirect:'manual',signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
 const data=await response.json(),destination=new URL(data.url),expected=configuredCheckout(process.env,new Date(),hasPaidBefore);
 assert.equal(destination.origin,'https://pay.cakto.com.br');assert.match(destination.searchParams.get('sck')??'',/^[a-f0-9]{64}$/);
 destination.searchParams.delete('sck');assert.equal(destination.href,expected.url);
 return data.url;
 // Only a saved intent and validated destination. Never visit a payment endpoint or pay.
}
try{
 assert.equal(checkoutEnabled,true);
 assert.match(process.env.NEXT_PUBLIC_SUPABASE_URL??'',/^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
 assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,readFileSync('supabase/.temp/project-ref','utf8').trim()+'.supabase.co');
 assert.ok(process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'));
 mkdirSync(path.dirname(file),{recursive:true});
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 phase='create_fixture';fixtureAttempted=true;
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{fixture:tag}});
 assert.equal(created.error,null);user=created.data.user.id;
 phase='new_account';assert.deepEqual(await(await request('/api/auth/login',{email,password})).json(),{status:'signed_in'});
 await checkPages();
 phase='first_checkout';const initialCheckout=await checkCheckout(false);
 assert.equal(await checkCheckout(false),initialCheckout,'repeated checkout reuses the saved intent');
 if(process.argv.includes('--browser')){
  rmSync(done,{force:true});writeFileSync(handoff,JSON.stringify({email,password,origin}));
  console.log('Checkout HTTP aprovado. Conta descartável disponível para conferência visual por até 15 minutos.');
  for(let i=0;i<450&&!existsSync(done);i++)await delay(2000);
 }
 phase='expired_payment';
 query(`begin;set local statement_timeout='15s';
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values('${reference}','${user}','cakto','promotion-smoke','offer','https://pay.cakto.com.br/fixture',1150,2299,clock_timestamp()-interval '40 days 1 minute',clock_timestamp()-interval '40 days'+interval '58 minutes');
 do $$declare ev bigint;t timestamptz:=clock_timestamp()-interval '40 days';begin
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest('${reference}','sha256'),'hex'),'purchase_approved','${order}','promotion-smoke','offer','{}') returning id into ev;
 perform public.record_cakto_payment_check(ev,jsonb_build_object('outcome','verified','reason','payment_verified','reference','${reference}','evidence',jsonb_build_object(
 'orderId','${order}','subscriptionId','${subscription}','productId','promotion-smoke','offerId','offer','orderCreatedAt',t-interval '30 seconds','paidAt',t,'paidPriceCents',1150,'currency','BRL')));
 if public.read_subscription_pricing('${user}')<>jsonb_build_object('hasPremium',false,'accessUntil',null,'hasPaidBefore',true) then raise exception 'promotion_fixture_failed';end if;
 end$$;select true as promotion_fixture_ready;commit;`,'promotion_fixture_ready');
 await checkPages();
 phase='returning_checkout';await checkCheckout(true);
 phase='returning_login';jar.clear();await request('/api/auth/login',{email,password});await checkPages();
 console.log('Checkout aprovado: preço regular desde a primeira cobrança, intenção reutilizada, histórico promocional preservado, sem cupom e nova entrada. Sem compra ou cobrança.');
}catch{
 console.error(`Conferência de produção não concluída na etapa ${phase}. Nenhuma credencial exibida.`);process.exitCode=1;
}finally{
 if(fixtureAttempted){
  try{
   query(`begin;set local statement_timeout='15s';
   create temporary table promotion_fixture as select id from auth.users where email='${email}' and raw_app_meta_data->>'fixture'='${tag}';
   do $$begin if (select count(*) from promotion_fixture)>1 then raise exception 'promotion_cleanup_ambiguous';end if;end$$;
   delete from private.cakto_event_inbox where order_id='${order}' and product_id='promotion-smoke' and fingerprint=encode(extensions.digest('${reference}','sha256'),'hex');
   delete from auth.users where id in(select id from promotion_fixture);
   do $$begin if exists(select 1 from auth.users where email='${email}') or exists(select 1 from private.checkout_intents where reference='${reference}' or user_id in(select id from promotion_fixture)) or
   exists(select 1 from private.cakto_event_inbox where order_id='${order}') or exists(select 1 from private.subscriptions where external_subscription_id='${subscription}') then raise exception 'promotion_cleanup_failed';end if;end$$;
   select true as promotion_fixture_removed;commit;`,'promotion_fixture_removed');cleaned=true;
  }catch{console.error('Limpeza da fixture não confirmada; intervenção necessária.');process.exitCode=1;}
 }
 if(cleaned)console.log('Conta e registros temporários removidos e ausência conferida.');
 rmSync(file,{force:true});
 if(process.argv.includes('--browser')){rmSync(handoff,{force:true});rmSync(done,{force:true});}
}
