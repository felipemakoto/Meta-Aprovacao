import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { caktoReader } from "@/lib/subscriptions/cakto-api";
import { paymentProcessor } from "@/lib/subscriptions/payment-processing";

export async function processCaktoSignal(eventId:number) {
  const admin=createAdminClient();
  async function rpc(name:string,args:Record<string,unknown>) {
    const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));
    if (error) throw Error("payment_storage_unavailable");
    return data;
  }
  return paymentProcessor({
    signal:id=>rpc("read_cakto_payment_signal",{p_event_id:id}),
    provider:id=>caktoReader(process.env).orderAndSubscription(id),
    intent:(id,reference)=>rpc("resolve_cakto_payment_intent",{p_event_id:id,p_reference:reference}),
    save:async(id,result)=>{await rpc("record_cakto_payment_check",{p_event_id:id,p_result:result});},
    product:process.env.CAKTO_PRODUCT_ID ?? "",
    offers:[...new Set([process.env.CAKTO_REGULAR_OFFER_ID ?? "",process.env.CAKTO_OCTOBER_OFFER_ID ?? ""])], now:()=>Date.now(),
  })(eventId);
}
