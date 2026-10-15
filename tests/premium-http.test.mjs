import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.PREMIUM_TEST_ORIGIN||'http://localhost:3000';
test('pagina privada ignora tentativa de forjar conta/plano pela URL e cookie',async()=>{
 for(const headers of [{},{Cookie:'sb-forged-auth-token=invalid'}]){
  const r=await fetch(origin+'/premium?user_id=forged&state=active',{headers,redirect:'manual'});
  assert.equal(r.status,307);assert.equal(new URL(r.headers.get('location'),origin).pathname,'/login');
  assert.match(r.headers.get('cache-control'),process.env.PREMIUM_TEST_PRODUCTION?/no-store/:/no-store|no-cache/);
 }
});
test('previa promocional deixa renovacao clara e nao aceita pagamento',async()=>{
 const r=await fetch(origin+'/premium/preview');assert.equal(r.status,process.env.PREMIUM_TEST_PRODUCTION?404:200);if(process.env.PREMIUM_TEST_PRODUCTION)return;
 const html=(await r.text()).replaceAll('<!-- -->','');
 for(const text of ['Gratuito','Premium','no primeiro mês','10 questões por dia','1 simulado rápido por dia','Questões sem limite diário','Premium em breve','primeiracompra','31/10/2026'])assert.ok(html.includes(text),text);
 assert.match(html,/R\$\s*12,49/);assert.match(html,/Depois, R\$\s*23,98\/mês/);assert.match(html,/Taxa Cakto de R\$ 0,99 incluída/);
 assert.match(html,/<button[^>]*disabled[^>]*>Premium em breve/);
 assert.ok(html.indexOf('10 questões por dia')<html.indexOf('Premium em breve'));
 assert.doesNotMatch(html,/https:\/\/pay\.kiwify|sb_secret_/);
});
test('estados distintos ativo, erro e fim da promocao',async()=>{
 if(process.env.PREMIUM_TEST_PRODUCTION)return;
 const active=await (await fetch(origin+'/premium/preview?state=active')).text();assert.match(active,/Premium ativo até/);assert.match(active,/Continuar no Premium/);assert.doesNotMatch(active,/no primeiro mês|Premium em breve/);
 const error=await (await fetch(origin+'/premium/preview?state=error')).text();assert.match(error,/Não foi possível consultar seu plano/);assert.doesNotMatch(error,/Premium em breve|R\$10/);
 const regular=(await (await fetch(origin+'/premium/preview?offer=regular')).text()).replaceAll('<!-- -->','');assert.match(regular,/R\$\s*23,98/);assert.doesNotMatch(regular,/no primeiro mês|Cupom/);
});
