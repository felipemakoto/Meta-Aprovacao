import { createClient } from '@supabase/supabase-js';
import { caktoReader } from '../src/lib/subscriptions/cakto-api.ts';
import { paymentProcessor } from '../src/lib/subscriptions/payment-processing.ts';
try {
 const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
 if(url.protocol!=='https:' || !url.hostname.endsWith('.supabase.co') || url.username || url.password || url.port || url.pathname!=='/' || url.search || url.hash || !process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) throw Error();
 const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 async function rpc(name,args) {
  const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));
  if(error)throw Error('payment_storage_unavailable');return data;
 }
 const result=await paymentProcessor({signal:id=>rpc('read_cakto_payment_signal',{p_event_id:id}),
  provider:id=>caktoReader(process.env).orderAndSubscription(id),
  intent:(id,reference)=>rpc('resolve_cakto_payment_intent',{p_event_id:id,p_reference:reference}),
  save:async(id,result)=>{await rpc('record_cakto_payment_check',{p_event_id:id,p_result:result});},
  product:process.env.CAKTO_PRODUCT_ID ?? '',offers:[...new Set([process.env.CAKTO_REGULAR_OFFER_ID ?? '',process.env.CAKTO_OCTOBER_OFFER_ID ?? ''])],now:()=>Date.now(),
 })(Number(process.argv[2]));
 // Only fixed outcomes/reasons: no reference, evidence, IDs or buyer data printed.
 console.log(JSON.stringify({outcome:result.outcome,reason:result.reason,accessPolicy:'30_days_per_verified_payment',checkoutEnabled:false}));
} catch {console.error('Processamento interrompido. Confira o ID do evento, configuração, migrations e estado persistido.');process.exitCode=1;}
