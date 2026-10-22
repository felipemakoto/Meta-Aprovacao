import {getVerifiedUser} from "@/lib/auth/user";
import {directHandlers} from "@/lib/subscriptions/direct-http";
import {directCheckoutEnabled} from "@/lib/subscriptions/direct-config";
import {directCheckoutService} from "@/lib/data/direct-checkout";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
export const {GET,POST}=directHandlers({
 user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at&&u.email?{id:u.id,email:u.email}:null;},
 view:user=>directCheckoutService().view(user),execute:(user,input)=>directCheckoutService().execute(user,input),
},{enabled:directCheckoutEnabled(),origin:process.env.APP_ORIGIN,secure:process.env.NODE_ENV==="production"});
