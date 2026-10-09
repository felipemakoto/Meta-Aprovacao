import { CaktoReadError, orderUuid, record } from "./cakto-api.ts";
import { firstPaymentDecision, type FirstPaymentExpectation } from "./payment-verification.ts";

export type PaymentCheck = {outcome:"verified" | "review" | "retry"; reason:string; reference?:string; evidence?:Extract<ReturnType<typeof firstPaymentDecision>, {verified:true}>["evidence"]};
type Signal = {orderId:string; productId:string; offerId:string; event:string};
type Dependencies = {
  signal: (id:number) => Promise<Signal | null>;
  provider: (orderId:string) => Promise<{order:Record<string,unknown>; subscription:Record<string,unknown> | null}>;
  intent: (id:number, reference:string) => Promise<FirstPaymentExpectation | null>;
  save: (id:number, result:PaymentCheck) => Promise<void>;
  product:string; offers:string[]; now:()=>number;
};
// The administrative processor delegates atomic evidence and access persistence to its server dependency.
export function paymentProcessor(deps:Dependencies) {
  return async (eventId:number):Promise<PaymentCheck> => {
    if (!Number.isSafeInteger(eventId) || eventId < 1) throw Error("invalid_event_id");
    if (!deps.product || !deps.offers.length || deps.offers.some(o=>!o)) throw Error("configuration_missing");
    const signal=await deps.signal(eventId);
    if (!signal) throw Error("signal_not_found");
    let result:PaymentCheck;
    if (!["purchase_approved","subscription_created"].includes(signal.event)) result={outcome:"review",reason:"event_requires_lifecycle_processing"};
    else if (signal.productId !== deps.product || !deps.offers.includes(signal.offerId)) result={outcome:"review",reason:"signal_not_allowed"};
    else {
      try {
        orderUuid(signal.orderId);
        const {order,subscription}=await deps.provider(signal.orderId);
        if (order.id !== signal.orderId) throw new CaktoReadError("invalid_response");
        const reference=record(order).sck;
        if (typeof reference !== "string" || !/^[a-f0-9]{64}$/.test(reference)) result={outcome:"review",reason:"reference_missing"};
        else {
          // Resolve using the API reference, never the webhook's sck or customer identity.
          const expected=await deps.intent(eventId,reference);
          if (!expected) result={outcome:"review",reason:"intent_not_found"};
          else if (expected.orderId !== signal.orderId || expected.productId !== signal.productId || expected.offerId !== signal.offerId || expected.reference !== reference) result={outcome:"review",reason:"identity_mismatch"};
          else {
            const decision=firstPaymentDecision(order,subscription,expected,deps.now());
            result=decision.verified ? {outcome:"verified",reason:decision.reason,reference,evidence:decision.evidence} : {outcome:"review",reason:decision.reason};
          }
        }
      } catch(error) {
        if (!(error instanceof CaktoReadError)) throw Error("payment_processing_unavailable");
        result={outcome:["unavailable","rate_limited","unauthorized","configuration_missing"].includes(error.message)?"retry":"review",reason:error.message};
      }
    }
    await deps.save(eventId,result); // A failed save is never reported as a completed verification.
    return result;
  };
}
