import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root} from './lib/editorial-content.mjs';
const catalog=loadCatalog();
const levels={easy:'Fácil',medium:'Média',hard:'Difícil'};
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'));
const report=`# Registro de conferência de gabaritos — etapa 45

500 questões, fonte e hash ${catalog.catalogHash}. Registro de conferência técnica/editorial assistida por IA em 13/10/2026; não é assinatura ou aprovação de um revisor humano. A tabela de dificuldades é estimada, sem dados de desempenho. Este documento reproduz a resposta e seu fundamento para permitir conferência item a item; ele não constitui prova automática de correção semântica.

Método: 80 problemas numéricos de Matemática por equações e enumeração independentes; 70 resultados adicionais por cálculo separado; balanços físicos, probabilidades e fusos por verificações específicas. Nos demais itens, confronto do enunciado, alternativas, explicação e conceitos escolares; fontes específicas em REVISAO-INTEGRAL-ETAPA-45.md. Testes em tests/exam-bank.test.mjs e tests/editorial-accuracy.test.mjs. Cada tarefa permanece draft, sem revisão humana atribuída.

${catalog.questions.map(q=>`## ${q.label} — ${q.topic}

ID: ${q.id}. Versão ${q.version}. Dificuldade estimada: ${levels[q.difficulty]}.

**Gabarito: ${q.correctAnswer}.** ${q.options['ABCDE'.indexOf(q.correctAnswer)]}

Fundamento: ${q.explanation}

Tarefa: ${q.difficultyReview.skill}. ${q.difficultyReview.rationale}
`).join('\n')}`;
const file=new URL('docs/AUDITORIA-GABARITOS-ETAPA-45.md',root);
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),report);
else writeFileSync(file,report);
console.log('Registro interno dos 500 gabaritos e fundamentos preparado.');
