import test from 'node:test';
import assert from 'node:assert/strict';
import {caktoReader} from '../src/lib/subscriptions/cakto-api.ts';

const env={CAKTO_CLIENT_ID:'private-id',CAKTO_CLIENT_SECRET:'private-secret'};
const list=reader=>reader.recentOrderIds('product','2026-10-01','2026-10-15');
const token=()=>Response.json({access_token:'private-token',token_type:'Bearer'});

test('autenticação repete uma vez os HTTP transitórios e mantém host, formulário e sinal',async()=>{
 for(const status of [500,502,503,504]) {
  let calls=0;const events=[];let signal;
  const reader=caktoReader(env,async(url,options)=>{
   calls++;
   assert.equal(new URL(url).origin,'https://api.cakto.com.br');
   assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
   if(url.endsWith('/token/')) {
    assert.equal(options.method,'POST');assert.equal(options.body.get('client_id'),env.CAKTO_CLIENT_ID);
    assert.equal(options.body.get('client_secret'),env.CAKTO_CLIENT_SECRET);
    if(calls===1) {signal=options.signal;return new Response('private-error',{status});}
    assert.equal(options.signal,signal);return token();
   }
   assert.equal(options.headers.Authorization,'Bearer private-token');return Response.json({results:[],next:null});
  },event=>events.push(event));
  assert.deepEqual(await list(reader),{orderIds:[],hasMore:false});assert.equal(calls,3);
  assert.deepEqual(events,[{operation:'authentication',status}]);
  assert.doesNotMatch(JSON.stringify(events),/private|secret|token|https|@/);
 }
});

test('falha na segunda autenticação mantém diagnóstico final e encerra sem consultar pedidos',async()=>{
 let calls=0;const events=[];
 const reader=caktoReader(env,async()=>new Response('private-error',{status:++calls===1?502:503}),event=>events.push(event));
 await assert.rejects(list(reader),error=>error.reason==='unavailable'&&error.operation==='authentication'&&error.status===503&&!error.timedOut);
 assert.equal(calls,2);assert.deepEqual(events,[{operation:'authentication',status:502}]);
});

test('credenciais recusadas, limite, outros HTTP, JSON inválido e exceções não são repetidos',async()=>{
 for(const response of [()=>new Response('',{status:401}),()=>new Response('',{status:403}),()=>new Response('',{status:404}),()=>new Response('',{status:429}),()=>new Response('',{status:501}),()=>Response.json({access_token:'x',token_type:'invalid'}),()=>new Response('{',{headers:{'content-type':'application/json'}}),()=>{throw Error('private-error');}]) {
  let calls=0;
  await assert.rejects(list(caktoReader(env,async()=>{calls++;return response();},()=>assert.fail('não deve repetir'))));
  assert.equal(calls,1);
 }
});

test('HTTP 502 em consulta de lista, pedido ou assinatura não é repetido',async()=>{
 const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',sub='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
 for(const operation of ['orders_list','order','subscription']) {
  let calls=0;
  const reader=caktoReader(env,async url=>{
   calls++;
   if(url.endsWith('/token/'))return token();
   if(operation==='subscription'&&url.includes('/orders/'))return Response.json({id,subscription:sub});
   return new Response('private-error',{status:502});
  },()=>assert.fail('não deve repetir'));
  await assert.rejects(operation==='orders_list'?list(reader):reader.orderAndSubscription(id),error=>error.operation===operation&&error.status===502);
  assert.equal(calls,operation==='subscription'?3:2);
 }
});

test('falha do observador não impede a segunda tentativa autorizada',async()=>{
 let calls=0;
 const reader=caktoReader(env,async url=>++calls===1?new Response('',{status:502}):url.endsWith('/token/')?token():Response.json({results:[],next:null}),()=>{throw Error('logger');});
 assert.deepEqual(await list(reader),{orderIds:[],hasMore:false});assert.equal(calls,3);
});

test('segunda tentativa compartilha prazo total de oito segundos, mesmo ignorando abort',async()=>{
 let calls=0;const events=[];let signal;const started=performance.now();
 const reader=caktoReader(env,async(_url,options)=>{
  calls++;signal=options.signal;
  if(calls===1) {await new Promise(resolve=>setTimeout(resolve,700));return new Response('',{status:502});}
  return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{'));}}),{headers:{'content-type':'application/json'}});
 },event=>events.push(event));
 await assert.rejects(list(reader),error=>error.timedOut&&error.operation==='authentication'&&error.status===200);
 const elapsed=performance.now()-started;
 assert.ok(elapsed>=7900&&elapsed<8500,`prazo compartilhado: ${elapsed}ms`);
 assert.equal(signal.aborted,true);assert.equal(calls,2);assert.equal(events.length,1);
});

test('resposta transitória após esgotar o prazo não inicia nova requisição',async()=>{
 let calls=0;let finish;const events=[];
 const reader=caktoReader(env,async()=>{calls++;return await new Promise(resolve=>{finish=()=>resolve(new Response('',{status:502}));});},event=>events.push(event));
 await assert.rejects(list(reader),error=>error.timedOut&&error.operation==='authentication');
 finish();await new Promise(resolve=>setTimeout(resolve,300));assert.equal(calls,1);assert.deepEqual(events,[]);
});
