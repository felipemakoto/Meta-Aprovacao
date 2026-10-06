import {createClient} from '@supabase/supabase-js';
import {caktoReader} from '../src/lib/subscriptions/cakto-api.ts';
import {paymentProcessor} from '../src/lib/subscriptions/payment-processing.ts';
import {lifecycleEvents,lifecycleProcessor} from '../src/lib/subscriptions/lifecycle.ts';
import {reconcileJobs,discoverOrders} from '../src/lib/subscriptions/reconciliation.ts';
try {
 const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'))throw Error();
 const page=process.argv[2]===undefined?1:Number(process.argv[2]);if(!Number.isInteger(page)||page<1||page>100)throw Error();
 const product=process.env.CAKTO_PRODUCT_ID??'',offers=[...new Set([process.env.CAKTO_REGULAR_OFFER_ID??'',process.env.CAKTO_OCTOBER_OFFER_ID??''])];
 if(!product||offers.some(o=>!o))throw Error();
 const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),reader=caktoReader(process.env);
 async function rpc(name,args={}) {const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));if(error)throw Error('reconciliation_storage_unavailable');return data;}
 const window=await rpc('cakto_reconciliation_window');
 // Discovery failure does not block retrying already durable signals.
 let discovery={failed:true};
 try {discovery=await discoverOrders({ids:()=>reader.recentOrderIds(product,window.since,window.until,page),provider:id=>reader.orderAndSubscription(id),enqueue:input=>rpc('enqueue_cakto_api_order',{p_order_id:input.orderId,p_subscription_id:input.subscriptionId,p_product_id:input.productId,p_offer_id:input.offerId,p_reference:input.reference}),product,offers});} catch { /* Summary contains no API error payload. */ }
 const result=await reconcileJobs({lease:()=>rpc('lease_cakto_payment_job',{p_product_id:product,p_offer_ids:offers}),
  process:async job=>{
   const signal=await rpc('read_cakto_payment_signal',{p_event_id:job.eventId});
   const lifecycle=lifecycleEvents.includes(signal?.event);
   const common={signal:async()=>signal,provider:id=>reader.orderAndSubscription(id),save:async(id,result)=>{await rpc(lifecycle?'finish_cakto_lifecycle_job':'finish_cakto_payment_job',{p_event_id:id,p_lease_token:job.leaseToken,p_result:result});},product,offers,now:()=>Date.now()};
   return lifecycle?lifecycleProcessor({...common,binding:(id,subscriptionId,originOrderId)=>rpc('resolve_cakto_lifecycle_binding',{p_event_id:id,p_subscription_id:subscriptionId,p_origin_order_id:originOrderId})})(job.eventId)
    :paymentProcessor({...common,intent:(id,reference)=>rpc('resolve_cakto_payment_intent',{p_event_id:id,p_reference:reference})})(job.eventId);
  },
  recover:async job=>{
   const signal=await rpc('read_cakto_payment_signal',{p_event_id:job.eventId});
   await rpc(lifecycleEvents.includes(signal?.event)?'finish_cakto_lifecycle_job':'finish_cakto_payment_job',{p_event_id:job.eventId,p_lease_token:job.leaseToken,p_result:{outcome:'retry',reason:'unavailable'}});
  },
 });
 const queue=await rpc('cakto_payment_job_summary',{p_product_id:product});
 console.log(JSON.stringify({discovery,page,jobs:result,queue,premiumGranted:false}));
 if(discovery.failed||result.failed)process.exitCode=1;
} catch {console.error('Reconciliação não concluída. Confira configuração e migrations; nenhum acesso concedido.');process.exitCode=1;}
