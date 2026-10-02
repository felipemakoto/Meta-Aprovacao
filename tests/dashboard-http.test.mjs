import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3000';
test('dashboard exige sessão, não aceita usuário na query e não compartilha cache',async()=>{
 for(const suffix of ['', '?userId=other']) {
  const r=await fetch(origin+'/dashboard'+suffix,{redirect:'manual'});
  assert.equal(r.status,307);assert.equal(r.headers.get('location'),'/login');
  assert.match(r.headers.get('cache-control'),/private.*no-store|no-cache, must-revalidate/);
 }
});
test('prévia mostra valores, botões de revisão e estados vazio/erro',async()=>{
 const page=await (await fetch(origin+'/dashboard/preview')).text();
 assert.match(page,/Seus estudos/);assert.match(page,/Revisar erros/);assert.match(page,/review=errors/);assert.match(page,/Dados ilustrativos/);assert.match(page,/Respostas registradas/);assert.match(page,/estatisticas\/preview/);
 const empty=await (await fetch(origin+'/dashboard/preview?state=empty')).text();assert.match(empty,/Ainda não há um teste salvo/);
 const error=await (await fetch(origin+'/dashboard/preview?state=error')).text();assert.match(error,/Não foi possível carregar seus estudos/);assert.doesNotMatch(error,/Questões respondidas/);
 const perfect=await (await fetch(origin+'/dashboard/preview?score=10')).text();assert.match(perfect,/Você acertou todas/);assert.match(perfect,/review=all/);assert.doesNotMatch(perfect,/Revisar erros/);
});
test('revisão abre erro individual, resumo continua separado e nota perfeita revisa todas',async()=>{
 const review=(await (await fetch(origin+'/quiz/result/preview?review=errors')).text()).replaceAll('<!-- -->','');assert.match(review,/Revisão dos erros/);assert.match(review,/Próxima explicação/);
 const summary=await (await fetch(origin+'/quiz/result/preview')).text();assert.match(summary,/Seu resultado/);assert.doesNotMatch(summary,/Próxima explicação/);
 const perfect=(await (await fetch(origin+'/quiz/result/preview?score=10&review=errors')).text()).replaceAll('<!-- -->','');assert.match(perfect,/Revisão das respostas/);
});
