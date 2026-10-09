import { record, orderUuid } from "./cakto-api.ts";
export type PaymentLease={eventId:number;leaseToken:string;attempt:number};
export async function reconcileJobs(deps:{lease:()=>Promise<PaymentLease|null>;process:(lease:PaymentLease)=>Promise<{outcome:"verified"|"review"|"retry"}>;recover:(lease:PaymentLease)=>Promise<void>},limit=5) {
  if(!Number.isInteger(limit)||limit<1||limit>10)throw Error("invalid_reconciliation_limit");
  const summary={processed:0,verified:0,review:0,retry:0,failed:0};
  for(let n=0;n<limit;n++) {
    const job=await deps.lease();if(!job)break;
    if(!Number.isSafeInteger(job.eventId)||job.eventId<1||typeof job.leaseToken!=="string"||!Number.isInteger(job.attempt)||job.attempt<1||job.attempt>8)throw Error("invalid_payment_lease");
    orderUuid(job.leaseToken);
    try {const result=await deps.process(job);summary[result.outcome]++;summary.processed++;}
    catch {summary.failed++;try {await deps.recover(job);} catch { /* Expired/failed lease is recovered by the database on a later run. */ }}
  }
  return summary;
}
export async function discoverOrders(deps:{ids:()=>Promise<{orderIds:string[];hasMore:boolean}>;provider:(id:string)=>Promise<{order:Record<string,unknown>;subscription:Record<string,unknown>|null}>;enqueue:(input:{orderId:string;subscriptionId:string;productId:string;offerId:string;reference:string})=>Promise<boolean>;product:string;offers:string[]}) {
  const page=await deps.ids();if(page.orderIds.length>5)throw Error("discovery_limit");
  let matched=0,ignored=0;
  for(const id of page.orderIds) {
    orderUuid(id);
    const {order,subscription:sub}=await deps.provider(id);
    if(order.id!==id || record(order.product).id!==deps.product || !sub || order.subscription!==sub.id || sub.product!==deps.product || typeof sub.offer!=="string" || !deps.offers.includes(sub.offer) || !Array.isArray(sub.orders) || !sub.orders.includes(id) || order.status!=="paid" || order.type!=="subscription" || typeof order.subscription_period!=="number" || !Number.isInteger(order.subscription_period) || order.subscription_period<1 || order.subscription_period>10000 || typeof sub.id!=="string") {ignored++;continue;}
    const first=order.subscription_period===1;
    if(first?(sub.parent_order!==id || typeof order.sck!=="string" || !/^[a-f0-9]{64}$/.test(order.sck)):(typeof sub.parent_order!=="string" || sub.parent_order===id || !sub.orders.includes(sub.parent_order))) {ignored++;continue;}
    orderUuid(sub.id);
    if(await deps.enqueue({orderId:id,subscriptionId:sub.id,productId:deps.product,offerId:sub.offer,reference:first?order.sck as string:""}))matched++;else ignored++;
  }
  return {matched,ignored,hasMore:page.hasMore};
}
