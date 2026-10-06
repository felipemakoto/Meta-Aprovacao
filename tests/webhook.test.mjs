import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { inboxEvents, signatureValid, webhookHandler } from '../src/lib/subscriptions/webhook.ts';
const secret='fixture-secret', timestamp='1791039600', now=Number(timestamp)*1000;
const data={id:'order-1',product:{id:'product'},offer:{id:'offer'},status:'paid',sck:'a'.repeat(64),paidAt:'2026-10-03T12:00:00-03:00',subscription:{id:'sub-1'},customer:{email:'private@example.invalid',docNumber:'private'},card:{lastDigits:'private'}};
const payload={secret,event:'purchase_approved',data};
function request(body=JSON.stringify(payload), overrides={}) {
 const signature='v1='+createHmac('sha256',secret).update(timestamp+'.').update(body).digest('hex');
 return new Request('http://localhost/api/webhooks/cakto',{method:'POST',body,headers:{'content-type':'application/json','x-cakto-timestamp':timestamp,'x-cakto-signature':signature,...overrides}});
}
const config=()=>({secret,product:'product',offers:['offer']});
test('diagnóstico distingue rejeições sem expor valores e não altera respostas',async()=>{
 const logs=[];
 const handler=webhookHandler({config,now:()=>now,save:async()=>{},diagnose:d=>logs.push(d)});
 const missing=request();missing.headers.delete('x-cakto-signature');
 assert.equal((await handler(missing)).status,401);
 assert.equal(logs.at(-1).reason,'missing_signature_headers');
 assert.equal(logs.at(-1).signature.signaturePresent,false);
 await handler(request(undefined,{'x-cakto-signature':'secret-private-malformed'}));
 assert.equal(logs.at(-1).reason,'invalid_signature_format');
 await handler(request(undefined,{'x-cakto-signature':'v1='+'0'.repeat(64)}));
 assert.equal(logs.at(-1).reason,'signature_mismatch');
 const stale=webhookHandler({config,now:()=>now+301000,save:async()=>{},diagnose:d=>logs.push(d)});
 await stale(request());assert.equal(logs.at(-1).reason,'timestamp_outside_tolerance');
 assert.equal(logs.at(-1).signature.clockWithinTolerance,false);
 await handler(request(JSON.stringify({...payload,data:{...data,product:{id:'other'}}})));
 assert.equal(logs.at(-1).reason,'product_or_offer_rejected');
 await handler(request());assert.equal(logs.at(-1).reason,'persisted');
 assert.doesNotMatch(JSON.stringify(logs),/fixture-secret|private|1791039600|order-1|@|v1=|customer|card/);
 const brokenLogger=webhookHandler({config,now:()=>now,save:async()=>{},diagnose:()=>{throw Error(secret);}});
 assert.equal((await brokenLogger(request())).status,200);
});
test('assinatura usa bytes originais e timestamp, sem fallback no corpo',()=>{
 const r=request(),raw=Buffer.from(JSON.stringify(payload));
 assert.equal(signatureValid(raw,r.headers,secret,now),true);
 assert.equal(signatureValid(Buffer.concat([raw,Buffer.from(' ')]),r.headers,secret,now),false);
 for(const time of [now-301000,now+301000,NaN])assert.equal(signatureValid(raw,r.headers,secret,time),false);
 assert.equal(signatureValid(raw,new Headers({'x-cakto-timestamp':timestamp}),secret,now),false);
 assert.equal(signatureValid(raw,r.headers,'wrong',now),false);
 const mixed=new Headers(r.headers);mixed.set('x-cakto-signature','v2=unknown, '+r.headers.get('x-cakto-signature'));
 assert.equal(signatureValid(raw,mixed,secret,now),true);
 assert.equal(signatureValid(raw,r.headers,secret,now+300000),true);
});
test('leitura lenta tem prazo e payload maior que limite é cancelado sem depender do header',async()=>{
 const handler=webhookHandler({config,now:()=>now,save:()=>assert.fail('Não persistir')});
 const slow=new Request('http://localhost/api/webhooks/cakto',{method:'POST',duplex:'half',headers:{'content-type':'application/json'},body:new ReadableStream({start(){}})});
 assert.equal((await handler(slow)).status,408);
 const oversized=new Request('http://localhost/api/webhooks/cakto',{method:'POST',duplex:'half',headers:{'content-type':'application/json'},body:new ReadableStream({start(controller){controller.enqueue(new Uint8Array(256*1024+1));controller.close();}})});
 assert.equal((await handler(oversized)).status,413);
});
test('V1/V2 normalizam somente campos comerciais e descartam segredos e dados pessoais',()=>{
 const records=inboxEvents(payload,'product',['offer']);
 assert.equal(records[0].paidAt,'2026-10-03T15:00:00.000Z');
 assert.equal(records[0].reference,'a'.repeat(64));
 assert.doesNotMatch(JSON.stringify(records),/fixture-secret|private|customer|card/);
 assert.deepEqual(inboxEvents({...payload,data:[data]},'product',['offer']),records);
 for(const bad of [{...payload,event:'checkout_abandonment'},{...payload,data:[]},{...payload,data:Array(26).fill(data)},{...payload,data:{...data,id:null}}])assert.throws(()=>inboxEvents(bad,'product',['offer']));
 assert.throws(()=>inboxEvents(payload,'other',['offer']));
 assert.throws(()=>inboxEvents({...payload,data:[data,{...data,offer:{id:'other'}}]},'product',['offer']));
 assert.equal(inboxEvents({...payload,data:{...data,sck:'forged'}},'product',['offer'])[0].reference,null);
});
test('200 somente após persistir, erro genérico e autenticação antes de persistência',async()=>{
 let saved;const handler=webhookHandler({config,now:()=>now,save:async records=>{saved=records;}});
 assert.equal((await handler(request())).status,200);assert.equal(saved.length,1);
 const noSave=webhookHandler({config,now:()=>now,save:()=>assert.fail('Não persistir')});
 assert.equal((await noSave(request(undefined,{'x-cakto-signature':'wrong'}))).status,401);
 assert.equal((await noSave(request(undefined,{'content-type':'text/plain'}))).status,415);
 assert.equal((await noSave(request('x'.repeat(256*1024+1)))).status,413);
 assert.equal((await noSave(request('invalid-json'))).status,400);
 const failed=await webhookHandler({config,now:()=>now,save:async()=>{throw Error(secret);}})(request());
 assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/fixture-secret/);
 assert.equal((await webhookHandler({config:()=>({...config(),secret:''}),now:()=>now,save:()=>assert.fail()})(request())).status,503);
});
