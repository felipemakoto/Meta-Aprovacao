import type {StudyCommand} from "./contract.ts";
type Document=Extract<StudyCommand,{action:"register_document"}>["document"];
export async function registerStudyDocument(document:Document,deps:{reserve:()=>Promise<string>;verify:(document:Document)=>Promise<void>;save:(document:Document)=>Promise<unknown>;release:(lease:string)=>Promise<void>}){
 const lease=await deps.reserve();
 try{await deps.verify(document);return await deps.save(document);}
 finally{try{await deps.release(lease);}catch{/* Expiring lease still bounds concurrency if cleanup is unavailable. */}}
}
