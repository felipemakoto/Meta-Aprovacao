import {caktoReader,orderUuid,record} from "./cakto-api.ts";
import {lifecycleEvents,lifecycleProcessor,type LifecycleBinding} from "./lifecycle.ts";
import {paymentProcessor} from "./payment-processing.ts";
import {discoverOrders,reconcileJobs,type PaymentLease} from "./reconciliation.ts";
import type {FirstPaymentExpectation} from "./payment-verification.ts";
export type AutomationRpc=(name:string,args?:Record<string,unknown>)=>Promise<unknown>;
type Provider=ReturnType<typeof caktoReader>;
export async function runCaktoAutomation(rpc:AutomationRpc,provider:Provider,now:()=>number=Date.now) {
 const value=await rpc("lease_cakto_automation");if(value===null)return {skipped:true};
 const a=record(value);if(typeof a.token!=="string")throw Error("invalid_automation_lease");const token=orderUuid(a.token);
 try {
  if(typeof a.product!=="string"||!a.product||!Array.isArray(a.offers)||a.offers.some(o=>typeof o!=="string"||!o)||!["jobs","discovery"].includes(String(a.mode)))throw Error();
  const product=a.product,offers=a.offers as string[];
  if(a.mode==="discovery") {
   if(!Number.isInteger(a.page)||Number(a.page)<1||Number(a.page)>100||!Number.isInteger(a.offset)||Number(a.offset)<0||Number(a.offset)>4||typeof a.since!=="string"||typeof a.until!=="string")throw Error();
   const page=Number(a.page),offset=Number(a.offset),batch=await provider.recentOrderIds(product,a.since,a.until,page);
   // One order per scan invocation keeps the worst-case network time bounded and advances a durable cursor.
   const ids=batch.orderIds.slice(offset,offset+1);
   const found=await discoverOrders({ids:async()=>({orderIds:ids,hasMore:false}),provider:id=>provider.orderAndSubscription(id),
    enqueue:async i=>await rpc("enqueue_cakto_api_order",{p_order_id:i.orderId,p_subscription_id:i.subscriptionId,p_product_id:i.productId,p_offer_id:i.offerId,p_reference:i.reference})===true,product,offers});
   const end=offset+1>=batch.orderIds.length,done=end&&(!batch.hasMore||page===100),nextPage=end&&!done?page+1:page,nextOffset=end?0:offset+1;
   const summary={matched:found.matched,ignored:found.ignored,truncated:Number(end&&batch.hasMore&&page===100)};
   await rpc("finish_cakto_automation",{p_token:token,p_ok:true,p_summary:summary,p_page:nextPage,p_offset:nextOffset,p_done:done});
   return {skipped:false,mode:"discovery",summary};
  }
  const endAt=now()+90000;
  const signal=async(id:number)=>{
   const v=await rpc("read_cakto_payment_signal",{p_event_id:id});if(v===null)return null;
   const s=record(v);if([s.orderId,s.productId,s.offerId,s.event].some(x=>typeof x!=="string"))throw Error();
   return {orderId:s.orderId as string,productId:s.productId as string,offerId:s.offerId as string,event:s.event as string};
  };
  const finish=async(job:PaymentLease,result:unknown,lifecycle:boolean)=>{await rpc(lifecycle?"finish_cakto_lifecycle_job":"finish_cakto_payment_job",{p_event_id:job.eventId,p_lease_token:job.leaseToken,p_result:result});};
  const summary=await reconcileJobs({lease:async()=>now()+40000>endAt?null:await rpc("lease_cakto_payment_job",{p_product_id:product,p_offer_ids:offers}) as PaymentLease|null,
   process:async job=>{
    const s=await signal(job.eventId),lifecycle=lifecycleEvents.includes(s?.event??"");
    const common={signal:async()=>s,provider:(id:string)=>provider.orderAndSubscription(id),save:async(_id:number,result:unknown)=>finish(job,result,lifecycle),product,offers,now};
    return lifecycle?lifecycleProcessor({...common,binding:async(id,subscriptionId,originOrderId)=>await rpc("resolve_cakto_lifecycle_binding",{p_event_id:id,p_subscription_id:subscriptionId,p_origin_order_id:originOrderId}) as LifecycleBinding|null})(job.eventId)
     :paymentProcessor({...common,intent:async(id,reference)=>await rpc("resolve_cakto_payment_intent",{p_event_id:id,p_reference:reference}) as FirstPaymentExpectation|null})(job.eventId);
   },recover:async job=>{const s=await signal(job.eventId);await finish(job,{outcome:"retry",reason:"unavailable"},lifecycleEvents.includes(s?.event??""));},
  },2);
  await rpc("finish_cakto_automation",{p_token:token,p_ok:summary.failed===0,p_summary:summary});
  return {skipped:false,mode:"jobs",summary};
 }catch {
  try {await rpc("finish_cakto_automation",{p_token:token,p_ok:false,p_summary:{failed:1}});}catch{/* Expired lease is recoverable. */}
  throw Error("automation_unavailable");
 }
}
