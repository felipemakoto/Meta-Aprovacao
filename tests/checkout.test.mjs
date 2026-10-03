import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutUrl, configuredCheckout, checkoutDestination } from '../src/lib/subscriptions/checkout-contract.ts';
import { checkoutHandler } from '../src/lib/subscriptions/checkout-http.ts';
const now = new Date('2026-10-03T12:00:00-03:00');
const env = { CAKTO_PRODUCT_ID:'product', CAKTO_OCTOBER_OFFER_ID:'monthly', CAKTO_REGULAR_OFFER_ID:'regular',
 CAKTO_OCTOBER_CHECKOUT_URL:'https://pay.cakto.com.br/fixture?coupon=OUTUBRO', CAKTO_REGULAR_CHECKOUT_URL:'https://pay.cakto.com.br/regular' };
const offer = configuredCheckout(env, now);
const intent = { provider:'cakto', reference:'a'.repeat(64), expiresAt:'2026-10-03T16:00:00Z', checkoutUrl:offer.url,
 productId:offer.productId, offerId:offer.offerId, firstPriceCents:1000, monthlyPriceCents:2000 };
const request = (opts={}) => new Request('http://localhost:3000/api/premium/checkout'+(opts.query??''),{
 method:'POST', headers:{origin:'http://localhost:3000', ...opts.headers}, ...(opts.body ? {body:opts.body}:{}),
});
const deps = { user:async()=>'verified-user', access:async()=>({hasPremium:false,accessUntil:null}), offer:()=>offer,
 create:async(user, o)=>{assert.equal(user,'verified-user');assert.deepEqual(o,offer);return intent;}, now:()=>now };
const handler = (overrides={}, settings={})=>checkoutHandler({...deps,...overrides},{secure:false,enabled:true,...settings});
test('URL permite apenas HTTPS Cakto e cupom; rejeita dados pessoais e redirects',()=>{
 assert.equal(checkoutUrl(offer.url).hostname,'pay.cakto.com.br');
 assert.equal(checkoutUrl('https://pay.cakto.com.br/8wweqjo_1168765?coupon=primeiracompra').pathname,'/8wweqjo_1168765');
 for(const path of ['/a/b','/a%2Fb','/a%3Fb','/a.'])assert.throws(()=>checkoutUrl('https://pay.cakto.com.br'+path));
 for(const url of ['http://pay.cakto.com.br/a','https://pay.cakto.com.br.evil.com/a','https://user:pw@pay.cakto.com.br/a','https://pay.cakto.com.br:444/a','https://pay.cakto.com.br/a#x','https://pay.cakto.com.br/a?email=x','https://pay.cakto.com.br/a?sck=x','https://pay.cakto.com.br/a?coupon=x&coupon=y','https://pay.cakto.com.br/a?redirect=https://evil.com'])assert.throws(()=>checkoutUrl(url));
});
test('campanha seleciona oferta servidor, sem fallback de outubro para preço errado',()=>{
 assert.equal(offer.firstPriceCents,1000);
 assert.equal(configuredCheckout(env,new Date('2026-11-01T03:00:00Z')).firstPriceCents,2000);
 assert.throws(()=>configuredCheckout({...env,CAKTO_OCTOBER_CHECKOUT_URL:undefined},now));
 assert.throws(()=>configuredCheckout({...env,CAKTO_PRODUCT_ID:'user@email'},now));
 assert.throws(()=>configuredCheckout({KIWIFY_PRODUCT_ID:'old',KIWIFY_OCTOBER_PLAN_ID:'old',KIWIFY_OCTOBER_CHECKOUT_URL:'https://pay.kiwify.com.br/old'},now));
 assert.throws(()=>checkoutUrl('https://pay.kiwify.com.br/old'));
});
test('destino inclui só cupom e referência opaca persistida, contrato exige oferta e prazo',()=>{
 const url=new URL(checkoutDestination(intent,offer,now));assert.equal(url.searchParams.get('sck'),intent.reference);
 assert.deepEqual([...url.searchParams.keys()],['coupon','sck']);assert.ok(!url.href.includes('verified-user'));
 for(const patch of [{provider:'kiwify'},{provider:undefined},{reference:'uuid'},{expiresAt:now.toISOString()},{expiresAt:'infinity'},{checkoutUrl:'https://evil.example'},{offerId:'wrong'},{productId:'wrong'},{firstPriceCents:2000},{monthlyPriceCents:1000}])assert.throws(()=>checkoutDestination({...intent,...patch},offer,now));
});
test('CSRF, payload e parâmetros do cliente rejeitados antes de criar intenção',async()=>{
 const h=handler({create:async()=>assert.fail('must not persist')});
 for(const req of [request({headers:{origin:'https://evil.example'}}),request({headers:{'sec-fetch-site':'cross-site'}})])assert.equal((await h(req)).status,403);
 for(const req of [request({query:'?url=https://evil.example'}),request({body:'{}'}),request({headers:{'content-type':'application/json'}})])assert.equal((await h(req)).status,400);
 assert.equal((await handler({}, {secure:true})(request())).status,403);
});
test('sem sessão, Premium ativo e trava de lançamento não criam intenção',async()=>{
 const create=async()=>assert.fail('must not persist');
 assert.equal((await handler({user:async()=>null,create})(request())).status,401);
 assert.equal((await handler({access:async()=>({hasPremium:true,accessUntil:'2026-11-03T00:00:00Z'}),create})(request())).status,409);
 assert.equal((await handler({create},{enabled:false})(request())).status,503);
});
test('somente depois de persistir redireciona; falhas não expõem dados nem concedem acesso',async()=>{
 const r=await handler()(request());assert.equal(r.status,303);assert.match(r.headers.get('location'),/sck=a{64}/);
 assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');
 for(const patch of [{create:async()=>{throw Error('secret')}},{access:async()=>({provider_status:'active'})},{create:async()=>({...intent,expiresAt:'invalid'})}]){
  const fail=await handler(patch)(request());assert.equal(fail.status,503);assert.equal(await fail.text(),'{"error":"checkout_unavailable"}');
 }
 assert.equal((await handler({create:async()=>{throw Error('checkout_rate_limited')}})(request())).status,429);
});
