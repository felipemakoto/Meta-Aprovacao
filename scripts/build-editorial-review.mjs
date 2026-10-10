// Artefato local de revisão; sem publicação, gravação no banco ou aprovação.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { loadCatalog, root, summarize } from "./lib/editorial-content.mjs";

assert.ok(process.argv.slice(2).every(a => a === "--check"));
const catalog = loadCatalog();
const template = readFileSync(new URL("review/editorial-template.html", root), "utf8").replaceAll("\r\n", "\n");
assert.equal(template.split("__CATALOG_JSON__").length, 2);
// JSON embutido não pode encerrar script, mesmo com texto malicioso.
const payload = JSON.stringify(catalog).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const html = template.replace("__CATALOG_JSON__", () => payload);
const report = `# Conferência editorial atual — etapa 41

Catálogo corrigido em 10/10/2026: cem questões originais auxiliadas por IA, todas em rascunho, sem revisão humana atribuída. Noventa adicionais na versão 2 e dez do lote inicial preservadas na versão 1. Hash do catálogo: \`${catalog.catalogHash}\`.

## Ajustes realizados

Alternativas das noventa questões adicionais reorganizadas por permutação independente e reproduzível por ID, com atualização da letra correta. P04 reformulada para pedir uma inferência provável a partir das pistas do texto. Alternativas incorretas de C16, C19 e H09 substituídas por opções mais próximas do tema; H09 também ganhou explicação cronológica e referências de apoio. Esses ajustes do assistente continuam sujeitos à revisão humana.

O [relatório da etapa 40](CONFERENCIA-EDITORIAL-ETAPA-40.md) preserva os apontamentos e a identificação do catálogo anterior. Detalhes, manifesto antes/depois e ensaio do banco em [CORRECOES-ETAPA-41.md](CORRECOES-ETAPA-41.md).

## Conferência estrutural

Cem IDs e enunciados distintos, cinco alternativas distintas e gabarito/explicação em cada questão. Consulta somente leitura confirmou correspondência com o banco. As letras abaixo seguem a ordem dos documentos, não a ordem de apresentação de uma tentativa.

| Matéria | Questões | Fácil estimada | Média estimada | Difícil estimada | Letras do lote 03–20 | Coincidências com repetição do bloco inicial de 5 |
| --- | ---: | ---: | ---: | ---: | --- | --- |
${summarize(catalog).map(s => `| ${s.name} | ${s.count} | ${s.easy} | ${s.medium} | ${s.hard} | ${s.letters} | ${s.repeats}/18 |`).join("\n")}

Os lotes não repetem mais o ciclo de cinco letras da versão anterior, e as sequências das matérias são distintas. Esta conferência não certifica dificuldade, cobertura de edital, equilíbrio psicométrico ou qualidade pedagógica. Não há questões classificadas como difíceis; as demais classificações ainda são estimativas.

## Revisão prática

Gerar com \`npm.cmd run content:review:build\` e abrir \`out/revisao-editorial.html\`. Filtre por matéria, número ou marcação, abra o gabarito, registre ajustes e exporte as anotações. O arquivo funciona localmente; marcação de conferência exige nome do revisor e não publica conteúdo. Editar a nota desfaz essa marcação. As referências têm seus tipos/limitações de acesso indicados nos documentos por matéria e na ferramenta.

As anotações ficam no armazenamento desse navegador, quando disponível. Exportar o JSON mantém uma cópia durável. A importação exige o mesmo catálogo; anotações anteriores não são transferidas nem aprovadas automaticamente para questões corrigidas. Quando encontra anotações do catálogo anterior nesse navegador/origem, a ferramenta oferece exportação separada. Caso contrário, use o HTML anterior e o JSON já exportado. O ZIP anterior e \`out/revisao-editorial-v1.html\` foram preservados para consultar a revisão antiga. Pacote atualizado: \`out/revisao-editorial-meta-aprovacao-v2.zip\`. Não colocar HTML/anotações em public; contém gabaritos e identificação do revisor.

Próximo passo: revisão humana identificada de todas as questões e dos seis modelos. Ainda há pouca variedade por matéria; a quantidade não valida uma promessa de estudo ilimitado. Nenhum modelo/conteúdo publicado ou venda liberada. Demais condições em [PRONTIDAO-LANCAMENTO.md](PRONTIDAO-LANCAMENTO.md).
`;
mkdirSync(new URL("out/", root), { recursive: true });
for (const [relative, expected] of [["out/revisao-editorial.html", html], ["docs/CONFERENCIA-EDITORIAL.md", report]]) {
  const file = new URL(relative, root);
  if (process.argv.includes("--check")) assert.equal(readFileSync(file, "utf8").replaceAll("\r\n", "\n"), expected, `${relative} divergente`);
  else writeFileSync(file, expected);
}
console.log("Revisão local das cem questões atualizada; nenhuma aprovação ou publicação no banco.");
