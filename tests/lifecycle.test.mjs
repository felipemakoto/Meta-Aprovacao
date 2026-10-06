import test from 'node:test';
import assert from 'node:assert/strict';
import {lifecycleDecision,lifecycleProcessor} from '../src/lib/subscriptions/lifecycle.ts';
import {CaktoReadError} from '../src/lib/subscriptions/cakto-api.ts';
const origin='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',subscription='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const now=Date.parse('2026-10-06T18:00:00Z');
const binding={originOrderId:origin,subscriptionId:subscription,productId:'product',offerId:'offer'};
const order={id:origin,subscription,product:{id:'product'},type:'subscription',offer_type:'main',status:'paid',paidAt:'2026-10-01T12:00:00Z',subscription_period:1,refundedAt:null,chargedbackAt:null,customer:{email:'private@example.invalid'}};
const sub={id:subscription,parent_order:origin,orders:[origin],product:'product',offer:'offer',status:'active',updatedAt:'2026-10-06T12:00:00Z',canceledAt:null,amount:'22.99'};
test('cancelamento, pausa, atraso e reativação preservam sem criar período ou restaurar acesso',()=>{
 for(const status of ['active','inactive','canceled','expired','paused','late','trial']) {
  const r=lifecycleDecision(order,{...sub,status,canceledAt:status==='canceled'?'2026-10-06T11:00:00Z':null},binding,now);
  assert.equal(r.outcome,'verified');assert.equal(r.snapshot.action,'preserve');assert.equal(r.snapshot.providerStatus,status);
  assert.doesNotMatch(JSON.stringify(r),/next_payment|accessUntil|private|customer/);
 }
});
test('reversão exige status e data autoritativos; solicitação e aviso não revogam',()=>{
 for(const [status,key] of [['refunded','refundedAt'],['chargedback','chargedbackAt']]) {
  assert.equal(lifecycleDecision({...order,status,[key]:'2026-10-05T12:00:00Z'},sub,binding,now).snapshot.action,'revoke');
  assert.equal(lifecycleDecision({...order,status},sub,binding,now).reason,'reversal_unconfirmed');
  assert.equal(lifecycleDecision({...order,status,[key]:'2026-10-07T12:00:00Z'},sub,binding,now).reason,'reversal_unconfirmed');
 }
 for(const status of ['refund_requested','prechargeback','in_settlement','refused','partially_paid'])assert.equal(lifecycleDecision({...order,status},sub,binding,now).snapshot.action,'preserve');
});
test('renovação exige moeda e preço, mas vencimento estimado não estende período',()=>{
 const renewal={...order,subscription_period:2,currency:'BRL',baseAmount:'22.99',discount:'0.00',amount:'23.98',couponCode:null};
 assert.equal(lifecycleDecision(renewal,{...sub,next_payment_date:'2026-11-05T12:00:00Z'},binding,now).reason,'paid_period_unconfirmed');
 assert.equal(lifecycleDecision({...renewal,currency:undefined},sub,binding,now).reason,'currency_unconfirmed');
 assert.equal(lifecycleDecision({...renewal,amount:'12.49'},sub,binding,now).reason,'amount_or_coupon_mismatch');
 for(const change of [{product:'foreign'},{parent_order:'cccccccc-cccc-cccc-cccc-cccccccccccc'},{orders:[]},{offer:'foreign'}])assert.equal(lifecycleDecision(order,{...sub,...change},binding,now).outcome,'review');
 assert.equal(lifecycleDecision(order,{...sub,updatedAt:'2026-10-07T12:00:00Z'},binding,now).outcome,'review');
});
test('processador vincula pela primeira prova e API, grava antes de concluir e sanitiza falhas',async()=>{
 let saved;const deps={signal:async()=>({orderId:origin,productId:'product',offerId:'offer',event:'subscription_canceled'}),provider:async()=>({order,subscription:sub}),binding:async(id,subId,originId)=>{assert.equal(subId,subscription);assert.equal(originId,origin);return binding;},save:async(id,r)=>{saved=r;},product:'product',offers:['offer'],now:()=>now};
 assert.equal((await lifecycleProcessor(deps)(1)).outcome,'verified');assert.equal(saved.snapshot.action,'preserve');
 assert.equal((await lifecycleProcessor({...deps,binding:async()=>null})(1)).reason,'subscription_binding_missing');
 assert.equal((await lifecycleProcessor({...deps,provider:async()=>{throw new CaktoReadError('unavailable');}})(1)).outcome,'retry');
 await assert.rejects(lifecycleProcessor({...deps,save:async()=>{throw Error('storage unavailable');}})(1));
});
