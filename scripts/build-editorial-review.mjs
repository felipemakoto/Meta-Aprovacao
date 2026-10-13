// Ferramenta interna; nenhuma aprovação ou gravação no banco.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root,subjects} from './lib/editorial-content.mjs';
const catalog=loadCatalog();
const revision=JSON.parse(readFileSync(new URL('content/revisao-etapa-45.json',root),'utf8'));
assert.equal(revision.catalogHash,catalog.catalogHash);
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'));
const template=readFileSync(new URL('review/editorial-template.html',root),'utf8').replaceAll('\r\n','\n');
assert.equal(template.split('__CATALOG_JSON__').length,2);
const payload=JSON.stringify(catalog).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
const html=template.replace('__CATALOG_JSON__',()=>payload);
const rows=subjects.map(([subject,name])=>{
 const q=catalog.questions.filter(q=>q.subject===subject);
 return `| ${name} | ${q.length} | ${q.filter(q=>q.difficulty==='easy').length} | ${q.filter(q=>q.difficulty==='medium').length} | ${q.filter(q=>q.difficulty==='hard').length} |`;
});
const report=`# Conferência editorial atual — etapa 45

Revisão em 13/10/2026 das 500 questões, cem por matéria. ${revision.changes.length} registros alterados: ${revision.contentChanges} têm alterações em texto, alternativas, resposta ou explicação; ${revision.difficultyChanges} mudaram de dificuldade. Essas contagens se sobrepõem. Todas as 500 tarefas receberam análise e fundamento de dificuldade. IDs e ordem foram preservados; versões aumentam somente quando o conteúdo editorial ou sua dificuldade mudam. Todas continuam draft, sem revisão humana atribuída.

## Correções solicitadas

C02 separa planejamento de separação e experimento já executado. C22: 15 g de sal; C42: 75 g de água; C82: 125 g efetivamente recolhidos, porque 75 g de água se perderam na evaporação aberta. Isso distingue recuperação de conservação de massa.

M06 e suas variantes têm contagens inteiras e arrecadações possíveis; M07 usa notas entre zero e dez. A tarefa M87 pede explicitamente avaliar uma meta impossível, em vez de oferecer uma nota fora da escala como distrator numérico. Corrigidos também distratores negativos de contagem e volumes acima da capacidade em outras famílias.

Os cinco enunciados de C11, G01 e G16 usam somente os dados pertinentes a cada comando. Nos demais, retirados avisos repetidos e orientações dispensáveis. Mantidas unidades, hipóteses físicas e condições necessárias. Corrigidas referência possessiva, terminologia gramatical, legitimação da violência e detalhes de controle experimental.

## Diversificação e verificação

Matemática: 44 tarefas substituídas por problemas inversos, comparação, validação de relatórios, viabilidade e hipóteses. Velocidade média agora inclui tempos iguais, trechos distintos e parada. Sequências incluem crescimento aditivo, multiplicativo e reconstrução do primeiro termo. História: vinte casos novos, com fontes, cronologia, relações institucionais e aplicação. Português: vinte análises linguísticas contextualizadas e distratores de vinte procedimentos, além de quarenta explicações específicas. Eliminadas duplicações de objetivo em famílias de Geografia e Ciências.

Os 80 problemas numéricos de Matemática foram conferidos por relações independentes; mais setenta resultados de Ciências, Geografia e História foram recalculados, além de resultados compostos, conservação, probabilidade e fusos. Os vinte problemas conceituais de Matemática e os conteúdos não numéricos tiveram conferência editorial assistida por IA. Testes não demonstram, sozinhos, ausência de ambiguidade em todas as alternativas ou qualidade pedagógica. Os gabaritos e fundamentos das 500 tarefas estão no [registro de conferência](AUDITORIA-GABARITOS-ETAPA-45.md).

## Dificuldade estimada por tarefa

| Matéria | Questões | Fácil | Média | Difícil |
| --- | ---: | ---: | ---: | ---: |
${rows.join('\n')}

Fácil: leitura explícita ou cálculo direto. Média: aplicação de conceito, combinação de dados ou distinção entre condições. Difícil: integração de etapas dependentes, comparação não imediata ou análise de hipóteses. O julgamento considera comando, conhecimento exigido e alternativas, não extensão do texto. Comparação qualitativa com os cadernos oficiais ETEC 2026 e IFSP integrado, edital 211/2025, tipo 2. Não há dados de desempenho de candidatos: classificação editorial, sem calibração estatística. Ciências, História e Geografia referem-se à ETEC; o caderno IFSP consultado concentra Matemática e Português.

## Uso da ferramenta

Abrir out/revisao-editorial-meta-aprovacao-v5/revisao-editorial.html. Filtrar por matéria, dificuldade, marcação ou busca. Conferir resposta e fundamento; registrar comentários e exportar JSON. Nenhuma marcação local publica questões. v4 e a pasta do revisor foram preservadas; as anotações antigas podem ser exportadas para consulta, sem transferência automática como aprovação da versão nova.

Fonte: content/banco-etec-if.json. Snapshot anterior: content/catalogo-etapa-44.json. Manifesto antes/depois: content/revisao-etapa-45.json. Carga protegida: supabase/content/revisao-etapa-45.sql. Hash: ${catalog.catalogHash}.

Critérios, referências e evidências operacionais em [Revisão completa](REVISAO-INTEGRAL-ETAPA-45.md). Revisão humana das questões e dos seis modelos continua pendente. Nenhum conteúdo publicado ou venda liberada.
`;
mkdirSync(new URL('out/',root),{recursive:true});
for(const [relative,expected] of [['out/revisao-editorial.html',html],['docs/CONFERENCIA-EDITORIAL.md',report]]){
 const file=new URL(relative,root);
 if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),expected,relative);
 else writeFileSync(file,expected);
}
console.log(`${catalog.questions.length} questões na revisão v5; nenhuma aprovação ou publicação no banco.`);
