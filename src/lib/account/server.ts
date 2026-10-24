import "server-only";
import {getVerifiedUser} from "../auth/user";
import {accountHandlers} from "./http";
import {readAccountProfile,readAccountAvatar,reserveAccountUpdate,updateAccount} from "../data/account";
export const account=accountHandlers({user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},read:readAccountProfile,avatar:readAccountAvatar,reserve:reserveAccountUpdate,execute:updateAccount},{origin:process.env.APP_ORIGIN,secure:process.env.NODE_ENV==="production"});
