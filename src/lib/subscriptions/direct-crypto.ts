import {createCipheriv,createDecipheriv,hkdfSync,randomBytes,createHash} from "node:crypto";
function key(secret:string){if(secret.length<20)throw Error("direct_unavailable");return Buffer.from(hkdfSync("sha256",secret,"meta-aprovacao","direct-checkout-payload-v1",32));}
export function sealPayment(payload:unknown,secret:string){
 const plain=JSON.stringify(payload),iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(secret),iv);
 const ciphertext=Buffer.concat([cipher.update(plain,"utf8"),cipher.final()]);
 return {sealed:["v1",iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),ciphertext.toString("base64url")].join("."),hash:createHash("sha256").update(plain).digest("hex")};
}
export function openPayment(sealed:string,hash:string,secret:string){
 const [version,iv,tag,body,...extra]=sealed.split(".");if(version!=="v1"||extra.length||!iv||!tag||!body)throw Error("direct_unavailable");
 const decipher=createDecipheriv("aes-256-gcm",key(secret),Buffer.from(iv,"base64url"));decipher.setAuthTag(Buffer.from(tag,"base64url"));
 const plain=Buffer.concat([decipher.update(Buffer.from(body,"base64url")),decipher.final()]).toString("utf8");
 if(createHash("sha256").update(plain).digest("hex")!==hash)throw Error("direct_unavailable");return JSON.parse(plain);
}
