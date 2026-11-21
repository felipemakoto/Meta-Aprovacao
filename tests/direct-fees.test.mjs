import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDirectFees} from '../src/lib/subscriptions/direct-fees.ts';
import {caktoDirectApi} from '../src/lib/subscriptions/cakto-direct-api.ts';
const fixture=()=>({paymentMethods:['pix','pix_auto','credit_card'].map(paymentMethod=>({paymentMethod,percentage:4.99,fixed:'2.49',releaseDays:7})),customerFees:[{name:'Taxa de serviço',amount:'0.99',percentage:0,paymentMethod:null,refundable:true}],creditCardInstallments:[{installments:1,interestPercentage:0}]});
test('taxa do comprador é separada do custo do vendedor e total é conferido em centavos',()=>{
 for(const method of ['pix','pix_auto','credit_card'])assert.deepEqual(validateDirectFees(fixture(),method),{baseCents:2299,buyerFeeCents:99,totalCents:2398});
 const fees=fixture();fees.customerFees.push({name:'Outro método',amount:'9.99',percentage:0,paymentMethod:'boleto'});assert.equal(validateDirectFees(fees,'pix').totalCents,2398);
});
test('taxa ausente, alterada, percentual, inválida ou método não configurado bloqueiam antes de cobrar',()=>{
 for(const amount of ['1.99','0.989',null,-1,NaN]){const f=fixture();f.customerFees[0].amount=amount;assert.throws(()=>validateDirectFees(f,'pix'));}
 for(const percentage of [1,null,'0']){const f=fixture();f.customerFees[0].percentage=percentage;assert.throws(()=>validateDirectFees(f,'pix'));}
 const empty=fixture();empty.customerFees=[];assert.throws(()=>validateDirectFees(empty,'pix'),/direct_fees_changed/);
 const missing=fixture();missing.paymentMethods[0].percentage=null;assert.throws(()=>validateDirectFees(missing,'pix'),/direct_method_unavailable/);
 const duplicate=fixture();duplicate.paymentMethods.push(duplicate.paymentMethods[0]);assert.throws(()=>validateDirectFees(duplicate,'pix'));
});
test('juros até em uma parcela impedem cartão pelo valor fixo anunciado, sem bloquear Pix',()=>{
 const fees=fixture();fees.creditCardInstallments[0].interestPercentage=4.99;
 assert.throws(()=>validateDirectFees(fees,'credit_card'),/direct_card_interest_unconfirmed/);
 assert.equal(validateDirectFees(fees,'pix').totalCents,2398);
 for(const interestPercentage of [null,undefined,'0']){const f=fixture();f.creditCardInstallments[0].interestPercentage=interestPercentage;assert.throws(()=>validateDirectFees(f,'credit_card'));}
});
test('validação autenticada lê taxas sem POST e recusa juros antes do processamento financeiro',async()=>{
 const methods=[],paths=[],fees=fixture();fees.creditCardInstallments[0].interestPercentage=4.99;
 const offer={productId:'product',offerId:'offer',url:'https://pay.cakto.com.br/fixture',firstPriceCents:2299,monthlyPriceCents:2299};
 const api=caktoDirectApi({CAKTO_CLIENT_ID:'fixture',CAKTO_CLIENT_SECRET:'fixture'},async(url,options)=>{
  const path=new URL(url).pathname;paths.push(path);methods.push(options.method);
  if(path.endsWith('/token/'))return Response.json({access_token:'fixture',token_type:'Bearer'});
  assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer fixture');
  if(path.endsWith('/offers/offer/'))return Response.json({id:'offer',product:'product',status:'active',currency:'BRL',price:'22.99',type:'subscription',recurrence_period:30,quantity_recurrences:-1});
  if(path.endsWith('/products/product/'))return Response.json({id:'product',paymentMethods:['pix','pix_auto','credit_card']});
  assert.ok(path.endsWith('/fees/'));return Response.json(fees);
 });
 await api.validateOffer(offer,'pix');await assert.rejects(api.validateOffer(offer,'credit_card'),/direct_card_interest_unconfirmed/);
 assert.equal(paths.filter(p=>p.endsWith('/payments/')).length,0);assert.equal(methods.filter(m=>m==='POST').length,2); // OAuth only.
});
