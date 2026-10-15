import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import {open,stat} from "node:fs/promises";
import {createReadStream} from "node:fs";
const magic=Buffer.from("MAPBACKUP1");
export async function encryptBackup(input:AsyncIterable<Uint8Array>,file:string,key:Uint8Array){
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce),handle=await open(file,"wx",0o600);
 try{await handle.writeFile(Buffer.concat([magic,nonce]));for await(const chunk of input)await handle.writeFile(cipher.update(chunk));await handle.writeFile(cipher.final());await handle.writeFile(cipher.getAuthTag());}finally{await handle.close();}
}
export async function* decryptBackup(file:string,key:Uint8Array){
 const size=(await stat(file)).size;if(size<magic.length+28)throw Error("invalid_backup");
 const handle=await open(file,"r"),header=Buffer.alloc(magic.length+12),tag=Buffer.alloc(16);
 try{await handle.read(header,0,header.length,0);await handle.read(tag,0,16,size-16);}finally{await handle.close();}
 if(!header.subarray(0,magic.length).equals(magic))throw Error("invalid_backup");
 const cipher=createDecipheriv("aes-256-gcm",key,header.subarray(magic.length));cipher.setAuthTag(tag);
 for await(const chunk of createReadStream(file,{start:header.length,end:size-17}))yield cipher.update(chunk);
 yield cipher.final();
}
export async function verifyBackup(file:string,key:Uint8Array){let bytes=0;let prefix=Buffer.alloc(0);for await(const chunk of decryptBackup(file,key)){if(prefix.length<5)prefix=Buffer.concat([prefix,chunk]).subarray(0,5);bytes+=chunk.length;}if(prefix.toString()!=="PGDMP")throw Error("invalid_dump");return {bytes};}
