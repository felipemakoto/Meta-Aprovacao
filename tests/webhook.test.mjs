import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { inboxEvents, secretDiagnostic, webhookHandler } from '../src/lib/subscriptions/webhook.ts';
const secret='fixture-secret';
const data={id:'order-1',product:{id:'product'},offer:{id:'offer'},status:'paid',sck:'a'.repeat(64),paidAt:'2026-10-03T12:00:00-03:00',subscription:{id:'sub-1'},customer:{email:'private@example.invalid',docNumber:'private'},card:{lastDigits:'private'}};
const payload={secret,event:'purchase_approved',data};
function request(body=JSON.stringify(payload), overrides={}) {
 return new Request('http://localhost/api/webhooks/cakto',{method:'POST',body,headers:{'content-type':'application/json',...overrides}});
}
const config=()=>({secret,product:'product',offers:['offer']});

test('JSON com secret correto autentica sem cabeçalhos inventados; e-mail não é usado para vínculo',async()=>{
 let saved;const logs=[];
 const handler=webhookHandler({config,save:async records=>{saved=records;},diagnose:d=>logs.push(d)});
 const response=await handler(request());
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{received:true});
 assert.equal(saved.length,1);assert.equal(saved[0].reference,'a'.repeat(64));
 assert.equal(logs.at(-1).reason,'persisted');assert.equal(logs.at(-1).authentication.valid,true);
 assert.match(response.headers.get('cache-control'),/no-store/);
 assert.doesNotMatch(JSON.stringify(saved),/fixture-secret|private|customer|card/);
});

test('secret ausente, incorreto ou malformado nunca persiste; headers não substituem o secret',async()=>{
 const logs=[],handler=webhookHandler({config,save:()=>assert.fail('Não persistir'),diagnose:d=>logs.push(d)});
 const withoutSecret={event:payload.event,data};
 for(const value of [null,[],{},withoutSecret,{...payload,secret:null},{...payload,secret:42},{...payload,secret:[]},{...payload,secret:{}},{...payload,secret:''},{...payload,secret:'x'.repeat(4097)},{...payload,secret:'wrong'},{...payload,secret:secret+' '}]){
  const response=await handler(request(JSON.stringify(value)));assert.equal(response.status,401);
  assert.deepEqual(await response.json(),{received:false});
 }
 const body=JSON.stringify({...payload,secret:'wrong'}),timestamp='1791039600';
 const signature='v1='+createHmac('sha256',secret).update(timestamp+'.').update(body).digest('hex');
 assert.equal((await handler(request(body,{'x-cakto-timestamp':timestamp,'x-cakto-signature':signature}))).status,401);
 assert.equal(logs.at(-1).reason,'secret_mismatch');
 assert.doesNotMatch(JSON.stringify(logs),/fixture-secret|private|1791039600|order-1|@|v1=|customer|card/);
});

test('comparação exata do secret aceita Unicode sem normalizar, cortar ou alterar caixa',()=>{
 for(const [received,expected,valid] of [['á-private','á-private',true],['á-private','a-private',false],['Secret','secret',false],['secret ','secret',false],['secret','',false]])assert.equal(secretDiagnostic({secret:received},expected).valid,valid);
 assert.equal(secretDiagnostic({},secret).reason,'missing_secret');
 assert.equal(secretDiagnostic({secret:[]},secret).reason,'invalid_secret_format');
});

test('headers extras ou timestamp antigo não interferem no contrato confirmado pelo suporte',async()=>{
 let count=0;const handler=webhookHandler({config,save:async()=>{count++;}});
 assert.equal((await handler(request(undefined,{'x-cakto-timestamp':'1','x-cakto-signature':'not-a-signature'}))).status,200);
 assert.equal(count,1);
});

