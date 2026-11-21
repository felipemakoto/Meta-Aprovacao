import "server-only";
import {createAdminClient} from "../supabase/admin";
import {prepareAvatar} from "../account/avatar";
import {parseAccountProfile,type AccountCommand} from "../account/contract";
async function rpc(name:string,args:Record<string,unknown>){
 const {data,error}=await createAdminClient().rpc(name,args).abortSignal(AbortSignal.timeout(10000));
 if(error)throw Error(["login_required","rate_limited","invalid_input"].includes(error.message)?error.message:"profile_unavailable");return data;
}
export const readAccountProfile=async(user:string)=>parseAccountProfile(await rpc("read_account_profile",{p_user_id:user}));
export async function reserveAccountUpdate(user:string){await rpc("reserve_account_update",{p_user_id:user});}
export async function readAccountAvatar(user:string){const data=await rpc("read_account_avatar",{p_user_id:user});if(data!==null&&(typeof data!=="string"||data.length>174764))throw Error("profile_unavailable");return data as string|null;}
export async function updateAccount(user:string,command:AccountCommand){
 if(command.action==="save")await rpc(command.theme?"save_account_settings":"save_account_profile",{p_user_id:user,p_nickname:command.nickname,p_reduce_motion:command.reduceMotion,...(command.theme?{p_theme:command.theme}:{})});
 else await rpc("save_account_avatar",{p_user_id:user,p_image:command.action==="avatar"?await prepareAvatar(command.image):null});
 return readAccountProfile(user);
}
