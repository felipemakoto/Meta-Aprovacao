import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileJobs,discoverOrders} from '../src/lib/subscriptions/reconciliation.ts';
import {caktoReader} from '../src/lib/subscriptions/cakto-api.ts';
const orderId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',subId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const job={eventId:1,leaseToken:orderId,attempt:1};
test('fila limitada, resultados contados e recuperação sem vazar exceções',async()=>{
 let leased=0,recovered=0;
 const r=await reconcileJobs({lease:async()=>++leased<4?job:null,process:async()=>{if(leased===1)throw Error('secret-private');return {outcome:'review',reason:'currency_unconfirmed'};},recover:async()=>{recovered++;}},5);
 assert.deepEqual(r,{processed:2,verified:0,review:2,retry:0,failed:1});assert.equal(recovered,1);
 assert.doesNotMatch(JSON.stringify(r),/private/);
 let n=0;await reconcileJobs({lease:async()=>{n++;return job;},process:async()=>({outcome:'retry',reason:'unavailable'}),recover:async()=>{}},2);assert.equal(n,2);
 await assert.rejects(reconcileJobs({},100),/invalid_reconciliation_limit/);
});
test('descoberta não confia na listagem e exige produto, assinatura e referência confirmados',async()=>{
 const order={id:orderId,product:{id:'product'},subscription:subId,sck:'a'.repeat(64),status:'paid',type:'subscription',subscription_period:1};
 const subscription={id:subId,product:'product',offer:'offer',orders:[orderId],parent_order:orderId};let saved;
 const deps={ids:async()=>({orderIds:[orderId],hasMore:true}),provider:async()=>({order,subscription}),enqueue:async input=>{saved=input;return true;},product:'product',offers:['offer']};
 assert.deepEqual(await discoverOrders(deps),{matched:1,ignored:0,hasMore:true});assert.equal(saved.reference,order.sck);assert.equal(saved.subscriptionId,subId);
 for(const change of [{product:{id:'foreign'}},{sck:null},{status:'refunded'},{subscription_period:2}])assert.equal((await discoverOrders({...deps,provider:async()=>({order:{...order,...change},subscription}),enqueue:()=>assert.fail()})).ignored,1);
 assert.equal((await discoverOrders({...deps,provider:async()=>({order,subscription:{...subscription,offer:'foreign'}}),enqueue:()=>assert.fail()})).ignored,1);
});
test('paginação reconstruída, janela e host fixos, listagem privada reduzida a IDs',async()=>{
 const paths=[];const reader=caktoReader({CAKTO_CLIENT_ID:'private',CAKTO_CLIENT_SECRET:'private'},async(url,options)=>{
  assert.equal(options.redirect,'error');paths.push(url);
  return Response.json(url.endsWith('/token/')?{access_token:'private',token_type:'Bearer'}:{results:[{id:orderId,product:{id:'product'},customer:{email:'private@example.invalid'}}],next:'https://foreign.invalid/token'});
 });
 const r=await reader.recentOrderIds('product','2026-10-01T12:00:00Z','2026-10-06T12:00:00Z',2);
 assert.deepEqual(r,{orderIds:[orderId],hasMore:true});assert.equal(paths.length,2);
 const u=new URL(paths[1]);assert.equal(u.hostname,'api.cakto.com.br');assert.equal(u.searchParams.get('page'),'2');assert.equal(u.searchParams.get('limit'),'5');assert.equal(u.searchParams.get('product'),'product');assert.equal(u.searchParams.get('ordering'),'-createdAt');
 assert.doesNotMatch(JSON.stringify(r),/private|customer|@/);
});
