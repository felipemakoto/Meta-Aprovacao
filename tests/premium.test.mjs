import test from 'node:test';
import assert from 'node:assert/strict';
import { premiumOffer, parseSubscriptionAccess, loadPremium } from '../src/lib/subscriptions/contract.ts';
test('campanha apenas em outubro de 2026 em Sao Paulo, primeira parcela e renovacao distintas',()=>{
 for(const at of ['2026-09-30T23:59:59-03:00','2026-11-01T00:00:00-03:00','2027-10-02T12:00:00-03:00'])assert.deepEqual(premiumOffer(new Date(at)),{promotional:false,firstPrice:20,monthlyPrice:20});
 for(const at of ['2026-10-01T00:00:00-03:00','2026-10-31T23:59:59-03:00'])assert.deepEqual(premiumOffer(new Date(at)),{promotional:true,firstPrice:10,monthlyPrice:20});
 assert.throws(()=>premiumOffer(new Date('invalid')));
});
test('contrato falha fechado, sem status do provedor conceder Premium e sem expor campos privados',()=>{
 assert.deepEqual(parseSubscriptionAccess({hasPremium:false,accessUntil:null,provider_status:'active'}),{hasPremium:false,accessUntil:null});
 assert.deepEqual(parseSubscriptionAccess({hasPremium:true,accessUntil:'2026-11-02T15:00:00Z',order:'secret'}),{hasPremium:true,accessUntil:'2026-11-02T15:00:00Z'});
 for(const v of [null,{},[],{hasPremium:'true',accessUntil:null},{hasPremium:true,accessUntil:null},{hasPremium:true,accessUntil:'infinity'},{hasPremium:false,accessUntil:'2026-11-02T15:00:00Z'}])assert.throws(()=>parseSubscriptionAccess(v));
});
test('sessao ausente nao consulta assinatura; apenas identidade verificada e usada',async()=>{
 assert.deepEqual(await loadPremium({user:async()=>null,read:async()=>assert.fail('unauthenticated read')}),{kind:'login'});
 let received;const state=await loadPremium({user:async()=>'verified-id',read:async id=>{received=id;return {hasPremium:false,accessUntil:null}}});
 assert.equal(received,'verified-id');assert.equal(state.kind,'ready');
});
test('falha de autenticacao, banco e contrato nao vira gratuito nem Premium',async()=>{
 for(const deps of [{user:async()=>{throw Error('secret')},read:async()=>null},{user:async()=>'id',read:async()=>{throw Error('secret')}},{user:async()=>'id',read:async()=>({provider_status:'active'})}])assert.deepEqual(await loadPremium(deps),{kind:'error'});
});
