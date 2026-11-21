import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const mod=new Module('checkout-events');
mod._compile(ts.transpileModule(readFileSync('src/app/premium/checkout-events.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,'checkout-events');
test('funil emite apenas evento local sem cookies, identidade, destino financeiro ou rede',()=>{
 const previous=global.window,events=[];
 global.window={dispatchEvent:event=>events.push(event),fetch:()=>assert.fail('no network')};
 try{
  mod.exports.trackCheckout('checkout_start',{placement:'mobile'});
  assert.equal(events[0].type,'meta:checkout');
  assert.deepEqual(events[0].detail,{name:'checkout_start',variant:'clarity-v1',placement:'mobile'});
  global.window.dispatchEvent=()=>{throw Error('observer unavailable');};
  assert.doesNotThrow(()=>mod.exports.trackCheckout('checkout_error',{reason:'503'}));
 }finally{if(previous===undefined)delete global.window;else global.window=previous;}
});
