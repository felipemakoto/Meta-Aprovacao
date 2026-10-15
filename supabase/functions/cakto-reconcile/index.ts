import {createClient} from "npm:@supabase/supabase-js@2.117.1";
import {caktoReader} from "../../../src/lib/subscriptions/cakto-api.ts";
import {runCaktoAutomation} from "../../../src/lib/subscriptions/automation.ts";
import {automationHandler} from "../../../src/lib/subscriptions/automation-http.ts";
import {AutomationRunError,AutomationStorageError} from "../../../src/lib/subscriptions/automation-diagnostics.ts";
async function rpc(name:string,args:Record<string,unknown>={}) {
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));if(error)throw new AutomationStorageError();return data;
}
Deno.serve(automationHandler({secret:()=>Deno.env.get("CAKTO_WORKER_SECRET")??"",authorize:async nonce=>await rpc("consume_cakto_dispatch",{p_nonce:nonce})===true,run:async()=>{
 try {
  const result=await runCaktoAutomation(rpc,caktoReader({CAKTO_CLIENT_ID:Deno.env.get("CAKTO_CLIENT_ID"),CAKTO_CLIENT_SECRET:Deno.env.get("CAKTO_CLIENT_SECRET")},fetch,event=>console.warn("cakto_authentication_retry",JSON.stringify(event))));
  console.info("cakto_automation",JSON.stringify(result));return result;
 }catch(error){
  console.error("cakto_automation_diagnostic",JSON.stringify(error instanceof AutomationRunError?error.diagnostic:{phase:"lease",category:"internal_error"}));
  throw error;
 }
}}));
