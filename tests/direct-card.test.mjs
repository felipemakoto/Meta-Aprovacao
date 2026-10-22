import test from 'node:test';
import assert from 'node:assert/strict';
import {validCard,tokenizeCard} from '../src/app/premium/pagamento/card-sdk.ts';
test('cartão valida Luhn, validade e código sem depender da rede',()=>{
 const at=new Date('2026-10-21T15:00:00Z');assert.equal(validCard('4242424242424242','10','26','123',at),true);
 for(const args of [['4242424242424241','10','26','123'],['4242424242424242','09','26','123'],['4242424242424242','13','28','123'],['0000000000000000','10','28','123'],['4242424242424242','10','28','12']])assert.equal(validCard(...args,at),false);
});
test('tokenização segue direto para Cakto, sem cookies, segredo ou dados de cartão no backend',async()=>{
 const original=globalThis.fetch;const card={holderName:'Fixture Test',number:'4242424242424242',expMonth:'12',expYear:'2030',cvv:'123'};
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.cakto.com.br/public_api/card-tokens/');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.headers['X-client-id'],'public-fixture-id');assert.equal(options.headers.Authorization,undefined);assert.deepEqual(JSON.parse(options.body),card);return Response.json({cardToken:'temporary-token-fixture',expiresAt:new Date(Date.now()+600000).toISOString()});};
  assert.equal(await tokenizeCard('public-fixture-id',card),'temporary-token-fixture');
  for(const expiresAt of ['bad',new Date(Date.now()-60000).toISOString()]){globalThis.fetch=async()=>Response.json({cardToken:'fixture',expiresAt});await assert.rejects(tokenizeCard('public-fixture-id',card),/card_unavailable/);}
  globalThis.fetch=async()=>Response.json({detail:'provider-detail'},{status:403});await assert.rejects(tokenizeCard('public-fixture-id',card),/^Error: card_unavailable$/);
 }finally{globalThis.fetch=original;}
});
