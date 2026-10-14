// Amostras estáticas para conferência humana; não criam tentativas ou modelos.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root,subjects} from './lib/editorial-content.mjs';
const catalog=loadCatalog();
const snapshot=JSON.parse(readFileSync(new URL('content/modelos-etapa-46.json',root),'utf8'));
assert.equal(snapshot.models.length,6);
assert.ok(snapshot.models.every(m=>!m.published));
assert.ok(process.argv.slice(2).every(a=>a==='--check'));
const level={easy:'Fácil',medium:'Média',hard:'Difícil'};
const sample=model=>{
 if(model.subject){
  const pool=catalog.questions.filter(q=>q.subject===model.subject);
  assert.equal(pool.length,100);
  const families=[...new Set(pool.map(q=>q.family))].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
  assert.equal(families.length,20);
  assert.equal(model.question_count,20);
  return families.map((family,i)=>pool.find(q=>q.family===family&&q.variant===1+i%5));
 }
 assert.equal(model.question_count,10);
 // Dois itens por matéria, em famílias distintas. É roteiro, não regra do sorteio.
 return subjects.flatMap(([subject],i)=>[1,12].map((n,j)=>catalog.questions.find(q=>q.subject===subject&&Number(q.family.slice(1))===n&&q.variant===1+(i+j)%5)));
};
const report=`# Roteiro de conferência dos seis modelos — etapa 46

Consulta de configuração somente leitura em ${snapshot.capturedOn}. Banco editorial: ${catalog.catalogHash}. Os seis modelos permanecem não publicados. Há 500 questões em rascunho, cem por matéria; zero questões aprovadas/publicadas por esta revisão.

Este roteiro avança a preparação da revisão humana: propõe amostras estáticas para avaliar os modelos. Não são tentativas reais, não são perguntas fixadas nos modelos e não representam a distribuição garantida pelo sorteio atual. Nenhum registro foi criado ou publicado. As questões por matéria foram distribuídas em vinte famílias distintas para que o revisor avalie a amplitude de tarefas; o rápido usa duas por matéria apenas nesta amostra.

Os modelos são treinos gerais ou por matéria, não réplicas certificadas de provas oficiais. Matemática e Português têm referência ETEC/IFSP; Ciências, História e Geografia têm destino ETEC. O simulado rápido mistura as cinco matérias e não deve ser apresentado como reprodução do formato específico do IFSP.

Para cada amostra, abrir o HTML v6, buscar os rótulos abaixo e resolver sem exibir gabaritos. Depois conferir cada explicação. Registrar erros ou ambiguidades no próprio HTML e exportar o JSON. Em anotação separada, identificar modelo, revisor e data e avaliar: adequação do nível, distribuição de conteúdos, variedade de raciocínios e duração observada. Não se presume duração ou aprovação sem teste humano.

${snapshot.models.map(model=>{
 const rows=sample(model);
 assert.equal(rows.length,model.question_count);
 assert.equal(new Set(rows.map(q=>q.id)).size,rows.length);
 assert.ok(rows.every(q=>q.status==='draft'&&(!model.subject||q.subject===model.subject)));
 const distribution=Object.entries(level).map(([k,v])=>`${rows.filter(q=>q.difficulty===k).length} ${v.toLowerCase()}`).join(', ');
 return `## ${model.title}

ID do modelo: ${model.id}. Configuração observada: ${model.question_count} questões; ${model.free_access?'acesso gratuito configurado':'acesso gratuito não configurado'}; não publicado.

Amostra sugerida, com dificuldade estimada: ${distribution}.

| Questão | Matéria | Tema | Nível estimado |
| --- | --- | --- | --- |
${rows.map(q=>`| ${q.label} | ${q.subjectName} | ${q.topic} | ${level[q.difficulty]} |`).join('\n')}

Revisor: pendente. Data: pendente. Adequação e tempo observado: pendentes.
`;
}).join('\n')}

O banco mantém vinte famílias por matéria e cinco tarefas em cada uma; existem contextos compartilhados. Quinhentas questões não equivalem a quinhentos assuntos independentes. A seleção atual prioriza exposição do aluno; esta conferência estática não certifica dispersão por família em toda tentativa. A revisão humana das questões e dos modelos continua pendente.
`;
const file=new URL('docs/CONFERENCIA-MODELOS-ETAPA-46.md',root);
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),report);
else writeFileSync(file,report);
console.log('Roteiro dos seis modelos preparado com amostras estáticas; sem tentativas, publicação ou aprovação.');
