import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin=process.env.STATISTICS_TEST_ORIGIN||'http://localhost:3000';
test('rota e API reais exigem sessão verificada e resposta privada',async()=>{
 for(const headers of [{},{Cookie:'sb-forged-auth-token=invalid'}]){const r=await fetch(origin+'/api/statistics',{headers});assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'login_required'});assert.match(r.headers.get('cache-control'),/private, no-store/);}
 const page=await fetch(origin+'/estatisticas?user_id=forged',{redirect:'manual'});assert.equal(page.status,307);assert.equal(new URL(page.headers.get('location'),origin).pathname,'/login');
 assert.equal((await fetch(origin+'/api/statistics',{method:'POST'})).status,405);
});
test('prévia mostra estatísticas e cabeçalho sem o retorno removido',async()=>{
 const r=await fetch(origin+'/estatisticas/preview');assert.equal(r.status,process.env.STATISTICS_TEST_PRODUCTION?404:200);if(process.env.STATISTICS_TEST_PRODUCTION)return;
 const html=(await r.text()).replaceAll('<!-- -->','');assert.match(html,/42 de 60 acertos/);assert.match(html,/Últimos 30 dias/);assert.match(html,/18 de 30.*60%/);assert.match(html,/Ver histórico/);
 const header=html.match(/<header[^>]*>([\s\S]*?)<\/header>/)?.[1];assert.ok(header);assert.doesNotMatch(header,/Meus estudos/);
});
test('demonstrações portáteis incorporam ativos e JS válido, sem credenciais',async()=>{
 for(const path of ['out/estatisticas-demonstracao.html','out/site-demonstracao.html']){const html=await readFile(path,'utf8');assert.match(html,/data:font\/woff2;base64,/);assert.match(html,/data:image\/svg\+xml;base64,/);assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)=/);assert.doesNotMatch(html,/sb_secret_|service_role_key/);const js=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(js);assert.doesNotThrow(()=>new Function(js));}
});
