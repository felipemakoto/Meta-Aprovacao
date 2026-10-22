import {randomUUID} from "node:crypto";
import {directPayload,providerDirectResult,type DirectInput,type DirectMethod,type DirectState} from "./direct-contract.ts";
import {openPayment,sealPayment} from "./direct-crypto.ts";
import {definitePaymentRejection,directOrderState} from "./cakto-direct-api.ts";
import type {CheckoutOffer} from "./checkout-contract.ts";
type Attempt={id:string;reference:string;method:DirectMethod;state:Exclude<DirectState["status"],"empty">;payload:string|null;payload_hash:string;order_id:string|null;qr_code:string|null;qr_expires_at:string|null;created_at:string;intent_expires_at?:string};
type User={id:string;email:string};
type Dependencies={rpc:(name:string,args:Record<string,unknown>)=>Promise<unknown>;access:(user:string)=>Promise<{hasPremium:boolean}>;intent:(user:string,offer:CheckoutOffer)=>Promise<unknown>;offer:()=>CheckoutOffer;validate:(offer:CheckoutOffer,method:DirectMethod)=>Promise<void>;create:(payload:unknown,key:string)=>Promise<unknown>;order:(id:string)=>Promise<Record<string,unknown>>;qr:(code:string)=>Promise<string>;secret:string;now:()=>number};
export function directService(deps:Dependencies){
 const read=async(user:string)=>(await deps.rpc("read_direct_checkout",{p_user_id:user})) as Attempt|null;
 async function view(user:string):Promise<DirectState>{
  const access=await deps.access(user),row=await read(user),base={hasPremium:access.hasPremium,serverNow:new Date(deps.now()).toISOString()};
  if(access.hasPremium)return {...base,status:"complete"};
  if(!row)return {...base,status:"empty"};
  return {...base,status:row.state,method:row.method,...(row.state==="unknown"?{canResume:!!row.payload&&Date.parse(row.intent_expires_at??"")>deps.now()&&deps.now()-Date.parse(row.created_at)<23*3600000}:{}),...(row.qr_code&&row.qr_expires_at?{qrCode:row.qr_code,qrImage:await deps.qr(row.qr_code),expiresAt:row.qr_expires_at}:{})};
 }
 async function execute(user:User,input:DirectInput):Promise<DirectState>{
  if((await deps.access(user.id)).hasPremium)throw Error("already_premium");
  const offer=deps.offer(),existing=await read(user.id),lease=randomUUID();
  if(input.action==="refresh"){
   if(existing?.order_id&&["awaiting","paid"].includes(existing.state)){
    if(!await deps.rpc("claim_direct_refresh",{p_user_id:user.id,p_id:existing.id}))return view(user.id);
    const order=await deps.order(existing.order_id),state=directOrderState(order,{id:existing.order_id,reference:existing.reference,product:offer.productId});
    if(state)await deps.rpc("refresh_direct_checkout",{p_user_id:user.id,p_id:existing.id,p_order:existing.order_id,p_state:state});
   }
   return view(user.id);
  }
  let result:{claimed:boolean;attempt:Attempt};
  if(input.action==="resume"){
   if(existing)await deps.validate(offer,existing.method);
   result=await deps.rpc("resume_direct_checkout",{p_user_id:user.id,p_lease:lease}) as typeof result;
  }
  else {
   if(existing&&["processing","unknown","awaiting","paid"].includes(existing.state))return view(user.id);
   await deps.validate(offer,input.method);
   const intent=await deps.intent(user.id,offer) as {reference:string};
   const payload=directPayload(input,user.email,offer.offerId,intent.reference),sealed=sealPayment(payload,deps.secret);
   result=await deps.rpc("begin_direct_checkout",{p_user_id:user.id,p_reference:intent.reference,p_method:input.method,p_payload:sealed.sealed,p_hash:sealed.hash,p_lease:lease}) as typeof result;
  }
  if(!result.claimed)return view(user.id);
  const row=result.attempt;
  const finish=(state:string,order:string|null=null,qr:string|null=null,expires:string|null=null)=>deps.rpc("finish_direct_checkout",{p_user_id:user.id,p_id:row.id,p_lease:lease,p_state:state,p_order:order,p_qr:qr,p_expires:expires});
  try{
   // Persisted ciphertext is reused byte-for-byte after network uncertainty.
   const payload=openPayment(row.payload!,row.payload_hash,deps.secret);
   const raw=await deps.create(payload,row.id);
   const confirmed=providerDirectResult(raw,{method:row.method,productId:offer.productId,offerId:offer.offerId});
   await finish(confirmed.status,confirmed.orderId,confirmed.qrCode,confirmed.expiresAt);
  }catch(error){
   // No new key after timeouts, 409, 429, 5xx, malformed result or failed persistence.
   // If finish fails, its lease expires into unknown and the same key is retained.
   try{await finish(definitePaymentRejection(error)?"failed":"unknown");}catch{/* Fail closed; never fabricate success. */}
  }
  return view(user.id);
 }
 return {view,execute};
}
