import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studyFocus} from '../src/lib/quiz/study-focus.ts';
const catalog=JSON.parse(readFileSync('content/quiz-inicial.json','utf8'));
const result={total:10,score:7,questions:catalog.questions.map((q,index)=>({...q,correct:index>2,answer:'A'}))};
test('diagnóstico usa somente os erros e agrupa assuntos repetidos sem respostas ou explicações',()=>{
 const r=structuredClone(result);r.questions[1].subject=r.questions[0].subject;r.questions[1].topic=r.questions[0].topic;
 const focus=studyFocus(r);assert.equal(focus.length,2);assert.deepEqual(focus[0],{subject:r.questions[0].subject,topic:r.questions[0].topic,positions:[1,2]});
 assert.deepEqual(focus[1].positions,[3]);assert.doesNotMatch(JSON.stringify(focus),/explanation|correctAnswer|options|statement|"answer"/);
 assert.equal(r.questions.filter(q=>!q.correct).length,3);
});
test('nenhum erro não inventa fraquezas; dez erros mantêm todos os assuntos',()=>{
 assert.deepEqual(studyFocus({...result,questions:result.questions.map(q=>({...q,correct:true}))}),[]);
 const focus=studyFocus({...result,questions:result.questions.map(q=>({...q,correct:false}))});
 assert.equal(focus.flatMap(t=>t.positions).length,10);assert.equal(new Set(focus.map(t=>t.subject)).size,5);
});
test('introdução combina níveis por matéria e preserva exercícios anteriores em outros IDs',()=>{
 const old=JSON.parse(readFileSync('content/quiz-inicial-v1.json','utf8'));
 for(const subject of ['matematica','portugues','ciencias','historia','geografia'])assert.deepEqual(catalog.questions.filter(q=>q.subject===subject).map(q=>q.difficulty).sort(),['easy','medium']);
 assert.ok(catalog.questions.every(q=>!old.questions.some(b=>b.id===q.id)));
 assert.ok(catalog.questions.every(q=>q.statement.length>old.questions.find(b=>b.position===q.position).statement.length));
});
test('cálculos, inferências e conceitos do quiz contextualizado conferem',()=>{
 const selected=q=>q.options['ABCDE'.indexOf(q.correctAnswer)];
 assert.equal(selected(catalog.questions[0]),'R$ 68,00');assert.equal(80*(1-15/100),68);
 const participants=(720-240)/12;assert.equal(participants,40);assert.equal(240+participants*12,720);
 assert.equal(selected(catalog.questions[1]),`${participants} alunos`);
 const kilometres=2*50000/100/1000;assert.equal(kilometres,1);assert.equal(selected(catalog.questions[8]),`${kilometres} km`);
 assert.deepEqual(catalog.questions.slice(2,8).map(selected),['Permitir a consulta de livros após as aulas da tarde.','Concessão: a curta duração da viagem não impedia a leitura.','Favorece a evaporação ao renovar o ar próximo ao tecido.','Aumento dos sapos e redução dos gafanhotos.','O espaço registrado apresenta mudanças no transporte e na pavimentação.','A concentração da terra e a produção voltada ao mercado externo.']);
 assert.equal(selected(catalog.questions[9]),'A menor infiltração no bairro B favorece o escoamento superficial.');
 const bank=JSON.parse(readFileSync('content/banco-etec-if.json','utf8'));
 assert.equal(bank.questions.length,500);
 assert.ok(catalog.questions.every(q=>!bank.questions.some(b=>b.id===q.id)));
});
