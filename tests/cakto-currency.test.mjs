import test from 'node:test';
import assert from 'node:assert/strict';
import {caktoReader} from '../src/lib/subscriptions/cakto-api.ts';
import {firstPaymentDecision} from '../src/lib/subscriptions/payment-verification.ts';
import {lifecycleDecision} from '../src/lib/subscriptions/lifecycle.ts';
import {automationDiagnostic} from '../src/lib/subscriptions/automation-diagnostics.ts';

const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',sid='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const now=Date.parse('2026-10-20T14:00:00Z');
const expected={orderId:id,productId:'product',offerId:'offer',reference:'a'.repeat(64),createdAt:'2026-10-20T12:00:00Z',expiresAt:'2026-10-20T13:00:00Z',firstPriceCents:1150,monthlyPriceCents:2299,currency:'BRL'};
const order={id,product:{id:'product'},subscription:sid,type:'subscription',offer_type:'main',subscription_period:1,status:'paid',sck:expected.reference,createdAt:'2026-10-20T12:01:00Z',paidAt:'2026-10-20T12:05:00Z',baseAmount:'22.99',discount:'11.49',amount:'12.49',couponCode:'primeiracompra',refundedAt:null,chargedbackAt:null,canceledAt:null};
const subscription={id:sid,product:'product',offer:'offer',parent_order:id,orders:[id],status:'active',canceledAt:null,amount:'22.99',recurrence_period:30,quantity_recurrences:-1,updatedAt:'2026-10-20T12:06:00Z'};
const offer={id:'offer',product:'product',currency:'BRL'};
function reader(o=order,s=subscription,f=offer){
 const paths=[];
 return {paths,api:caktoReader({CAKTO_CLIENT_ID:'fixture',CAKTO_CLIENT_SECRET:'fixture'},async(url,opts)=>{
  paths.push(new URL(url).pathname);assert.equal(opts.cache,'no-store');assert.equal(opts.redirect,'error');
  if(url.endsWith('/token/'))return Response.json({access_token:'fixture',token_type:'Bearer'});
  assert.equal(opts.headers.Authorization,'Bearer fixture');
  if(url.includes('/orders/'))return Response.json(o);
  if(url.includes('/subscriptions/'))return Response.json(s);
  assert.equal(new URL(url).pathname,'/public_api/offers/offer/');
  return f instanceof Response?f:Response.json(f);
 })};
}
test('pedido sem moeda usa oferta autenticada vinculada e preserva validação de valor e vínculo',async()=>{
 const r=reader(),result=await r.api.orderAndSubscription(id);
 assert.equal(result.order.currencySource,'authenticated_offer');
 assert.equal(firstPaymentDecision(result.order,result.subscription,expected,now).verified,true);
 assert.equal(firstPaymentDecision({...result.order,amount:'1.00'},result.subscription,expected,now).verified,false);
 assert.equal(r.paths.length,4);assert.equal(order.currency,undefined);
});
test('renovação sem moeda usa a mesma consulta e continua verificando período e valores',async()=>{
 const o={...order,subscription_period:2,discount:'0.00',amount:'23.98',couponCode:null};
 const {order:found,subscription:sub}=await reader(o).api.orderAndSubscription(id);
 const binding={subscriptionId:sid,originOrderId:id,productId:'product',offerId:'offer',expectedPeriod:2};
 assert.equal(lifecycleDecision(found,sub,binding,now).outcome,'verified');
 assert.equal(lifecycleDecision({...found,amount:'12.49'},sub,binding,now).reason,'amount_or_coupon_mismatch');
});
test('moeda explícita nunca é substituída e reversão não depende de oferta disponível',async()=>{
 for(const patch of [{currency:'BRL'},{currency:'USD'},{currency:null},{currency:'invalid'},{status:'refunded'}]){
  const r=reader({...order,...patch}),result=await r.api.orderAndSubscription(id);
  assert.equal(r.paths.length,3);assert.equal(result.order.currency,patch.currency);
  assert.equal(firstPaymentDecision(result.order,result.subscription,expected,now).verified,patch.currency==='BRL');
 }
});
test('oferta ausente, estrangeira ou inválida não confirma moeda; vínculos incorretos falham',async()=>{
 for(const patch of [{currency:undefined},{currency:null},{currency:'USD'},{currency:'brl'}]){
  const result=await reader(order,subscription,{...offer,...patch}).api.orderAndSubscription(id);
  assert.equal(firstPaymentDecision(result.order,result.subscription,expected,now).reason,'currency_unconfirmed');
 }
 for(const f of [{...offer,id:'foreign'},{...offer,product:'foreign'}])
  await assert.rejects(reader(order,subscription,f).api.orderAndSubscription(id),e=>e.reason==='invalid_response'&&e.operation==='offer');
 await assert.rejects(reader({...order,offer:{id:'foreign'}}).api.orderAndSubscription(id),/invalid_response/);
 const r=reader(order,{...subscription,offer:'../token'});
 await assert.rejects(r.api.orderAndSubscription(id),/invalid_response/);assert.equal(r.paths.length,3);
});
test('403/429/503 na oferta falham sem assumir BRL nem repetir a consulta',async()=>{
 for(const status of [403,429,503]){
  const r=reader(order,subscription,new Response('private',{status}));
  await assert.rejects(r.api.orderAndSubscription(id),e=>{
   assert.deepEqual(automationDiagnostic(e,'jobs'),{phase:'jobs',category:{403:'provider_unauthorized',429:'provider_rate_limited',503:'provider_unavailable'}[status],status});
   return e.operation==='offer'&&e.status===status;
  });
  assert.equal(r.paths.length,4);
 }
});
