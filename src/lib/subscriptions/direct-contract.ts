export const directMethods=["pix_auto","pix","credit_card"] as const;
export type DirectMethod=typeof directMethods[number];
export type DirectInput={action:"create";method:DirectMethod;name:string;phone:string;cpf:string;fingerprint:string;cardToken?:string;antifraud?:string}|{action:"resume"}|{action:"refresh"};
export type DirectState={status:"empty"|"processing"|"unknown"|"awaiting"|"paid"|"failed"|"complete";method?:DirectMethod;qrCode?:string;qrImage?:string;expiresAt?:string;canResume?:boolean;hasPremium:boolean;serverNow:string};
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("invalid_input");return v as Record<string,unknown>;}
export function validCpf(value:string){
 if(!/^\d{11}$/.test(value)||/^(\d)\1+$/.test(value))return false;
 for(const length of [9,10]){let sum=0;for(let i=0;i<length;i++)sum+=Number(value[i])*(length+1-i);const digit=(sum*10)%11;if(Number(value[length])!==(digit===10?0:digit))return false;}return true;
}
export function parseDirectInput(value:unknown):DirectInput{
 const v=object(value);if((v.action==="resume"||v.action==="refresh")&&Object.keys(v).length===1)return {action:v.action};
 const keys=["action","method","name","phone","cpf","fingerprint",...(v.method==="credit_card"?["cardToken","antifraud"]:[])];
 if(v.action!=="create"||Object.keys(v).some(k=>!keys.includes(k))||!directMethods.includes(v.method as DirectMethod)||typeof v.name!=="string"||v.name.trim().length<3||v.name.length>120||/[\x00-\x1f\x7f]/.test(v.name)||typeof v.phone!=="string"||!/^55[1-9]{2}\d{8,9}$/.test(v.phone)||typeof v.cpf!=="string"||!validCpf(v.cpf)||typeof v.fingerprint!=="string"||!/^[a-zA-Z0-9_-]{16,100}$/.test(v.fingerprint))throw Error("invalid_input");
 if(v.method==="credit_card"&&[v.cardToken,v.antifraud].some(x=>typeof x!=="string"||!/^[a-zA-Z0-9_.:-]{16,512}$/.test(x)))throw Error("invalid_input");
 return {action:"create",method:v.method as DirectMethod,name:v.name.trim(),phone:v.phone,cpf:v.cpf,fingerprint:v.fingerprint,...(v.method==="credit_card"?{cardToken:v.cardToken as string,antifraud:v.antifraud as string}:{})};
}
export function directPayload(input:Extract<DirectInput,{action:"create"}>,email:string,offerId:string,reference:string){
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!/^[A-Za-z0-9_-]{1,200}$/.test(offerId)||!/^[a-f0-9]{64}$/.test(reference))throw Error("invalid_input");
 return {paymentMethod:input.method,customer:{name:input.name,email,phone:input.phone,fingerprint:input.fingerprint,docType:"cpf",docNumber:input.cpf},items:[{offerId,quantity:1,offerType:"main"}],metadata:{sck:reference},...(input.method==="credit_card"?{card:{token:input.cardToken},installments:1,antifraud_profiling_attempt_reference:input.antifraud}:{})};
}
export function providerDirectResult(value:unknown,expected:{method:DirectMethod;productId:string;offerId:string}){
 const v=object(value),product=object(v.product),offer=object(v.offer);
 if(typeof v.id!=="string"||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(v.id)||product.id!==expected.productId||offer.id!==expected.offerId||v.paymentMethod!==expected.method||v.amount!=="23.98"||(v.currency!==undefined&&v.currency!=="BRL")||Number(offer.price)!==22.99||!["paid","waiting_payment","processing","authorized","declined","refused"].includes(String(v.status)))throw Error("provider_response_unconfirmed");
 let qrCode:string|null=null,expiresAt:string|null=null;
 if(expected.method!=="credit_card"&&v.status==="waiting_payment"){
  const pix=object(v.pix);if(typeof pix.qrCode!=="string"||pix.qrCode.length<40||pix.qrCode.length>4096||!/^[\x20-\x7e]+$/.test(pix.qrCode)||typeof pix.expirationDate!=="string"||!/(Z|[+-]\d{2}:\d{2})$/.test(pix.expirationDate)||!Number.isFinite(Date.parse(pix.expirationDate.replace(" ","T"))))throw Error("provider_response_unconfirmed");
  qrCode=pix.qrCode;expiresAt=new Date(pix.expirationDate.replace(" ","T")).toISOString();
 }
 const status=v.status==="paid"?"paid":["declined","refused"].includes(String(v.status))?"failed":"awaiting";
 return {orderId:v.id,status,qrCode,expiresAt} as const;
}
