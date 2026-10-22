import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {validCpf,parseDirectInput,directPayload,providerDirectResult} from '../src/lib/subscriptions/direct-contract.ts';
import {sealPayment,openPayment} from '../src/lib/subscriptions/direct-crypto.ts';
import {directHandlers} from '../src/lib/subscriptions/direct-http.ts';
import {directService} from '../src/lib/subscriptions/direct-service.ts';
import {caktoDirectApi} from '../src/lib/subscriptions/cakto-direct-api.ts';
const command={action:'create',method:'pix',name:'Pessoa de Teste',phone:'5511999999999',cpf:'52998224725',fingerprint:'isolated-fixture-123456'};
const secret='isolated-test-secret-not-production',reference='a'.repeat(64),order=randomUUID();
const offer={offerId:'offer',productId:'product',url:'https://pay.cakto.com.br/fixture',firstPriceCents:2299,monthlyPriceCents:2299};
const now=Date.parse('2026-10-21T19:00:00Z');
const response={id:order,status:'waiting_payment',paymentMethod:'pix',amount:'23.98',product:{id:'product'},offer:{id:'offer',price:'22.99'},pix:{qrCode:'000201'+ '1'.repeat(80),expirationDate:'2026-10-21T20:00:00Z'}};
test('entrada mínima validada; preço, identidade, PAN e destinos do cliente são recusados',()=>{
 assert.ok(validCpf(command.cpf));assert.deepEqual(parseDirectInput(command),command);
 for(const extra of [{email:'other@example.invalid'},{userId:'other'},{amount:1},{coupon:'x'},{card:{number:'x'}},{number:'x'},{redirect:'https://example.invalid'}])assert.throws(()=>parseDirectInput({...command,...extra}));
 for(const cpf of ['11111111111','52998224724','',null])assert.throws(()=>parseDirectInput({...command,cpf}));
 assert.deepEqual(parseDirectInput({action:'refresh'}),{action:'refresh'});assert.throws(()=>parseDirectInput({action:'resume',id:order}));
 const p=directPayload(command,'verified@example.invalid','offer',reference);assert.equal(p.customer.email,'verified@example.invalid');assert.equal(p.metadata.sck,reference);assert.equal(p.items[0].offerId,'offer');assert.equal(p.amount,undefined);
});
test('material de retomada usa criptografia autenticada, IV aleatório e validação de integridade',()=>{
 const payload=directPayload(command,'verified@example.invalid','offer',reference),a=sealPayment(payload,secret),b=sealPayment(payload,secret);
 assert.notEqual(a.sealed,b.sealed);assert.equal(a.hash,b.hash);assert.ok(!a.sealed.includes(command.cpf));assert.deepEqual(openPayment(a.sealed,a.hash,secret),payload);
 assert.throws(()=>openPayment(a.sealed,'0'.repeat(64),secret));assert.throws(()=>openPayment(a.sealed,a.hash,secret+'other'));assert.throws(()=>sealPayment(payload,'short'));
 const parts=a.sealed.split('.');parts[2]='A'+parts[2].slice(1);assert.throws(()=>openPayment(parts.join('.'),a.hash,secret));
});
test('resposta financeira divergente nunca é aprovada e QR não libera acesso',()=>{
 const expected={method:'pix',productId:'product',offerId:'offer'};assert.equal(providerDirectResult(response,expected).status,'awaiting');
 for(const changed of [{amount:'22.99'},{amount:23.98},{currency:'USD'},{product:{id:'other'}},{offer:{id:'other',price:'22.99'}},{paymentMethod:'credit_card'},{status:'unknown'},{pix:{...response.pix,expirationDate:'bad'}}])assert.throws(()=>providerDirectResult({...response,...changed},expected));
 assert.equal(providerDirectResult({...response,status:'paid'},expected).status,'paid');
});
function fixture({reject,hasPremium=false}={}){
 let row=null,calls=0,body,keys=[],writes=[],reads=0;
 const deps={now:()=>now,secret,offer:()=>offer,access:async()=>({hasPremium}),validate:async()=>{},intent:async()=>({reference}),qr:async()=> 'data:image/png;base64,fixture',order:async()=>{reads++;return {id:order,sck:reference,product:{id:'product'},status:'paid'};},
  rpc:async(name,args)=>{
   writes.push(name);
   if(name==='read_direct_checkout')return row;
   if(name==='claim_direct_refresh')return true;
   if(name==='begin_direct_checkout'){if(row)return {claimed:false,attempt:row};row={id:randomUUID(),reference,method:args.p_method,state:'processing',payload:args.p_payload,payload_hash:args.p_hash,created_at:new Date(now).toISOString(),intent_expires_at:new Date(now+3600000).toISOString()};return {claimed:true,attempt:row};}
   if(name==='resume_direct_checkout'){row.state='processing';return {claimed:true,attempt:row};}
   if(name==='finish_direct_checkout'){row={...row,state:args.p_state,order_id:args.p_order,qr_code:args.p_qr,qr_expires_at:args.p_expires,payload:args.p_state==='unknown'?row.payload:null};return;}
   if(name==='refresh_direct_checkout'){row.state=args.p_state;return;}
   throw Error('unexpected_rpc');
  },create:async(p,key)=>{calls++;body=p;keys.push(key);if(reject&&calls===1)throw Error('timeout');return response;}};
 return {api:directService(deps),user:{id:'verified-user',email:'verified@example.invalid'},get calls(){return calls;},get body(){return body;},keys,writes,get reads(){return reads;}};
}
test('tentativa persistida antes do POST; repetição de clique não recria pagamento; resposta não concede Premium',async()=>{
 const f=fixture(),s=await f.api.execute(f.user,command);assert.equal(s.status,'awaiting');assert.equal(s.hasPremium,false);assert.equal(f.calls,1);assert.equal(f.body.customer.email,f.user.email);
 assert.ok(f.writes.indexOf('begin_direct_checkout')<f.writes.indexOf('finish_direct_checkout'));
 await f.api.execute(f.user,command);assert.equal(f.calls,1);assert.equal((await f.api.view(f.user.id)).payload,undefined);assert.equal((await f.api.view(f.user.id)).reference,undefined);
 const paid=await f.api.execute(f.user,{action:'refresh'});assert.equal(paid.status,'paid');assert.equal(paid.hasPremium,false);assert.equal(f.reads,1);
});
test('timeout mantém tentativa bloqueada; retomada usa exatamente o mesmo corpo e chave',async()=>{
 const f=fixture({reject:true});const first=await f.api.execute(f.user,command),body=JSON.stringify(f.body);assert.equal(first.status,'unknown');assert.equal(first.canResume,true);
 await f.api.execute(f.user,command);assert.equal(f.calls,1);
 const resumed=await f.api.execute(f.user,{action:'resume'});assert.equal(resumed.status,'awaiting');assert.equal(f.calls,2);assert.equal(f.keys[0],f.keys[1]);assert.equal(JSON.stringify(f.body),body);
});
test('Premium já ativo bloqueia compra antes de acessar a API financeira',async()=>{
 const f=fixture({hasPremium:true});await assert.rejects(f.api.execute(f.user,command),/already_premium/);assert.equal(f.calls,0);assert.equal((await f.api.view(f.user.id)).status,'complete');
});
test('HTTP exige sessão, origem exata, JSON limitado e nunca aceita identificação do navegador',async()=>{
 let count=0;const empty={status:'empty',hasPremium:false,serverNow:new Date(now).toISOString()};
 const h=(enabled=true,user={id:'verified',email:'verified@example.invalid'})=>directHandlers({user:async()=>user,view:async()=>empty,execute:async(u,c)=>{count++;assert.equal(u.id,'verified');assert.ok(c.action);return empty;}},{enabled,origin:'https://meta-aprovacao.vercel.app',secure:true});
 const req=(body,headers={})=>new Request('https://meta-aprovacao.vercel.app/api/premium/payment',{method:'POST',headers:{origin:'https://meta-aprovacao.vercel.app','content-type':'application/json',...headers},body:JSON.stringify(body)});
 assert.equal((await h().POST(req(command,{origin:'https://evil.invalid'}))).status,403);assert.equal(count,0);
 assert.equal((await h(true,null).POST(req(command))).status,401);assert.equal((await h().POST(req({...command,email:'other@example.invalid'}))).status,400);
 assert.equal((await h().POST(req({...command,name:'a'.repeat(9000)}))).status,413);
 assert.equal((await h(false).POST(req(command))).status,503);assert.equal((await h(false).POST(req({action:'resume'}))).status,503);
 assert.equal((await h(false).POST(req({action:'refresh'}))).status,200);assert.equal((await h(false).GET(new Request('https://meta-aprovacao.vercel.app/api/premium/payment'))).status,200);
 const r=await h().POST(req(command));assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);
});
test('transporte financeiro faz um único POST com chave e não repete falhas transitórias',async()=>{
 let payments=0;const api=caktoDirectApi({CAKTO_CLIENT_ID:'fixture',CAKTO_CLIENT_SECRET:secret},async(url,opts)=>{
  if(url.endsWith('/token/'))return Response.json({access_token:'fixture',token_type:'Bearer'});
  assert.ok(url.endsWith('/payments/'));assert.equal(opts.method,'POST');assert.equal(opts.headers['X-Idempotency-Key'],order);assert.equal(opts.redirect,'error');payments++;return new Response('',{status:503});
 });await assert.rejects(api.create({fixture:true},order));assert.equal(payments,1);
});
