import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import Module from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as contract from '../src/lib/subscriptions/contract.ts';
const require=createRequire(import.meta.url);
const link={__esModule:true,default:({children,...props})=>createElement('a',props,children)};
const image={__esModule:true,default:({src,alt,width,height})=>createElement('img',{src,alt,width,height})};
function loadTsx(relative,mocks={}){
 const filename=new URL(relative,import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/,'$1');
 const mod=new Module(filename);mod.paths=Module._nodeModulePaths(process.cwd());
 mod.require=name=>Object.hasOwn(mocks,name)?mocks[name]:name==='next/link'?link:name==='next/image'?image:name.endsWith('.css')?new Proxy({},{get:(_,key)=>key==='__esModule'?false:String(key)}):require(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 return mod.exports.default;
}
const PlanOptions=loadTsx('../src/app/premium/plan-options.tsx',{
 '@/lib/premium-study/contract':{studyAreas:{plan:'Plano de estudos',calendar:'Calendário'}},
 '@/lib/subscriptions/checkout-launch':{checkoutEnabled:true},
 './checkout-action':{__esModule:true,default:loadTsx('../src/app/premium/checkout-action.tsx',{'next/navigation':{useRouter:()=>({push(){}})},'./checkout-events':{trackCheckout(){}}})},
 './continue-study':{__esModule:true,default:()=>createElement('button',null,'Fazer meu simulado grátis')},
});
const Premium=loadTsx('../src/app/premium/premium.tsx',{
 './plan-options':{__esModule:true,default:PlanOptions},
 './checkout-offer':{__esModule:true,default:loadTsx('../src/app/premium/checkout-offer.tsx',{
  '@/lib/subscriptions/checkout-launch':{checkoutEnabled:true},
  '@/lib/premium-study/contract':{studyAreas:{plan:'Plano de estudos',reviews:'Revisão e flashcards',calendar:'Calendário'}},
  './checkout-action':{__esModule:true,default:loadTsx('../src/app/premium/checkout-action.tsx',{'next/navigation':{useRouter:()=>({push(){}})},'./checkout-events':{trackCheckout(){}}})},
  './checkout-observer':{__esModule:true,default:()=>null},
  './checkout-events':{checkoutVariant:'clarity-v1'},
 })},
 '../study-shell':{__esModule:true,default:({children})=>createElement('div',null,children)},
});
const user={id:'private-verified-owner',email_confirmed_at:'2026-10-01T12:00:00Z'};
async function render(route,pricing){
 const reads=[];
 const Page=loadTsx(route==='premium'?'../src/app/premium/page.tsx':'../src/app/cadastro/confirmado/page.tsx',{
  '@/lib/auth/user':{getVerifiedUser:async()=>user},
  '@/lib/data/subscriptions':{readSubscriptionPricing:async id=>{reads.push(id);return pricing;}},
  '@/lib/subscriptions/contract':{...contract,premiumOffer:(date,history)=>contract.premiumOffer(new Date('2026-10-17T12:00:00-03:00'),history)},
  'next/navigation':{redirect:()=>assert.fail('Unexpected redirect')},
  './premium':{__esModule:true,default:Premium},
  '@/app/premium/plan-options':{__esModule:true,default:PlanOptions},
 });
 return {html:renderToStaticMarkup(await Page()).replaceAll('\u00a0',' '),reads};
}
for(const route of ['premium','confirmed']){
 test(`${route}: conta que nunca pagou vê preço regular, taxa e ausência de promoção`,async()=>{
  const {html,reads}=await render(route,{hasPremium:false,accessUntil:null,hasPaidBefore:false});
  assert.deepEqual(reads,[user.id]);assert.match(html,/22,99/);assert.match(html,/desde a primeira cobrança/);assert.match(html,/0,99/);assert.match(html,/23,98/);assert.doesNotMatch(html,/12,49|primeiracompra|31\/10|no primeiro mês/);
  assert.doesNotMatch(html,/private-verified-owner|order_id/);
 });
 test(`${route}: pagamento antigo e Premium inativo mostram somente preço mensal normal`,async()=>{
  const {html}=await render(route,{hasPremium:false,accessUntil:null,hasPaidBefore:true});
  assert.match(html,/23,98/);assert.match(html,/por mês/);assert.doesNotMatch(html,/12,49|no primeiro mês|primeiracompra|Depois,/);
  assert.match(html,/Assinar Premium/);
 });
 test(`${route}: falha no histórico não anuncia promoção`,async()=>{
  const {html}=await render(route,{hasPremium:false,accessUntil:null});
  assert.doesNotMatch(html,/12,49|no primeiro mês|primeiracompra/);assert.match(html,/consultar seu plano/);
 });
 test(`${route}: Premium ativo mantém ação de estudo e preço mensal`,async()=>{
  const {html}=await render(route,{hasPremium:true,accessUntil:'2026-11-17T12:00:00Z',hasPaidBefore:true});
  assert.match(html,/Abrir meus recursos Premium/);assert.match(html,/23,98/);assert.doesNotMatch(html,/12,49|primeiracompra|Premium em breve/);
 });
}

test('checkout deixa total, recorrência, cancelamento, responsável e acesso gratuito explícitos',async()=>{
 const {html}=await render('premium',{hasPremium:false,accessUntil:null,hasPaidBefore:false});
 for(const text of ['Total por mês','Renovação mensal até o cancelamento','Como cancelo a assinatura','responsável','Continuar no Gratuito','Interface real da Meta Aprovação'])assert.ok(html.includes(text),text);
 assert.match(html,/data-checkout-variant="clarity-v1"/);assert.match(html,/premium-review-card\.png/);
 assert.doesNotMatch(html,/depoimento|últimas vagas|oferta termina|50%|<del|countdown|expiresAt/);
});

test('assinante ativo não recebe CTA de nova compra nem o funil de aquisição',async()=>{
 const {html}=await render('premium',{hasPremium:true,accessUntil:'2026-11-17T12:00:00Z',hasPaidBefore:true});
 assert.doesNotMatch(html,/Assinar Premium|data-checkout-variant/);
 assert.match(html,/Abrir meus recursos Premium/);
});
