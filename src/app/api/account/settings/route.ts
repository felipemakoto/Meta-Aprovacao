import {NextRequest} from "next/server";
import {createClient as createAuthClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getSupabaseConfig} from "@/lib/supabase/config";
import {getVerifiedUser} from "@/lib/auth/user";
import {trustedAuthOrigin,authHeaders} from "@/lib/auth/signup-http";
import {readAuthJson,AuthBodyError} from "@/lib/auth/request-body";
import {accountSettingsRpc,readPreferences} from "@/lib/data/account-settings";
import {reserveAccountUpdate,readAccountAvatar} from "@/lib/data/account";
import {parsePreferences} from "@/lib/account/settings-contract";
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:authHeaders});
function failure(e:unknown){if(e instanceof AuthBodyError)return json({error:e.message},e.status);const code=e instanceof Error?e.message:"";const map:Record<string,number>={login_required:401,invalid_input:400,rate_limited:429,reauthentication_required:403,subscription_review_required:409,deletion_unavailable:409,export_limit_requires_support:409};return json({error:map[code]?code:"settings_unavailable"},map[code]??503);}
async function identity(request:Request,allowPreferencesView=false){const params=new URL(request.url).searchParams;if((params.size&&!(allowPreferencesView&&params.size===1&&params.getAll('view').length===1&&params.get('view')==='preferences'))||request.headers.get("sec-fetch-site")==="cross-site")throw Error("invalid_input");const user=await getVerifiedUser();if(!user?.email_confirmed_at)throw Error("login_required");return user;}
export async function GET(request:Request){try{const user=await identity(request,true);const brief=new URL(request.url).searchParams.get('view')==='preferences';const [preferences,security]=await Promise.all([readPreferences(user.id),brief?Promise.resolve(undefined):accountSettingsRpc("account_security_summary",{p_user_id:user.id})]);return json({preferences,security});}catch(e){return failure(e);}}
export async function POST(request:NextRequest){
 if(!trustedAuthOrigin(request.headers.get("origin"),{secure:process.env.NODE_ENV==="production",origin:process.env.APP_ORIGIN})||request.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
 try{
 const user=await identity(request);if(request.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return json({error:"invalid_input"},415);
 const value=await readAuthJson(request,6144);if(!value||typeof value!=="object"||Array.isArray(value))throw Error("invalid_input");const v=value as Record<string,unknown>,keys=Object.keys(v).sort().join();
 if(v.action==="save"&&keys==="action,preferences"){const preferences=parsePreferences(v.preferences);await accountSettingsRpc("save_account_preferences",{p_user_id:user.id,p_preferences:preferences});return json({preferences});}
 if(v.action==="appearance"&&keys==="action,reduceMotion,theme"){if(typeof v.theme!=="string"||!["light","dark","system"].includes(v.theme)||typeof v.reduceMotion!=="boolean")throw Error("invalid_input");const profile=await accountSettingsRpc("save_account_appearance",{p_user_id:user.id,p_theme:v.theme,p_reduce_motion:v.reduceMotion});return json({profile});}
 if(v.action==="export"&&keys==="action"){const data=await accountSettingsRpc("export_account_data",{p_user_id:user.id});const [avatar,savedQuizzes]=await Promise.all([readAccountAvatar(user.id),accountSettingsRpc("export_account_quizzes",{p_user_id:user.id})]);return json({exportedAt:new Date().toISOString(),account:{email:user.email,createdAt:user.created_at,legalAcceptance:user.user_metadata.legal_acceptance??null},avatarWebpBase64:avatar,savedQuizzes,data});}
 if(v.action==="revoke_others"&&keys==="action"){await reserveAccountUpdate(user.id);const client=await createClient();const session=await client.auth.getSession();if(!session.data.session)throw Error("login_required");const result=await createAdminClient().auth.admin.signOut(session.data.session.access_token,"others");if(result.error)throw Error("settings_unavailable");return json({status:"revoked"});}
 if(v.action!=="delete"||keys!=="action,confirmation,password"||v.confirmation!=="EXCLUIR"||typeof v.password!=="string"||new TextEncoder().encode(v.password).length>1024)throw Error("invalid_input");
 await reserveAccountUpdate(user.id);
 if(user.app_metadata.provider==="google"){
  const client=await createClient(),claims=await client.auth.getClaims();const amr=claims.data?.claims.amr;const now=Date.now()/1000;
  if(claims.error||claims.data?.claims.sub!==user.id||!Array.isArray(amr)||!amr.some(x=>typeof x==="object"&&x!==null&&x.method==="oauth"&&typeof x.timestamp==="number"&&x.timestamp<=now&&now-x.timestamp<=300)||amr.some(x=>typeof x==="object"&&x!==null&&x.method==="recovery"))throw Error("reauthentication_required");
 }else{
  const {url,publishableKey}=getSupabaseConfig();const check=createAuthClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const result=await check.auth.signInWithPassword({email:user.email!,password:v.password});const ok=!result.error&&result.data.user?.id===user.id;
  if(result.data.session)await check.auth.signOut({scope:"local"});if(!ok)throw Error("reauthentication_required");
 }
 const deleted=await accountSettingsRpc("delete_unbilled_account",{p_user_id:user.id});if(deleted!==true)throw Error("deletion_unavailable");
 const client=await createClient();try{await client.auth.signOut({scope:"local"});}catch{/* Auth row and sessions are already removed atomically. */}return json({status:"deleted"});
 }catch(e){return failure(e);}
}
