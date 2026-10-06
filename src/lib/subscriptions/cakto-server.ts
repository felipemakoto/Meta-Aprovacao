import "server-only";
import { caktoReader } from "./cakto-api";
import { firstPaymentDecision, type FirstPaymentExpectation } from "./payment-verification";

// No public route or entitlement mutation: caller must resolve a private intent first.
export async function verifyFirstCaktoPayment(expected: FirstPaymentExpectation) {
  const {order, subscription} = await caktoReader(process.env).orderAndSubscription(expected.orderId);
  return firstPaymentDecision(order, subscription, expected, Date.now());
}
