import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.AUTH_TEST_BASE_URL||'http://127.0.0.1:3000';
const next={action:'next',filters:{subject:'matematica',topic:'',difficulty:'all',exam:'all'},previous:null};
test('página protegida e API exigem sessão sem expor conteúdo',async()=>{
 const page=await fetch(origin+'/questoes',{redirect:'manual'});assert.equal(page.status,307);assert.equal(page.headers.get('location'),'/login');
 const r=await fetch(origin+'/api/practice',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(next)});assert.equal(r.status,401);assert.match(r.headers.get('cache-control'),/private.*no-store/);
 assert.equal((await fetch(origin+'/api/practice?subject=matematica')).status,401);
});
test('origem e payload malformado bloqueados',async()=>{
 for(const [headers,body,status]of [[{origin:'https://evil.example','content-type':'application/json'},JSON.stringify(next),403],[{origin,'content-type':'application/json'},'{}',400]])assert.equal((await fetch(origin+'/api/practice',{method:'POST',headers,body})).status,status);
});
test('prévia mostra filtros, cinco alternativas e seleção sem correção antecipada',async()=>{
 const r=await fetch(origin+'/questoes/preview');assert.equal(r.status,200);const html=await r.text();
 for(const text of ['Matéria','Assunto','Dificuldade','Prova alvo','Conferir resposta','questão ilustrativa'])assert.ok(html.includes(text));
 assert.equal((html.match(/type="radio"/g)||[]).length,5);assert.equal(html.includes('Você acertou'),false);assert.equal(html.includes('Snapshot'),false);
});
