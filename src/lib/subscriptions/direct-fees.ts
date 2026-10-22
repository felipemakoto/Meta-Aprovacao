import type {DirectMethod} from "./direct-contract.ts";
import {record} from "./cakto-api.ts";
function cents(value:unknown){
 if(typeof value!=="string"&&typeof value!=="number")throw Error("direct_fees_unconfirmed");
 const text=String(value);if(!/^\d{1,6}(?:\.\d{1,2})?$/.test(text))throw Error("direct_fees_unconfirmed");
 const [whole,decimal=""]=text.split(".");return Number(whole)*100+Number(decimal.padEnd(2,"0"));
}
// A post-payment amount check cannot prevent a surprise charge. Validate the
// authenticated fee schedule before creating any financial request or intent.
export function validateDirectFees(value:unknown,method:DirectMethod){
 const fees=record(value);
 if(!Array.isArray(fees.paymentMethods)||!Array.isArray(fees.customerFees)||fees.customerFees.length>20)throw Error("direct_fees_unconfirmed");
 const configured=fees.paymentMethods.map(record).filter(item=>item.paymentMethod===method);
 if(configured.length!==1)throw Error("direct_method_unavailable");
 const merchant=configured[0];
 if(typeof merchant.percentage!=="number"||!Number.isFinite(merchant.percentage)||merchant.percentage<0||merchant.percentage>100||!Number.isInteger(merchant.releaseDays)||Number(merchant.releaseDays)<0)throw Error("direct_method_unavailable");
 cents(merchant.fixed); // null is unconfigured, never zero.
 let buyerFees=0;
 for(const raw of fees.customerFees){
  const item=record(raw);
  if(item.paymentMethod!==null&&typeof item.paymentMethod!=="string")throw Error("direct_fees_unconfirmed");
  if(item.paymentMethod!==null&&item.paymentMethod!==method)continue;
  if(item.percentage!==0)throw Error("direct_fees_changed");
  buyerFees+=cents(item.amount);
 }
 if(buyerFees!==99)throw Error("direct_fees_changed");
 if(method==="credit_card"){
  if(!Array.isArray(fees.creditCardInstallments))throw Error("direct_fees_unconfirmed");
  const single=fees.creditCardInstallments.map(record).filter(item=>item.installments===1);
  if(single.length!==1||single[0].interestPercentage!==0)throw Error("direct_card_interest_unconfirmed");
 }
 return {baseCents:2299,buyerFeeCents:99,totalCents:2398};
}
