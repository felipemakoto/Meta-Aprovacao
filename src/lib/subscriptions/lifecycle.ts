import { CaktoReadError, orderUuid, record } from "./cakto-api.ts";
import { cents } from "./payment-verification.ts";

export const lifecycleEvents = ["purchase_refused", "refund", "refund_requested", "chargeback", "subscription_canceled", "subscription_renewed", "subscription_renewal_refused", "subscription_paused", "subscription_resumed", "subscription_late", "subscription_late_recovered"];
export type LifecycleBinding = {subscriptionId:string; originOrderId:string; productId:string; offerId:string};
export type LifecycleSnapshot = LifecycleBinding & {providerStatus:string; providerUpdatedAt:string; orderStatus:string; action:"preserve"|"revoke"; occurredAt:string|null};
export type LifecycleCheck = {outcome:"verified"|"review"|"retry";reason:string;snapshot?:LifecycleSnapshot};
const statuses = ["active", "inactive", "canceled", "expired", "paused", "late", "trial"];
const orders = ["processing", "authorized", "paid", "refund_requested", "in_settlement", "acquirer_error", "refunded", "waiting_payment", "refused", "blocked", "chargedback", "canceled", "in_protest", "partially_paid", "prechargeback", "scheduled", "retrying", "MED"];
function instant(value:unknown) {
  return typeof value==="string" && value.length<=64 && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
}
// Observations never grant or extend access. Billing estimates are not paid periods.
export function lifecycleDecision(orderValue:unknown,subValue:unknown,binding:LifecycleBinding,now:number):LifecycleCheck {
  const review=(reason:string):LifecycleCheck=>({outcome:"review",reason});
  try {
    const order=record(orderValue),sub=record(subValue);
    orderUuid(binding.subscriptionId);orderUuid(binding.originOrderId);
    if(typeof order.id!=="string")return review("lifecycle_response_incomplete");orderUuid(order.id);
    if(!Number.isFinite(now) || order.subscription!==binding.subscriptionId || sub.id!==binding.subscriptionId || sub.parent_order!==binding.originOrderId ||
      record(order.product).id!==binding.productId || sub.product!==binding.productId || sub.offer!==binding.offerId ||
      !Array.isArray(sub.orders) || !sub.orders.includes(order.id) || !sub.orders.includes(binding.originOrderId) || order.type!=="subscription" || order.offer_type!=="main") return review("identity_mismatch");
    const updated=instant(sub.updatedAt);
    if(updated===null || updated>now || typeof sub.status!=="string" || !statuses.includes(sub.status) || typeof order.status!=="string" || !orders.includes(order.status)) return review("lifecycle_response_incomplete");
    const canceled=instant(sub.canceledAt);
    if((sub.status==="canceled" && (canceled===null || canceled>updated)) || (sub.status!=="canceled" && sub.canceledAt!==null)) return review("lifecycle_response_incomplete");
    let action:"preserve"|"revoke"="preserve",occurredAt:string|null=null;
    if(order.status==="refunded" || order.status==="chargedback") {
      const at=instant(order.status==="refunded"?order.refundedAt:order.chargedbackAt),paid=instant(order.paidAt);
      if(at===null || paid===null || at<paid || at>now) return review("reversal_unconfirmed");
      action="revoke";occurredAt=new Date(at).toISOString();
    } else {
      if(order.refundedAt!==null || order.chargedbackAt!==null) return review("reversal_unconfirmed");
      if(order.status==="paid" && (typeof order.subscription_period!=="number" || !Number.isInteger(order.subscription_period) || order.subscription_period<1))return review("lifecycle_response_incomplete");
      if(order.status==="paid" && typeof order.subscription_period==="number" && Number.isInteger(order.subscription_period) && order.subscription_period>1) {
        if(order.currency!=="BRL")return review("currency_unconfirmed");
        if(cents(order.baseAmount)!==2299 || cents(order.discount)!==0 || cents(order.amount)!==2398 || cents(sub.amount)!==2299 || order.couponCode!==null) return review("amount_or_coupon_mismatch");
        // next_payment_date is explicitly estimated by the provider. No inferred renewal end.
        return review("paid_period_unconfirmed");
      }
    }
    return {outcome:"verified",reason:"lifecycle_observed",snapshot:{subscriptionId:binding.subscriptionId,originOrderId:binding.originOrderId,productId:binding.productId,offerId:binding.offerId,providerStatus:sub.status,providerUpdatedAt:new Date(updated).toISOString(),orderStatus:order.status,action,occurredAt}};
  } catch {return review("lifecycle_response_incomplete");}
}
type Signal={orderId:string;productId:string;offerId:string;event:string};
export function lifecycleProcessor(deps:{signal:(id:number)=>Promise<Signal|null>;provider:(id:string)=>Promise<{order:Record<string,unknown>;subscription:Record<string,unknown>|null}>;binding:(id:number,subscriptionId:string,originOrderId:string)=>Promise<LifecycleBinding|null>;save:(id:number,result:LifecycleCheck)=>Promise<void>;product:string;offers:string[];now:()=>number}) {
  return async(eventId:number):Promise<LifecycleCheck>=>{
    if(!Number.isSafeInteger(eventId)||eventId<1)throw Error("invalid_event_id");
    if(!deps.product || !deps.offers.length || deps.offers.some(o=>!o))throw Error("configuration_missing");
    const signal=await deps.signal(eventId);if(!signal)throw Error("signal_not_found");
    let result:LifecycleCheck={outcome:"review",reason:"signal_not_allowed"};
    if(lifecycleEvents.includes(signal.event) && signal.productId===deps.product && deps.offers.includes(signal.offerId)) {
      try {
        orderUuid(signal.orderId);
        const {order,subscription:sub}=await deps.provider(signal.orderId);
        if(order.id!==signal.orderId || !sub || typeof sub.id!=="string" || typeof sub.parent_order!=="string")throw new CaktoReadError("invalid_response");
        orderUuid(sub.id);orderUuid(sub.parent_order);
        const binding=await deps.binding(eventId,sub.id,sub.parent_order);
        result=!binding?{outcome:"review",reason:"subscription_binding_missing"}
          :binding.productId!==signal.productId || binding.offerId!==signal.offerId?{outcome:"review",reason:"identity_mismatch"}
          :lifecycleDecision(order,sub,binding,deps.now());
      }catch(error) {
        if(!(error instanceof CaktoReadError))throw Error("lifecycle_processing_unavailable");
        result={outcome:["unavailable","rate_limited","unauthorized","configuration_missing"].includes(error.message)?"retry":"review",reason:error.message};
      }
    }
    await deps.save(eventId,result);return result;
  };
}
