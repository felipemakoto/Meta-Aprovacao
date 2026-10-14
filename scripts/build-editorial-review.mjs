import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root,subjects} from './lib/editorial-content.mjs';
const catalog=loadCatalog();
const revision=JSON.parse(readFileSync(new URL('content/revisao-etapa-47.json',root),'utf8'));
assert.equal(revision.catalogHash,catalog.catalogHash);
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'));
const template=readFileSync(new URL('review/editorial-template.html',root),'utf8').replaceAll('\r\n','\n');
assert.equal(template.split('__CATALOG_JSON__').length,2);
const html=template.replace('__CATALOG_JSON__',()=>JSON.stringify(catalog).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029'));
const rows=subjects.map(([subject,name])=>{const q=catalog.questions.filter(q=>q.subject===subject);return `| ${name} | ${q.length} | ${q.filter(q=>q.difficulty==='easy').length} | ${q.filter(q=>q.difficulty==='medium').length} | ${q.filter(q=>q.difficulty==='hard').length} |`;});
const report=`# Conferência editorial final — etapa 47

Última leitura das 500 questões em 14/10/2026, em três frentes independentes por matéria, com enunciados, alternativas, respostas e explicações. A instrução direta do responsável dispensa revisão humana adicional. A revisão foi feita por IA; não foi atribuída assinatura humana, avaliação empírica de dificuldade ou compra real.

${revision.contentChanges} registros receberam ajustes finais. Os outros ${500-revision.contentChanges} preservam conteúdo e versão; a mudança de estado para publicado não aumenta versão. Mantidos os 500 IDs. A carga protegida publica os 500 itens e seis modelos somente se o conteúdo e configuração correspondem ao manifesto antes/depois.

C33 agora pede a área mínima que mantém a pressão no máximo em 5.000 Pa, eliminando duas áreas válidas para o comando anterior. M50 corrige “1 estudante”; C06/C98 corrigem explicações. M16/M36/M56/M76/M96 usam velocidade escalar média. M84 explicita igual produtividade por trabalhador e por hora entre equipes. P72 explicita “Somente”. G59 distingue a redução média de 15 minutos da economia agregada de 6.000 minutos, sem prometer ganho idêntico por viagem. G67 distingue saldos líquidos e transições locais.

## Dificuldade estimada

| Matéria | Questões | Fácil | Média | Difícil |
| --- | ---: | ---: | ---: | ---: |
${rows.join('\n')}

Estimativa editorial, sem calibração por desempenho. Matemática/Português: referência ETEC/IFSP. Demais matérias: ETEC. Os seis modelos são treinos gerais ou por matéria, não réplicas oficiais certificadas. A seleção mantém quantidade e matéria, sem garantir uma tarefa de cada família por tentativa.

## Decisão e continuação

Política: content/politica-editorial.json. Instrução: “não é necessária revisão humana, pode revisar uma ultima vez e continuar”. Dispensa aplicada à revisão editorial adicional e ao avanço do conteúdo. Checkout, preço, provas financeiras e direitos pagos não são liberados por essa decisão.

Próximo passo realizado: validar em transação os seis modelos reais, incluindo proteção de gabaritos, acesso gratuito/Premium, limites e correção. Ensaios usam fixtures e rollback; não certificam compra comercial. Evidências operacionais em [Conferência final e publicação](REVISAO-ETAPA-47.md). Os [500 gabaritos](AUDITORIA-GABARITOS-ETAPA-47.md) e o [roteiro dos modelos](CONFERENCIA-MODELOS-ETAPA-47.md) ficam disponíveis para consulta e anotações opcionais.

Ferramenta v7: out/revisao-editorial-meta-aprovacao-v7/revisao-editorial.html. v6 e anotações anteriores preservadas. Marcação local não modifica a publicação. Não importar anotações antigas como aprovação automática de questões alteradas.

Fonte: content/banco-etec-if.json. Snapshot anterior: content/catalogo-etapa-46.json. Manifesto: content/revisao-etapa-47.json. Publicação: supabase/content/publicacao-etapa-47.sql. Hash: ${catalog.catalogHash}.
`;
mkdirSync(new URL('out/',root),{recursive:true});
for(const [relative,expected] of [['out/revisao-editorial.html',html],['docs/CONFERENCIA-EDITORIAL.md',report]]){const file=new URL(relative,root);if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),expected,relative);else writeFileSync(file,expected);}
console.log('Conferência final v7 preparada; política de revisão por IA registrada. Nenhuma execução SQL.');
