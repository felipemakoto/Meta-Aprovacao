import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin=process.env.HISTORY_TEST_ORIGIN||'http://127.0.0.1:3000';
test('endpoint real exige sessão verificada e não cacheia',async()=>{
 for(const headers of [{},{Cookie:'sb-forged-auth-token=invalid'}]){
 const r=await fetch(origin+'/api/history?kind=tests',{headers});
 assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'login_required'});
 assert.match(r.headers.get('cache-control'),/private, no-store/);
 }
 assert.equal((await fetch(origin+'/api/history',{method:'POST'})).status,405);
});
test('página e detalhe reais redirecionam visitante ao login',async()=>{
 for(const path of ['/historico','/historico/tests/00000000-0000-4000-8000-000000000020']){
 const r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');
 if(process.env.HISTORY_TEST_PRODUCTION)assert.match(r.headers.get('cache-control'),/private, no-store/);
 }
});
test('prévia disponível apenas em desenvolvimento',async()=>{
 const r=await fetch(origin+'/historico/preview');
 assert.equal(r.status,process.env.HISTORY_TEST_PRODUCTION?404:200);
 if(!process.env.HISTORY_TEST_PRODUCTION)assert.match(await r.text(),/Seu histórico/);
});
test('HTML portátil contém fontes, ícones e JS válido sem ativos externos',async()=>{
 const html=await readFile('out/historico-demonstracao.html','utf8');
 assert.match(html,/data:font\/woff2;base64,/);assert.match(html,/data:image\/svg\+xml;base64,/);
 assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=/);assert.doesNotMatch(html,/sb_secret_/);
 const js=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(js);assert.doesNotThrow(()=>new Function(js));
});

