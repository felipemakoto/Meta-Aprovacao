import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function setup(transport,props){
 const changes=[],destinations=[],requests=[],events=[],listeners=new Map();
 const oldFetch=global.fetch,oldWindow=global.window;
 global.fetch=async(url,opts)=>{requests.push({url,opts});return transport();};
 global.window={location:{assign:url=>destinations.push(url)},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const filename=new URL('../src/app/premium/checkout-action.tsx',import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/,'$1');
 const mod=new Module(filename);mod.paths=Module._nodeModulePaths(process.cwd());
 mod.require=name=>name==='next/navigation'?{useRouter:()=>({push:url=>destinations.push(url)})}:name==='./checkout-events'?{trackCheckout:(...args)=>events.push(args)}:name==='react'?{useEffect:fn=>fn(),useRef:current=>({current}),useState:value=>[value,next=>changes.push(next)]}:name.endsWith('.css')?{primary:'primary',note:'note'}:require(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 const tree=mod.exports.default(props),button=tree.props.children[0];
 return {click:button.props.onClick,mobileClick:tree.props.children[2]?.props?.children[1].props.onClick,changes,destinations,requests,events,listeners,restore(){global.fetch=oldFetch;if(oldWindow===undefined)delete global.window;else global.window=oldWindow;}};
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

test('CTAs móvel e principal compartilham a trava; retorno do navegador libera nova navegação',async()=>{
 let finish;const h=setup(()=>new Promise(resolve=>{finish=resolve;}),{mobileSummary:true});
 try{
  const first=h.mobileClick();await h.click();assert.equal(h.requests.length,1);
  finish(Response.json({url:'https://pay.cakto.com.br/fixture?sck='+'b'.repeat(64)}));await first;
  assert.equal(h.destinations.length,1);assert.equal(h.events[0][1].placement,'mobile');
  h.listeners.get('pageshow')();const second=h.click();assert.equal(h.requests.length,2);
  finish(new Response('',{status:503}));await second;
 }finally{h.restore();}
});

test('recusa cupom, parâmetros extras, referência inválida e caminho arbitrário antes de navegar',async()=>{
 for(const url of ['https://pay.cakto.com.br/fixture?coupon=OLD','https://pay.cakto.com.br/fixture?sck=short','https://pay.cakto.com.br/fixture?sck='+'a'.repeat(64)+'&email=private','https://pay.cakto.com.br/a/b?sck='+'a'.repeat(64)]){
  const h=setup(()=>Response.json({url}));try{await h.click();assert.deepEqual(h.destinations,[]);assert.ok(h.events.some(([name])=>name==='checkout_error'));}finally{h.restore();}
 }
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

test('checkout integrado abre formulário sem criar pagamento; pendência abre o status e não um segundo checkout',async()=>{
 const h=setup(()=>assert.fail('Unexpected financial handoff'),{integrated:true,mobileSummary:true});
 try{await h.mobileClick();await h.click();assert.deepEqual(h.destinations,['/premium/pagamento']);assert.equal(h.requests.length,0);}finally{h.restore();}
 const pending=setup(()=>Response.json({error:'payment_pending'},{status:409}));
 try{await pending.click();assert.deepEqual(pending.destinations,['/premium/pagamento']);assert.equal(pending.requests.length,1);}finally{pending.restore();}
});
