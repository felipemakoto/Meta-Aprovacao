import {createHmac} from "node:crypto";
import {isIP} from "node:net";

export function loginRateKeys(request:Request,email:string,secret:string,vercel:boolean){
 if(secret.length<32)throw Error("rate_limit_configuration_missing");
 const forwarded=vercel?request.headers.get("x-vercel-forwarded-for")?.trim():undefined;
 const address=forwarded&&isIP(forwarded)?forwarded.toLowerCase():"unresolved";
 const account=email.trim().toLowerCase();
 const digest=(purpose:string,value:string)=>createHmac("sha256",secret).update(`meta-login-limit-v1\n${purpose}\n${value}`).digest("hex");
 return {network:digest("network",address),account:digest("account",account),pair:digest("pair",JSON.stringify([address,account]))};
}
