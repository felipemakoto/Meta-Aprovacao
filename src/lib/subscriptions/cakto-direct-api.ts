import {caktoTransport,CaktoReadError,record} from "./cakto-api.ts";
import type {CheckoutOffer} from "./checkout-contract.ts";
import type {DirectMethod} from "./direct-contract.ts";
import {validateDirectFees} from "./direct-fees.ts";
export function caktoDirectApi(env:Record<string,string|undefined>,transport:typeof fetch=fetch){
 const {json,token}=caktoTransport(env,transport);
 return {
  async validateOffer(offer:CheckoutOffer,method:DirectMethod){
   const access=await token(),options={method:"GET",headers:{Authorization:`Bearer ${access}`}};
   const o=await json(`offers/${offer.offerId}/`,options,65536,"offer");
   if(o.id!==offer.offerId||o.product!==offer.productId||o.status!=="active"||o.currency!=="BRL"||Number(o.price)!==22.99||o.type!=="subscription"||o.recurrence_period!==30||o.quantity_recurrences!==-1)throw Error("direct_offer_changed");
   const p=await json(`products/${offer.productId}/`,options,262144,"product");
   if(p.id!==offer.productId||!Array.isArray(p.paymentMethods)||!p.paymentMethods.includes(method))throw Error("direct_method_unavailable");
   validateDirectFees(await json("fees/",options,65536,"fees"),method);
  },
  async create(payload:unknown,idempotency:string){
   if(!/^[a-f0-9-]{36}$/i.test(idempotency))throw Error("invalid_input");
   const access=await token();
   return json("payments/",{method:"POST",headers:{Authorization:`Bearer ${access}`,"Content-Type":"application/json","X-Idempotency-Key":idempotency},body:JSON.stringify(payload)},65536,"payment",30000);
  },
 };
}
export function definitePaymentRejection(error:unknown){return error instanceof CaktoReadError&&error.operation==="payment"&&[400,401,403,404,422].includes(error.status??0);}
export function directOrderState(value:unknown,expected:{id:string;reference:string;product:string}){
 const r=record(value);if(r.id!==expected.id||r.sck!==expected.reference||record(r.product).id!==expected.product)throw Error("provider_response_unconfirmed");
 return r.status==="paid"?"paid":["refused","declined","expired","canceled"].includes(String(r.status))?"failed":null;
}
