import "server-only";
import {createAdminClient} from "../supabase/admin";
import {parsePreferences,preferenceDefaults} from "../account/settings-contract";
export async function accountSettingsRpc(name:string,args:Record<string,unknown>){const {data,error}=await createAdminClient().rpc(name,args).abortSignal(AbortSignal.timeout(15000));if(error)throw Error(["login_required","invalid_input","rate_limited","subscription_review_required","deletion_unavailable","export_limit_requires_support"].includes(error.message)?error.message:"settings_unavailable");return data;}
export async function readPreferences(user:string){const data=await accountSettingsRpc("read_account_preferences",{p_user_id:user});return parsePreferences({...preferenceDefaults,...data});}
