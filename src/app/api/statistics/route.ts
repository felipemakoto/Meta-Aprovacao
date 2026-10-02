import { getVerifiedUser } from "@/lib/auth/user";
import { readStatistics } from "@/lib/data/statistics";
import { statisticsHandler } from "@/lib/quiz/statistics-http";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const GET=statisticsHandler({user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},read:readStatistics});
