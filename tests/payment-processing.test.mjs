import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentProcessor } from '../src/lib/subscriptions/payment-processing.ts';
import { CaktoReadError } from '../src/lib/subscriptions/cakto-api.ts';
const orderId='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',subId='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',reference='a'.repeat(64);
const expected={orderId,productId:'product',offerId:'offer',reference,createdAt:'2026-10-06T12:00:00Z',expiresAt:'2026-10-06T13:00:00Z',firstPriceCents:1150,monthlyPriceCents:2299,currency:'BRL'};
const signal={orderId,productId:'product',offerId:'offer',event:'purchase_approved',reference:'forged-webhook-reference'};
const order={id:orderId,product:{id:'product'},subscription:subId,sck:reference,type:'subscription',offer_type:'main',subscription_period:1,status:'paid',createdAt:'2026-10-06T12:01:00Z',paidAt:'2026-10-06T12:05:00Z',refundedAt:null,chargedbackAt:null,canceledAt:null,currency:'BRL',baseAmount:'22.99',discount:'11.49',amount:'12.49',couponCode:'primeiracompra'};
const subscription={id:subId,product:'product',offer:'offer',orders:[orderId],parent_order:orderId,status:'active',canceledAt:null,recurrence_period:30,quantity_recurrences:-1,amount:'22.99'};
function setup(overrides={}) {
 const saved=[];const calls=[];
 const deps={signal:async()=>signal,provider:async id=>{calls.push(id);return {order,subscription};},intent:async(id,ref)=>{assert.equal(id,1);assert.equal(ref,reference);return expected;},save:async(id,r)=>saved.push([id,r]),product:'product',offers:['offer'],now:()=>Date.parse('2026-10-06T14:00:00Z'),...overrides};
 return {run:paymentProcessor(deps),saved,calls};
}
test('resolve intenção pela referência da API, persiste antes de confirmar e nunca concede acesso',async()=>{
 const {run,saved,calls}=setup();const result=await run(1);
 assert.equal(result.outcome,'verified');assert.equal(saved.length,1);assert.equal(saved[0][1],result);assert.deepEqual(calls,[orderId]);
 const failed=setup({save:async()=>{throw Error('storage unavailable');}});
 await assert.rejects(failed.run(1),/storage unavailable/);
});
test('evento, configuração, sinal e IDs inválidos não consultam pagamentos arbitrários',async()=>{
 const foreign=setup({signal:async()=>({...signal,productId:'foreign'})});
 assert.equal((await foreign.run(1)).reason,'signal_not_allowed');assert.equal(foreign.calls.length,0);
 const renewal=setup({signal:async()=>({...signal,event:'subscription_renewed'})});
 assert.equal((await renewal.run(1)).reason,'event_requires_lifecycle_processing');assert.equal(renewal.calls.length,0);
 const invalid=setup({signal:async()=>({...signal,orderId:'../token'})});assert.equal((await invalid.run(1)).reason,'invalid_id');assert.equal(invalid.calls.length,0);
 await assert.rejects(setup().run(0),/invalid_event_id/);
 await assert.rejects(setup({signal:async()=>null}).run(1),/signal_not_found/);
});
test('falhas recuperáveis, pedido inexistente e falta de vínculo têm destinos explícitos',async()=>{
 for(const reason of ['unavailable','rate_limited','unauthorized','configuration_missing']) assert.equal((await setup({provider:async()=>{throw new CaktoReadError(reason);}}).run(1)).outcome,'retry');
 assert.equal((await setup({provider:async()=>{throw new CaktoReadError('not_found');}}).run(1)).outcome,'review');
 assert.equal((await setup({intent:async()=>null}).run(1)).reason,'intent_not_found');
 assert.equal((await setup({provider:async()=>({order:{...order,sck:null},subscription}),intent:()=>assert.fail()}).run(1)).reason,'reference_missing');
 assert.equal((await setup({provider:async()=>({order:{...order,currency:undefined},subscription})}).run(1)).reason,'currency_unconfirmed');
});
