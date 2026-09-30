import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin=process.env.SIMULATIONS_TEST_ORIGIN||'http://127.0.0.1:3000';
const id='00000000-0000-4000-8000-000000000031';
test('API real exige autenticação verificada, recusa origem externa e não cacheia',async()=>{
 for(const headers of [{},{Cookie:'sb-forged-auth-token=invalid'}]){
  const r=await fetch(origin+'/api/simulations',{headers});assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'login_required'});assert.match(r.headers.get('cache-control'),/private, no-store/);
 }
 const body=JSON.stringify({action:'start',id});
 const local=await fetch(origin+'/api/simulations',{method:'POST',headers:{origin,'Content-Type':'application/json'},body});assert.equal(local.status,401);
 const foreign=await fetch(origin+'/api/simulations',{method:'POST',headers:{origin:'https://evil.example','Content-Type':'application/json'},body});assert.equal(foreign.status,403);
});
test('rotas reais protegidas e prévia exclusiva de desenvolvimento',async()=>{
 for(const path of ['/simulados','/simulados/'+id,'/historico/simulations/'+id]){const r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');}
 const r=await fetch(origin+'/simulados/preview');assert.equal(r.status,process.env.SIMULATIONS_TEST_PRODUCTION?404:200);
 if(!process.env.SIMULATIONS_TEST_PRODUCTION){const html=await r.text();assert.match(html,/Simulado rápido/);assert.match(html,/Iniciar simulado/);}
});
test('demonstrações portáteis incluem fontes e JS válido, sem arquivos externos ou credenciais',async()=>{
 for(const path of ['out/site-demonstracao.html','out/simulados-demonstracao.html']){const html=await readFile(path,'utf8');assert.match(html,/data:font\/woff2;base64,/);assert.match(html,/data:image\/svg\+xml;base64,/);assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=/);assert.doesNotMatch(html,/sb_secret_|service_role_key/);const js=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(js);assert.doesNotThrow(()=>new Function(js));}
});
