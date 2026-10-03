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
 for(const text of ['Outubro · 50% na primeira mensalidade','R$10','Depois, R$20 por mês.','10 questões/dia','Questões ilimitadas','Contratação em breve.'])assert.ok(html.includes(text),text);
 assert.match(html,/<button[^>]*disabled[^>]*>Escolher Premium/);
 assert.ok(html.indexOf('10 questões/dia')<html.indexOf('Escolher Premium'));
 assert.doesNotMatch(html,/https:\/\/pay\.kiwify|sb_secret_/);
});
test('estados distintos ativo, erro e fim da promocao',async()=>{
 if(process.env.PREMIUM_TEST_PRODUCTION)return;
 const active=await (await fetch(origin+'/premium/preview?state=active')).text();assert.match(active,/Seu Premium está ativo/);assert.match(active,/Continuar estudando/);assert.doesNotMatch(active,/50% na primeira mensalidade/);
 const error=await (await fetch(origin+'/premium/preview?state=error')).text();assert.match(error,/Não foi possível consultar seu plano/);assert.doesNotMatch(error,/Escolher Premium|R\$10/);
 const regular=(await (await fetch(origin+'/premium/preview?offer=regular')).text()).replaceAll('<!-- -->','');assert.match(regular,/R\$20/);assert.doesNotMatch(regular,/50% na primeira mensalidade|Oferta até/);
});
