import test from 'node:test';
import assert from 'node:assert/strict';
import { caktoReader } from '../src/lib/subscriptions/cakto-api.ts';
import { cents, firstPaymentDecision } from '../src/lib/subscriptions/payment-verification.ts';
const orderId='a'.repeat(8)+'-aaaa-aaaa-aaaa-'+'a'.repeat(12), subId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const expected={orderId,productId:'product',offerId:'offer',reference:'f'.repeat(64),createdAt:'2026-10-06T12:00:00Z',expiresAt:'2026-10-06T13:00:00Z',firstPriceCents:1150,monthlyPriceCents:2299,currency:'BRL'};
const order={id:orderId,product:{id:'product'},subscription:subId,type:'subscription',offer_type:'main',subscription_period:1,status:'paid',currency:'BRL',sck:expected.reference,createdAt:'2026-10-06T12:01:00Z',paidAt:'2026-10-06T12:05:00Z',baseAmount:'22.99',discount:'11.49',amount:'12.49',couponCode:'primeiracompra',refundedAt:null,chargedbackAt:null,canceledAt:null,customer:{email:'private@example.invalid'},secret:'private-secret'};
const subscription={id:subId,product:'product',offer:'offer',parent_order:orderId,orders:[orderId],status:'active',canceledAt:null,amount:'22.99',recurrence_period:30,quantity_recurrences:-1};
const now=Date.parse('2026-10-06T14:00:00Z');
const decision=(o=order,s=subscription,e=expected)=>firstPaymentDecision(o,s,e,now);
test('apenas pagamento consultado, vinculado e integral produz evidência comercial mínima',()=>{
 assert.equal(decision().verified,true);assert.doesNotMatch(JSON.stringify(decision()),/private|customer|secret|reference|@/);
 const regular={...expected,firstPriceCents:2299};
 assert.equal(decision({...order,discount:'0.00',amount:'23.98',couponCode:null},subscription,regular).verified,true);
 for (const status of ['authorized','waiting_payment','partially_paid','refunded','refund_requested','chargedback','unknown']) assert.equal(decision({...order,status}).verified,false);
});
test('divergências, moeda ausente, reversões e datas não são aprovadas',()=>{
 for(const patch of [{id:subId},{product:{id:'foreign'}},{subscription:'other'},{sck:'forged'},{amount:'11.50'},{discount:'11.50'},{currency:undefined},{currency:'USD'},{refundedAt:order.paidAt},{chargedbackAt:order.paidAt},{canceledAt:order.paidAt},{paidAt:'2027-01-01T12:00:00Z'},{createdAt:'2026-10-06T14:00:00Z'},{subscription_period:2},{type:'unique'},{baseAmount:'22.990'},{couponCode:'other'}]) assert.equal(decision({...order,...patch}).verified,false,JSON.stringify(patch));
 for(const patch of [{offer:'other'},{product:'other'},{id:'other'},{id:null},{orders:[]},{parent_order:'other'},{status:'canceled'},{amount:'23.98'},{recurrence_period:365},{quantity_recurrences:1}]) assert.equal(decision(order,{...subscription,...patch}).verified,false);
 assert.equal(decision(order,null).verified,false);
 assert.equal(decision(order,subscription,{...expected,expiresAt:'2026-10-07T13:00:00Z'}).verified,false);
 assert.equal(decision(order,subscription,{...expected,reference:''}).verified,false);
 assert.equal(cents('22.99'),2299);for(const v of [22.99,'-1','1e3','1.999',null])assert.equal(cents(v),null);
});
const env={CAKTO_CLIENT_ID:'private-id',CAKTO_CLIENT_SECRET:'private-secret'};
const json=value=>Response.json(value);
test('consulta usa IDs autoritativos, host fixo, limites e não segue redirecionamentos',async()=>{
 const paths=[];
 const reader=caktoReader(env,async(url,options)=>{
  paths.push(url);assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.ok(options.signal);
  if(url.endsWith('/token/')) {assert.equal(options.method,'POST');return json({access_token:'private-token',token_type:'Bearer'});}
  assert.equal(options.headers.Authorization,'Bearer private-token');assert.equal(options.method,'GET');
  return url.includes('/orders/') ? json(order) : json(subscription);
 });
 const result=await reader.orderAndSubscription(orderId);
 assert.equal(decision(result.order,result.subscription).verified,true);
 assert.deepEqual(paths,['https://api.cakto.com.br/public_api/token/',`https://api.cakto.com.br/public_api/orders/${orderId}/`,`https://api.cakto.com.br/public_api/subscriptions/${subId}/`]);
 await assert.rejects(reader.orderAndSubscription('../token'),/invalid_id/);assert.equal(paths.length,3);
});
test('erros de API não expõem respostas ou credenciais e falham antes de aprovar',async()=>{
 for(const [status,reason] of [[401,'unauthorized'],[403,'unauthorized'],[404,'not_found'],[429,'rate_limited'],[500,'unavailable']]) {
  await assert.rejects(caktoReader(env,async()=>new Response('private-secret',{status})).orderAndSubscription(orderId),error=>error.message===reason);
 }
 await assert.rejects(caktoReader(env,async()=>{throw Error('private-secret');}).orderAndSubscription(orderId),/unavailable/);
 await assert.rejects(caktoReader({},async()=>assert.fail()).orderAndSubscription(orderId),/configuration_missing/);
 for(const response of [()=>json({access_token:'x',token_type:'bad'}),()=>new Response('invalid',{headers:{'content-type':'application/json'}}),()=>new Response('x'.repeat(16385),{headers:{'content-type':'application/json'}})]) await assert.rejects(caktoReader(env,async()=>response()).orderAndSubscription(orderId),/invalid_response/);
 let calls=0;
 const mismatched=caktoReader(env,async()=>++calls===1?json({access_token:'x',token_type:'Bearer'}):json({...order,id:subId}));
 await assert.rejects(mismatched.orderAndSubscription(orderId),/invalid_response/);assert.equal(calls,2);
});
