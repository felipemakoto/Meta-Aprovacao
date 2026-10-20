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
 './continue-study':{__esModule:true,default:()=>createElement('button',null,'Fazer meu simulado grátis')},
});
const Premium=loadTsx('../src/app/premium/premium.tsx',{
 './plan-options':{__esModule:true,default:PlanOptions},
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
 test(`${route}: conta que nunca pagou vê oferta inicial`,async()=>{
  const {html,reads}=await render(route,{hasPremium:false,accessUntil:null,hasPaidBefore:false});
  assert.deepEqual(reads,[user.id]);assert.match(html,/12,49/);assert.match(html,/no primeiro mês/);assert.match(html,/primeiracompra/);
  assert.doesNotMatch(html,/private-verified-owner|order_id/);
 });
 test(`${route}: pagamento antigo e Premium inativo mostram somente preço mensal normal`,async()=>{
  const {html}=await render(route,{hasPremium:false,accessUntil:null,hasPaidBefore:true});
  assert.match(html,/23,98/);assert.match(html,/por mês/);assert.doesNotMatch(html,/12,49|no primeiro mês|primeiracompra|Depois,/);
  assert.match(html,/Premium em breve/);
 });
 test(`${route}: falha no histórico não anuncia promoção`,async()=>{
  const {html}=await render(route,{hasPremium:false,accessUntil:null});
  assert.doesNotMatch(html,/12,49|no primeiro mês|primeiracompra/);assert.match(html,/consultar seu plano/);
 });
 test(`${route}: Premium ativo mantém ação de estudo e preço mensal`,async()=>{
  const {html}=await render(route,{hasPremium:true,accessUntil:'2026-11-17T12:00:00Z',hasPaidBefore:true});
  assert.match(html,/Continuar no Premium/);assert.match(html,/23,98/);assert.doesNotMatch(html,/12,49|primeiracompra|Premium em breve/);
 });
}
