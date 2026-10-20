import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function setup(transport){
 const changes=[],destinations=[],requests=[];
 const oldFetch=global.fetch,oldWindow=global.window;
 global.fetch=async(url,opts)=>{requests.push({url,opts});return transport();};
 global.window={location:{assign:url=>destinations.push(url)}};
 const filename=new URL('../src/app/premium/checkout-action.tsx',import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/,'$1');
 const mod=new Module(filename);mod.paths=Module._nodeModulePaths(process.cwd());
 mod.require=name=>name==='next/navigation'?{useRouter:()=>({push:url=>destinations.push(url)})}:name==='react'?{useRef:current=>({current}),useState:value=>[value,next=>changes.push(next)]}:name.endsWith('.css')?{primary:'primary',note:'note'}:require(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 const tree=mod.exports.default(),button=tree.props.children[0];
 return {click:button.props.onClick,changes,destinations,requests,restore(){global.fetch=oldFetch;if(oldWindow===undefined)delete global.window;else global.window=oldWindow;}};
}
test('um clique repetido cria uma única intenção e navega somente depois da resposta',async()=>{
 let finish;const h=setup(()=>new Promise(resolve=>{finish=resolve;}));
 try{
  const p=h.click();await h.click();assert.equal(h.requests.length,1);assert.deepEqual(h.destinations,[]);assert.ok(h.changes.includes(true));
  const {url,opts}=h.requests[0];assert.equal(url,'/api/premium/checkout');assert.equal(opts.method,'POST');assert.deepEqual(opts.headers,{Accept:'application/json'});assert.equal(opts.body,undefined);
  finish(Response.json({url:'https://pay.cakto.com.br/fixture?sck='+'a'.repeat(64)}));await p;
  assert.equal(h.destinations.length,1);assert.equal(new URL(h.destinations[0]).hostname,'pay.cakto.com.br');
 }finally{h.restore();}
});
test('sessão expirada volta ao login; erro, destino externo e limite exibem erro e permitem tentar novamente',async()=>{
 for(const response of [()=>new Response('',{status:401}),()=>new Response('',{status:409}),()=>new Response('',{status:429}),()=>new Response('',{status:503}),()=>Response.json({url:'https://foreign.invalid'}),()=>{throw Error('network');}]){
  const h=setup(response);
  try{await h.click();
   if(h.destinations.length){assert.deepEqual(h.destinations,['/login']);continue;}
   assert.ok(h.changes.some(v=>typeof v==='string'&&v.length>10));assert.equal(h.changes.at(-1),false);
   await h.click();assert.equal(h.requests.length,2);
  }finally{h.restore();}
 }
});
