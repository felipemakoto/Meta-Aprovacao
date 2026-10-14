import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../scripts/lib/editorial-content.mjs';
const {questions}=loadCatalog();
const get=label=>questions.find(q=>q.label===label);
const correct=q=>q.options['ABCDE'.indexOf(q.correctAnswer)];

test('nova carga de trabalho considera etapas e produtividade relativa, por balanço independente',()=>{
 const first=get('M44'),second=get('M64');
 // Produção medida em trabalhador-horas da equipe original.
 const need=10*12*6;
 const already=10*4*6;
 const team=Number(correct(first).split(' ')[0]);
 assert.equal(already+team*6*4,need);
 assert.notEqual(already+(team-1)*6*4,need);
 const days=Number(correct(second).split(' ')[0]);
 assert.ok(Math.abs(18*6*.8*days-12*12*6)<1e-8);
 assert.equal(first.difficulty,'hard');
 assert.equal(second.difficulty,'hard');
});

test('80 tarefas numéricas não contêm valores repetidos disfarçados por formatação',()=>{
 const numeric=questions.filter(q=>q.subject==='matematica'&&q.audit.kind!=='concept45');
 assert.equal(numeric.length,80);
 for(const q of numeric){
  const values=q.options.map(s=>{
   const token=s.match(/^[\d.,]+/);assert.ok(token,q.label);
   return Number(token[0].replaceAll('.','').replace(',','.'));
  });
  assert.ok(values.every(Number.isFinite),q.label);
  assert.equal(new Set(values).size,5,q.label);
 }
});

test('H51 distingue produção diária, jornada e produtividade por trabalhador-hora',()=>{
 const oldOutput=1000,newOutput=1500,workers=100,oldHours=10,newHours=12;
 const outputChange=(newOutput-oldOutput)/oldOutput*100;
 const hoursChange=(newHours-oldHours)/oldHours*100;
 const oldRate=oldOutput/(workers*oldHours),newRate=newOutput/(workers*newHours);
 assert.equal(outputChange,50);assert.equal(hoursChange,20);
 assert.equal(oldRate,1);assert.equal(newRate,1.25);
 assert.match(correct(get('H51')),/50%.*20%.*não demonstram aumento de salário/s);
});

test('comandos delimitam a informação pedida e controles permitem comparar os resultados',()=>{
 assert.match(get('P77').statement,/inscrição pertence à aluna/);
 assert.match(get('P77').statement,/explicita esse referente/);
 assert.equal(get('P77').options.filter(s=>s.includes('a inscrição da aluna')).length,1);
 assert.match(correct(get('P77')),/a inscrição da aluna/);
 assert.match(get('P75').statement,/depois o debateu/);
 assert.match(get('P75').statement,/oração relativa/);
 assert.match(correct(get('P75')),/a que os estudantes assistiram/);
 assert.match(get('M98').statement,/Entre oito pessoas, duas serão escolhidas/);
 assert.match(correct(get('M98')),/dupla aparece em duas ordens/);
 for(const q of questions.filter(q=>q.family==='C6'))assert.match(q.statement,/áreas foliares equivalentes/);
 for(const q of questions.filter(q=>q.family==='C16'))assert.match(q.statement,/iguais volumes de ar, umidade e temperatura/);
 for(const q of questions.filter(q=>q.family==='C18'))assert.match(q.statement,/sem entrada ou saída de indivíduos/);
 for(const q of questions.filter(q=>q.family==='G8'))assert.match(q.statement,/dez horas do período observado/);
 assert.match(get('H96').statement,/1822.*1888.*1889/s);
 assert.match(correct(get('H96')),/receberam terras/);
});

test('pistas de erro e iniciais minúsculas após ponto foram retiradas dos enunciados e distratores',()=>{
 for(const q of questions)assert.doesNotMatch(q.statement,/\. [a-zà-ú]/,q.label);
 for(const label of ['M95','M97','G86','C51']){
  const q=get(label);
  for(const s of q.options)assert.doesNotMatch(s,/confundindo|é confundida|sem considerar o número/);
 }
 const history=questions.filter(q=>q.subject==='historia'&&q.variant===3&&q.difficultyReview.reviewedOn==='2026-10-14');
 assert.equal(history.length,10);
 assert.equal(new Set(history.map(q=>q.statement.split('\n\n')[0])).size,10);
 assert.ok(history.every(q=>q.difficulty==='medium'));
});
