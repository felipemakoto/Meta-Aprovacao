import "server-only";
import QRCode from "qrcode";
import {createAdminClient} from "@/lib/supabase/admin";
import {readSubscriptionAccess} from "./subscriptions";
import {createCheckoutIntent} from "./checkout";
import {parseSubscriptionAccess} from "@/lib/subscriptions/contract";
import {configuredCheckout} from "@/lib/subscriptions/checkout-contract";
import {caktoDirectApi} from "@/lib/subscriptions/cakto-direct-api";
import {caktoReader} from "@/lib/subscriptions/cakto-api";
import {directService} from "@/lib/subscriptions/direct-service";
async function rpc(name:string,args:Record<string,unknown>){
 const {data,error}=await createAdminClient().rpc(name,args).abortSignal(AbortSignal.timeout(5000));
 if(error)throw Error(["already_premium","checkout_rate_limited","payment_not_found"].includes(error.message)?error.message:"direct_unavailable");return data;
}
export function directCheckoutService(){
 const api=caktoDirectApi(process.env);
 return directService({rpc,access:async user=>parseSubscriptionAccess(await readSubscriptionAccess(user)),intent:createCheckoutIntent,
  offer:()=>configuredCheckout(process.env,new Date()),validate:api.validateOffer,create:api.create,
  order:async id=>(await caktoReader(process.env).orderAndSubscription(id)).order,
  qr:code=>QRCode.toDataURL(code,{width:320,margin:4,errorCorrectionLevel:"M"}),secret:process.env.CAKTO_CLIENT_SECRET??"",now:Date.now});
}
