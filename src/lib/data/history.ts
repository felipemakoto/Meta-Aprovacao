import "server-only";
import { createAdminClient } from "../supabase/admin";
import type { Cursor, HistoryKind } from "../quiz/history-contract";
export async function readHistory(user:string,kind:HistoryKind,before:Cursor|null) {
 const {data,error}=await createAdminClient().rpc("read_study_history",{p_user_id:user,p_kind:kind,p_before:before?.at??null,p_before_id:before?.id??null});
 if(error)throw new Error("history_unavailable");return data;
}
export async function readHistoryDetail(user:string,kind:HistoryKind,id:string) {
 const {data,error}=await createAdminClient().rpc("read_history_detail",{p_user_id:user,p_kind:kind,p_id:id});
 if(error)throw new Error("history_unavailable");return data;
}

