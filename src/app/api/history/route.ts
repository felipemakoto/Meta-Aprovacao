import { getVerifiedUser } from "@/lib/auth/user";
import { readHistory } from "@/lib/data/history";
import { historyHandler } from "@/lib/quiz/history-http";
export const dynamic="force-dynamic";
export const GET=historyHandler({user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},read:readHistory});

