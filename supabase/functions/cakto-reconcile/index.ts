import {createClient} from "npm:@supabase/supabase-js@2.117.1";
import {caktoReader} from "../../../src/lib/subscriptions/cakto-api.ts";
import {runCaktoAutomation} from "../../../src/lib/subscriptions/automation.ts";
import {automationHandler} from "../../../src/lib/subscriptions/automation-http.ts";
async function rpc(name:string,args:Record<string,unknown>={}) {
 const url=Deno.env.get("SUPABASE_URL")??"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.rpc(name,args).abortSignal(AbortSignal.timeout(5000));if(error)throw Error("automation_storage_unavailable");return data;
}
Deno.serve(automationHandler({secret:()=>Deno.env.get("CAKTO_WORKER_SECRET")??"",authorize:async nonce=>await rpc("consume_cakto_dispatch",{p_nonce:nonce})===true,run:async()=>{
 const result=await runCaktoAutomation(rpc,caktoReader({CAKTO_CLIENT_ID:Deno.env.get("CAKTO_CLIENT_ID"),CAKTO_CLIENT_SECRET:Deno.env.get("CAKTO_CLIENT_SECRET")}));
 console.info("cakto_automation",JSON.stringify(result));return result;
}}));
