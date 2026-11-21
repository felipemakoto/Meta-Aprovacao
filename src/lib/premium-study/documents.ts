const documentHosts=["fatweb.s3.amazonaws.com","assets.fatvestibulares.com.br","concurso30.fundacaocefetminas.org.br"];
export function officialUrl(value:string,pdf=false){
 const u=new URL(value);
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||value.length>1500||
 !(documentHosts.includes(u.hostname)||u.hostname==="ifsp.edu.br"||u.hostname.endsWith(".ifsp.edu.br")||(!pdf&&u.hostname==="vestibulinho.etec.sp.gov.br")))throw Error("invalid_document");
 if(u.hostname==="fatweb.s3.amazonaws.com"&&!u.pathname.startsWith("/vestibulinhoetec/"))throw Error("invalid_document");
 if(u.hostname==="concurso30.fundacaocefetminas.org.br"&&!u.pathname.startsWith("/documentos/"))throw Error("invalid_document");
 return u;
}
async function limitedResponse(url:URL,limit:number,transport:typeof fetch){
 const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 try{return await Promise.race([(async()=>{
  const r=await transport(url.href,{redirect:"error",cache:"no-store",signal:controller.signal,headers:{Range:`bytes=0-${limit-1}`}});
  if(![200,206].includes(r.status)||!r.body)throw Error("source_unavailable");reader=r.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  while(size<limit){const {done,value}=await reader.read();if(done)break;const part=value.slice(0,limit-size);chunks.push(part);size+=part.byteLength;}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return {bytes,type:r.headers.get("content-type")??""};
 })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error("source_unavailable"));},10000);})]);}
 finally{clearTimeout(timer);controller.abort();void reader?.cancel().catch(()=>{});}
}
export async function verifyOfficialDocument(d:{examUrl:string;answerUrl:string;sourceUrl:string},transport:typeof fetch=fetch){
 const source=officialUrl(d.sourceUrl),exam=officialUrl(d.examUrl,true),answer=officialUrl(d.answerUrl,true);
 if(exam.href===answer.href)throw Error("invalid_document");
 const page=await limitedResponse(source,512000,transport);
 if(!page.type.includes("text/html"))throw Error("source_unavailable");
 const html=new TextDecoder().decode(page.bytes),links=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].flatMap(m=>{try{return [new URL(m[1].replaceAll("&amp;","&"),source).href];}catch{return [];}});
 if(!links.includes(exam.href)||!links.includes(answer.href))throw Error("source_links_missing");
 for(const url of [exam,answer]){const r=await limitedResponse(url,1024,transport);if(!r.type.toLowerCase().includes("application/pdf")||new TextDecoder().decode(r.bytes.slice(0,5))!=="%PDF-")throw Error("invalid_document");}
}
