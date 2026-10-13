// Ferramenta interna; nenhuma aprovação ou gravação no banco.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadCatalog, root, subjects } from "./lib/editorial-content.mjs";
const catalog = loadCatalog();
assert.ok(process.argv.slice(2).every(a => a === "--check"));
const template = readFileSync(new URL("review/editorial-template.html", root), "utf8").replaceAll("\r\n", "\n");
assert.equal(template.split("__CATALOG_JSON__").length, 2);
const payload = JSON.stringify(catalog).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const html = template.replace("__CATALOG_JSON__", () => payload);
const rows = subjects.map(([subject, name]) => {
  const q = catalog.questions.filter(q => q.subject === subject);
  const versions = [...new Set(q.map(q => q.version))].sort();
  return `| ${name} | ${q.length} | ${q.filter(q => q.difficulty === "medium").length} | ${q.filter(q => q.difficulty === "hard").length} | ${new Set(q.map(q => q.family)).size} | ${versions.join(", ")} |`;
});
const report = `# Conferência editorial atual — etapa 43

Catálogo de 500 questões autorais, preparado em 12/10/2026: 100 por matéria. Todas as cem anteriores foram reformuladas e receberam versão nova; quatrocentas foram acrescentadas. Todos os registros permanecem em rascunho, sem aprovação humana atribuída. Hash: \`${catalog.catalogHash}\`.

## Conteúdo e nível

Problemas com interpretação de dados, cálculos encadeados, comparação de informações, controle experimental, leitura crítica e análise de fontes. Dificuldades medium/hard estimadas pelo autor, sem calibração por desempenho; enunciado maior ou etiqueta de dificuldade não certificam nível de prova. Os conceitos permanecem no escopo escolar; revisão humana deve avaliar clareza, resposta única, distratores e exigência real de raciocínio.

| Matéria | Questões | Média estimada | Difícil estimada | Famílias/temas | Versões |
| --- | ---: | ---: | ---: | ---: | --- |
${rows.join("\n")}

Cem famílias/temas no total, com cinco tarefas ou variações por família. Português, Ciências, História e Geografia usam estímulos compartilhados para perguntas distintas; Matemática inclui variações parametrizadas de problemas. Não são quinhentos estímulos independentes, nem uma garantia de variedade infinita. Letras de resposta reorganizadas de forma reproduzível por ID.

## Referências e proveniência

Consultados os cadernos oficiais ETEC 2025/2026 disponibilizados pelo CPS e IFSP Integrado, edital 211/2025, tipo 2. As questões deste catálogo são autorais elaboradas com auxílio de IA; não se atribuem enunciados ou gabaritos à banca. Dados experimentais, textos de atividade e indicadores são fictícios. Referências oficiais indicadas na ferramenta servem ao estilo/competências, sem apresentar os exercícios como cópias de provas. Os PDFs oficiais e os limites de uso estão em [Conteúdo de provas](CONTEUDO-PROVAS-ETAPA-43.md).

Matemática/Português têm destino both. Ciências/História/Geografia têm destino etec: o caderno IFSP integrado consultado reúne Matemática e Português, não uma prova geral das cinco matérias.

## Revisão atual

Abrir \`out/revisao-editorial.html\` ou o pacote extraído \`out/revisao-editorial-meta-aprovacao-v3/revisao-editorial.html\`. Filtrar por matéria/tema/número, conferir respostas e exportar o JSON de anotações. O receptor da etapa 42 aceita somente o hash e as versões atuais; ausências continuam pendentes. Nenhuma marcação local publica questões ou modelos. As cinco revisões completas por matéria ficam em \`docs/revisao-atual/\`.

O ZIP e HTML v2 e a pasta já usada pelo amigo foram preservados. A nova ferramenta pode exportar separadamente as anotações v2 se encontrá-las nesse navegador/origem; não as transfere nem trata a conferência anterior como aprovação do conteúdo reformulado. Guarde o JSON e use o HTML antigo para consulta. O [relatório da etapa 41](CONFERENCIA-EDITORIAL-ETAPA-41.md) mantém o catálogo anterior.

Na aplicação, a seleção prioriza as questões menos apresentadas na conta, cruzando prática, simulados e diagnósticos salvos. Repetições são permitidas sem aviso específico conforme orientação do usuário; nunca ocorre duplicação de ID dentro de um mesmo simulado. Esta política não representa uma promessa de questões sempre inéditas.

Revisão humana das questões e dos seis modelos continua pendente. Nenhum conteúdo publicado ou venda liberada. Conferência técnica e carga controlada em [Etapa 43](CONTEUDO-PROVAS-ETAPA-43.md); condições comerciais em [Prontidão](PRONTIDAO-LANCAMENTO.md).
`;
mkdirSync(new URL("out/", root), { recursive: true });
for (const [relative, expected] of [["out/revisao-editorial.html", html], ["docs/CONFERENCIA-EDITORIAL.md", report]]) {
  const file = new URL(relative, root);
  if (process.argv.includes("--check")) assert.equal(readFileSync(file, "utf8").replaceAll("\r\n", "\n"), expected, relative);
  else writeFileSync(file, expected);
}
console.log(`${catalog.questions.length} questões na ferramenta atual; nenhuma aprovação ou publicação no banco.`);
