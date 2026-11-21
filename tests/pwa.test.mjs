import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {serviceWorker} from '../src/lib/pwa/worker.ts';
import {installationContext,isAppContext} from '../src/lib/pwa/platform.ts';
import manifest from '../src/app/manifest.ts';
import {releaseLabel} from '../src/lib/pwa/release.ts';
import Module,{createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

function worker(build='test-a'){
 const events={},calls=[],stores=new Map([['other-app-cache',new Map()],['meta-public-old',new Map()]]);
 let offline=false;
 const caches={keys:async()=>[...stores.keys()],delete:async key=>{calls.push(['delete',key]);return stores.delete(key);},open:async key=>{
  if(!stores.has(key))stores.set(key,new Map());const store=stores.get(key);
  return {addAll:async requests=>{for(const r of requests){calls.push(['cache',r]);store.set(new URL(r.url).pathname,new Response('static '+new URL(r.url).pathname));}},match:async path=>store.get(path)?.clone()};
 }};
 class LocalRequest extends Request{constructor(url,options){super(new URL(url,'https://meta.test'),options);}}
 const fetch=async req=>{calls.push(['fetch',req.url]);if(offline)throw Error('offline');return new Response('network');};
 const self={location:{origin:'https://meta.test'},addEventListener:(type,fn)=>events[type]=fn,clients:{claim:async()=>calls.push(['claim'])},skipWaiting:()=>calls.push(['skip'])};
 vm.runInNewContext(serviceWorker(build),{self,caches,fetch,Request:LocalRequest,Response,URL,Promise});
 const lifecycle=async name=>{let p;events[name]({waitUntil:value=>p=value});await p;};
 const request=async(path,{method='GET',mode='cors',origin='https://meta.test'}={})=>{let response;events.fetch({request:{url:origin+path,method,mode},respondWith:p=>response=p});return response?await response:undefined;};
 return {calls,stores,lifecycle,request,events,offline:()=>offline=true};
}
test('manifest tem identidade, escopo, atalhos protegidos e ícones corretos',()=>{
 const m=manifest();assert.equal(m.name,'Meta Aprovação');assert.equal(m.id,'/');assert.equal(m.scope,'/');assert.equal(m.start_url,'/login');assert.equal(m.display,'standalone');assert.equal(m.icons.length,3);assert.ok(m.icons.some(i=>i.purpose==='maskable'));assert.deepEqual(m.shortcuts.map(i=>i.url),['/dashboard','/questoes']);
});
test('todos os ícones têm dimensões reais e fundo opaco',async()=>{
 for(const [name,size] of [['icon-192',192],['icon-512',512],['maskable-512',512],['apple-180',180]]){const img=sharp('public/pwa/'+name+'.png');const meta=await img.metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);assert.equal((await img.stats()).isOpaque,true);}
});
test('precache contém apenas cinco arquivos públicos sem credenciais; limpa somente versões próprias',async()=>{
 const w=worker();await w.lifecycle('install');const files=w.calls.filter(c=>c[0]==='cache');assert.equal(files.length,5);for(const [,r]of files){assert.equal(r.credentials,'omit');assert.ok(/^\/(offline.html|pwa\/[^/]+\.png)$/.test(new URL(r.url).pathname));}
 assert.ok(!w.calls.some(c=>c[0]==='skip'));await w.lifecycle('activate');assert.ok(!w.stores.has('meta-public-old'));assert.ok(w.stores.has('other-app-cache'));assert.ok(w.stores.has('meta-public-test-a'));
});
test('APIs, RSC, POSTs, credenciais, checkout e recursos externos nunca passam por cache',async()=>{
 const w=worker();await w.lifecycle('install');const count=w.calls.length;
 for(const path of ['/api/account/settings','/api/premium/study','/api/limits','/api/auth/logout','/premium/pagamento','/login?_rsc=private','/dashboard?_rsc=x','/pwa/icon-192.png?private=yes','/_next/static/chunk.js'])assert.equal(await w.request(path),undefined);
 assert.equal(await w.request('/pwa/icon-192.png',{method:'POST'}),undefined);assert.equal(await w.request('/pwa/icon-192.png',{origin:'https://external.test'}),undefined);assert.equal(w.calls.length,count);
});
test('navegação usa rede; offline mostra apenas fallback genérico sem salvar HTML autenticado',async()=>{
 const w=worker();await w.lifecycle('install');assert.equal(await(await w.request('/dashboard',{mode:'navigate'})).text(),'network');w.offline();assert.match(await(await w.request('/dashboard',{mode:'navigate'})).text(),/offline.html/);assert.deepEqual([...w.stores.get('meta-public-test-a').keys()].filter(p=>p.includes('dashboard')),[]);
});
test('ativação exige mensagem explícita de cliente da mesma origem',()=>{
 const w=worker();w.events.message({data:{type:'ACTIVATE_UPDATE'},source:{url:'https://evil.test'}});assert.equal(w.calls.length,0);w.events.message({data:{type:'ACTIVATE_UPDATE'},source:{url:'https://meta.test/configuracoes'}});assert.deepEqual(w.calls,[['skip']]);
});
test('detecção diferencia instalação do contexto atual; instruções reais por plataforma',()=>{
 assert.equal(isAppContext(false,false),false);assert.equal(isAppContext(true,false),true);assert.equal(isAppContext(false,true),true);
 assert.equal(installationContext('iPhone Safari','iPhone',1).os,'ios');assert.equal(installationContext('Mozilla Safari','MacIntel',5).os,'ios');assert.match(installationContext('Android Chrome','Linux',5).instructions,/menu/);assert.match(installationContext('Firefox','Win32',0).instructions,/Chrome ou Edge/);assert.match(installationContext('Version Safari','MacIntel',0).instructions,/Dock/);
 assert.equal(releaseLabel({version:'',build:''}),'Versão não identificada');assert.equal(releaseLabel({version:'0.1.0',build:'abcdef1234567890'}),'v0.1.0 · abcdef123456');
});
test('integração mantém opção app permanente e menu contextual, sem instalação por localStorage',()=>{
 const provider=readFileSync('src/app/pwa/provider.tsx','utf8');assert.match(provider,/standalone===false/);assert.doesNotMatch(provider,/localStorage/);assert.match(provider,/data-settings-dirty/);assert.match(provider,/window.confirm/);assert.doesNotMatch(provider,/setStandalone\(true\)/);
 const settings=readFileSync('src/app/configuracoes/settings-panel.tsx','utf8');assert.match(settings,/app:'Aplicativo'/);assert.match(settings,/section==='app'&&<ApplicationPanel/);
});
function renderApplication(state){
 const file=fileURLToPath(new URL('../src/app/pwa/application-panel.tsx',import.meta.url)),req=createRequire(file),mod=new Module(file);mod.filename=file;
 mod.require=name=>name==='../home-art'?{MetaMark:()=>createElement('span',null,'logo')}:name==='./provider'?{usePwa:()=>state,appRelease:{version:'0.1.0',build:'a'.repeat(64)},releaseLabel}:name.endsWith('.css')?{}:req(name);
 mod._compile(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);return renderToStaticMarkup(createElement(mod.exports.default));
}
test('Aplicativo mostra versão carregada instalada e versão disponível na web, sem flash de instalação',()=>{
 const base={standalone:null,instructions:'instrução de instalação',available:{version:'0.2.0',build:'b'.repeat(64)},waiting:false,message:'',workerError:false};
 const pending=renderApplication({...base,available:null});assert.match(pending,/Identificando/);assert.doesNotMatch(pending,/Instalar Meta/);
 const web=renderApplication({...base,standalone:false});assert.match(web,/Versão web/);assert.match(web,/v0.2.0/);assert.match(web,/Instalar Meta Aprovação/);assert.match(web,/instrução de instalação/);
 const app=renderApplication({...base,standalone:true});assert.match(app,/Aplicativo instalado/);assert.match(app,/Versão atual/);assert.match(app,/v0.1.0/);assert.doesNotMatch(app,/Instalar Meta Aprovação|instrução de instalação/);assert.match(app,/Atualizar quando estiver pronto/);
});