test('teste fictício autenticado recebe 200 e não grava produto/oferta fora da lista permitida',async()=>{
 const logs=[],handler=webhookHandler({config,save:()=>assert.fail('Fixture não concede acesso nem entra na fila'),diagnose:d=>logs.push(d)});
 const fixture={...payload,data:{...data,product:{id:'fixture-product',name:'Produto Teste'},offer:{id:'fixture-offer'},customer:{name:'John Doe',email:'john.doe@example.com'}}};
 assert.equal((await handler(request(JSON.stringify(fixture)))).status,200);
 assert.equal(logs.at(-1).reason,'product_or_offer_ignored');
 assert.equal(logs.at(-1).authentication.valid,true);
 assert.equal((await handler(request(JSON.stringify({...payload,data:{...data,offer:{id:'foreign'}}})))).status,200);
 assert.doesNotMatch(JSON.stringify(logs),/john|Produto|fixture-secret|fixture-product|fixture-offer/);
});

test('eventos não utilizados e payloads autenticados inválidos são reconhecidos sem efeitos',async()=>{
 const logs=[],handler=webhookHandler({config,save:()=>assert.fail('Não persistir'),diagnose:d=>logs.push(d)});
 assert.equal((await handler(request(JSON.stringify({...payload,event:'pix_gerado'})))).status,200);
 assert.equal(logs.at(-1).reason,'event_ignored');
 for(const bad of [{...payload,data:[]},{...payload,data:Array(26).fill(data)},{...payload,data:{...data,id:null}},{secret}]){
  assert.equal((await handler(request(JSON.stringify(bad)))).status,200);
  assert.ok(['payload_ignored','event_ignored'].includes(logs.at(-1).reason));
 }
});

test('lote V2 inválido ou de oferta estrangeira não salva parcialmente',async()=>{
 const handler=webhookHandler({config,save:()=>assert.fail('Não salvar parte de lote inválido')});
 for(const second of [{...data,product:{id:'foreign'}},{...data,id:null}])assert.equal((await handler(request(JSON.stringify({...payload,data:[data,second]})))).status,200);
});

test('diagnóstico não expõe valores e falha de logger não muda a entrega',async()=>{
 const logs=[],handler=webhookHandler({config,save:async()=>{},diagnose:d=>logs.push(d)});
 for(const input of [{...payload,secret:'private'},payload])await handler(request(JSON.stringify(input)));
 assert.doesNotMatch(JSON.stringify(logs),/fixture-secret|private|order-1|@|customer|card/);
 const brokenLogger=webhookHandler({config,save:async()=>{},diagnose:()=>{throw Error(secret);}});
 assert.equal((await brokenLogger(request())).status,200);
});

test('leitura lenta tem prazo e payload grande é cancelado sem depender do header',async()=>{
 const handler=webhookHandler({config,save:()=>assert.fail('Não persistir')});
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

test('2xx de evento elegível só é enviado após concluir a persistência',async()=>{
 let finish;const gate=new Promise(resolve=>{finish=resolve;});let completed=false;
 const handler=webhookHandler({config,save:async()=>{await gate;}});
 const pending=handler(request()).then(response=>{completed=true;return response;});
 await new Promise(resolve=>setTimeout(resolve,20));assert.equal(completed,false);
 finish();assert.equal((await pending).status,200);
});

test('falha de armazenamento ou configuração não confirma um evento perdido',async()=>{
 const response=await webhookHandler({config,save:async()=>{throw Error(secret);}})(request());
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{received:false});
 for(const settings of [{...config(),secret:''},{...config(),product:''},{...config(),offers:[]},{...config(),offers:['']}]){
  assert.equal((await webhookHandler({config:()=>settings,save:()=>assert.fail()})(request())).status,503);
 }
});

test('JSON/UTF-8 inválido, tipo, codificação, query e tamanho inadequados não são processados',async()=>{
 const handler=webhookHandler({config,save:()=>assert.fail('Não persistir')});
 assert.equal((await handler(request('invalid-json'))).status,400);
 assert.equal((await handler(request(new Uint8Array([0xc3,0x28])))).status,400);
 assert.equal((await handler(request(undefined,{'content-type':'text/plain'}))).status,415);
 assert.equal((await handler(request(undefined,{'content-encoding':'gzip'}))).status,415);
 assert.equal((await handler(request(undefined,{'content-length':'262145'}))).status,413);
 assert.equal((await handler(new Request('http://localhost/api/webhooks/cakto?secret=forged',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)}))).status,400);
});
