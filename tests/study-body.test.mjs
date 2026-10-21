import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {createPracticeHandlers} from '../src/lib/quiz/practice-http.ts';
import {simulationHandlers} from '../src/lib/quiz/simulation-http.ts';
import {createClaimHandlers} from '../src/lib/quiz/claim-http.ts';
import {createCorrectionHandlers} from '../src/lib/quiz/correction.ts';
import {checkoutHandler} from '../src/lib/subscriptions/checkout-http.ts';
const origin='https://study.example',settings={secure:true,origin,enabled:true};
const forbidden=async()=>assert.fail('Corpo inválido alcançou dados ou pagamento');
const handlers=[
 [createPracticeHandlers({user:forbidden,topics:forbidden,run:forbidden},settings).POST,2049,413,true],
 [simulationHandlers({user:forbidden,catalog:forbidden,read:forbidden,run:forbidden},settings).POST,16001,413,true],
 [createClaimHandlers({user:forbidden,claim:forbidden,read:forbidden},settings).POST,1,400,false],
 [createCorrectionHandlers({submit:forbidden,read:forbidden},settings).POST,4097,413,true],
 [checkoutHandler({user:forbidden,access:forbidden,offer:forbidden,create:forbidden,now:forbidden},settings),1,400,false],
];
const request=(size,json)=>new NextRequest(origin+'/api/test',{method:'POST',duplex:'half',headers:{origin,cookie:'__Host-guest_quiz='+'a'.repeat(64),...(json?{'content-type':'application/json'}:{})},
 body:new ReadableStream({start(c){if(size)c.enqueue(new Uint8Array(size));},cancel(){return new Promise(()=>{});}})});
async function bounded(promise,ms){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Resposta presa no cancelamento')),ms);})]);}finally{clearTimeout(timer);}}
test('limites de estudo e checkout respondem sem aguardar cancelamento pendente',async()=>{
 for(const [handle,size,status,json] of handlers){const r=await bounded(handle(request(size,json)),1000);assert.equal(r.status,status);assert.match(r.headers.get('cache-control'),/private.*no-store/);}
});
test('corpos sem EOF encerram nos prazos existentes mesmo se cancelamento não resolver',{timeout:13000},async()=>{
 const responses=await Promise.all(handlers.map(([handle,,,json])=>bounded(handle(request(0,json)),12000)));
 for(let i=0;i<responses.length;i++)assert.equal(responses[i].status,i===4?400:408);
});
