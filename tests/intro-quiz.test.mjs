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
test('introdução tem duas questões por matéria e cálculos elementares revisados',()=>{
 for(const subject of ['matematica','portugues','ciencias','historia','geografia'])assert.equal(catalog.questions.filter(q=>q.subject===subject).length,2);
 const selected=q=>q.options['ABCDE'.indexOf(q.correctAnswer)];
 assert.equal(selected(catalog.questions[0]),'R$ 3,00');assert.equal(30*.1,3);
 assert.equal(Number(selected(catalog.questions[1]))+5,12);
 assert.deepEqual(catalog.questions.slice(2).map(selected),['Informar quando a biblioteca não abrirá.','Feliz','Evaporação','O capim','Uma fonte histórica visual.','A cana-de-açúcar','Na legenda','No lado direito.']);
 const bank=JSON.parse(readFileSync('content/banco-etec-if.json','utf8'));
 assert.equal(bank.questions.length,500);
 assert.ok(catalog.questions.every(q=>!bank.questions.some(b=>b.id===q.id)));
});
