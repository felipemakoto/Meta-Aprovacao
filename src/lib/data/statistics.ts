import "server-only";
import { createAdminClient } from "../supabase/admin";
import { parseStatistics,type Period } from "../quiz/statistics-contract";
export async function readStatistics(user:string,period:Period){const {data,error}=await createAdminClient().rpc("read_study_statistics",{p_user_id:user,p_period:period});if(error)throw Error("statistics_unavailable");return data;}
export async function statistics(user:string,period:Period){return parseStatistics(await readStatistics(user,period),period);}
