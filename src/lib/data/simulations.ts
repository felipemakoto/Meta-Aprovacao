import "server-only";
import { createAdminClient } from "../supabase/admin";
export async function simulationRpc(name:string,args:Record<string,unknown>){
 const {data,error}=await createAdminClient().rpc(name,args);
 if(error)throw new Error(["login_required","attempt_unavailable","simulation_unavailable","already_submitted","invalid_answers","rate_limited"].includes(error.message)?error.message:"simulation_error");return data;
}
