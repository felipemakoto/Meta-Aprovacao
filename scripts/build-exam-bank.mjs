// Fonte editorial reproduzível. Gera arquivos; não acessa rede ou banco.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mathematics } from "./content/mathematics.mjs";
import { portuguese } from "./content/portuguese.mjs";
import { sciences } from "./content/sciences.mjs";
import { history } from "./content/history.mjs";
import { geography } from "./content/geography.mjs";
import { editorialProjection } from "./lib/content-versions.mjs";

const root = new URL("../", import.meta.url);
const before = JSON.parse(readFileSync(new URL("content/catalogo-etapa-42.json", root), "utf8"));
assert.equal(before.questions.length, 100);
const refs = {
  etec2026: { title: "CPS — caderno oficial ETEC, 1º semestre de 2026", url: "https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2025/12/A-CADERNO-VESTIBULINHO-1-SEM2026.pdf", access: "Caderno consultado como referência de competências e estilo; este exercício é autoral, não transcrito" },
  etec2025: { title: "CPS — caderno oficial ETEC, 1º semestre de 2025", url: "https://bkpsitecpsnew.blob.core.windows.net/uploadsitecps/sites/1/2024/12/A-CADERNO-VESTIBULINHO.pdf", access: "Caderno consultado como referência de contextualização; este exercício é autoral, não transcrito" },
  ifsp2026: { title: "IFSP — integrado, edital 211/2025, caderno tipo 2", url: "https://concurso1.fundacaocefetminas.org.br/documentos/CadernodeProvaTIPO2Integrado122639008143044863492.pdf", access: "Caderno consultado como referência para Matemática e Português; este exercício é autoral, não transcrito" },
  abolition: { title: "Planalto — Lei 3.353 de 1888, contexto histórico", url: "https://www.planalto.gov.br/ccivil_03/leis/lim/lim3353.htm", access: "Texto consultado para conferência do marco legal histórico" },
  empire: { title: "Planalto — Constituição do Império de 1824", url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao24.htm", access: "Texto consultado para conferência de instituições e cidadania no contexto histórico" },
};
const definitions = [["matematica", "Matemática", "M", mathematics], ["portugues", "Português", "P", portuguese], ["ciencias", "Ciências", "C", sciences], ["historia", "História", "H", history], ["geografia", "Geografia", "G", geography]];
const questions = definitions.flatMap(([subject, subjectName, label, build], subjectIndex) => {
  const old = before.questions.filter(q => q.subject === subject);
  const rows = build();
  assert.equal(rows.length, 100);
  assert.equal(new Set(rows.map(q => q.family)).size, 20);
  return rows.map((row, i) => {
    const previous = old[i];
    const id = previous?.id ?? `d143${subjectIndex}000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const order = [0, 1, 2, 3, 4].sort((a, b) => createHash("sha256").update(`${id}:${a}:43`).digest("hex").localeCompare(createHash("sha256").update(`${id}:${b}:43`).digest("hex")));
    const references = [refs.etec2026, refs.etec2025];
    if (subjectIndex < 2) references.push(refs.ifsp2026);
    if (row.family === "H15") references.push(refs.empire);
    if (row.family === "H16") references.push(refs.abolition);
    const q = { id, subject, subjectName, label: label + String(i + 1).padStart(2, "0"),
      topic: row.topic, difficulty: row.difficulty, statement: row.statement, options: order.map(j => row.options[j]),
      correctAnswer: "ABCDE"[order.indexOf(0)], explanation: row.explanation,
      status: "draft", version: previous ? previous.version + 1 : 1, targetExam: subjectIndex < 2 ? "both" : "etec",
      references, provenance: "Autoral, elaborado com auxílio de IA; dados e textos de atividade fictícios; revisão humana pendente",
      family: row.family, variant: row.variant,
    };
    if (row.audit) q.audit = row.audit;
    assert.ok(["medium", "hard"].includes(q.difficulty));
    assert.ok(q.statement.length <= 20000 && q.explanation.length <= 20000 && q.topic.length <= 160);
    assert.equal(new Set(q.options.map(s => s.trim())).size, 5);
    assert.ok(q.options.every(s => s.length > 0 && s.length <= 4000));
    if (previous) assert.notEqual(q.statement, previous.statement, `Questão não reformulada: ${q.label}`);
    return q;
  });
});
assert.equal(questions.length, 500);
assert.equal(new Set(questions.map(q => q.id)).size, 500);
assert.equal(new Set(questions.map(q => q.statement.trim())).size, 500);
const oldById = new Map(before.questions.map(q => [q.id, q]));
const changes = questions.filter(q => oldById.has(q.id)).map(q => ({ id: q.id, label: q.label, before: editorialProjection(oldById.get(q.id)), after: editorialProjection(q) }));
assert.equal(changes.length, 100);
const additions = questions.filter(q => !oldById.has(q.id)).map(q => ({ id: q.id, label: q.label, after: editorialProjection(q) }));
assert.equal(additions.length, 400);
const catalogHash = createHash("sha256").update(JSON.stringify(questions)).digest("hex");
const catalog = { schema: 1, generatedOn: "2026-10-12", questions, catalogHash, previousCatalogHash: before.catalogHash,
  previousVersions: Object.fromEntries(before.questions.map(q => [q.id, q.version])) };
const revision = { schema: 1, date: "2026-10-12", previousCatalogHash: before.catalogHash, catalogHash, changes, additions };
const artifacts = [["content/banco-etec-if.json", JSON.stringify(catalog, null, 2) + "\n"], ["content/revisao-etapa-43.json", JSON.stringify(revision, null, 2) + "\n"]];
for (const [subject, name] of definitions) {
  const rows = questions.filter(q => q.subject === subject);
  const review = `# Revisão atual — ${name} — etapa 43\n\nCem questões autorais, níveis medium/hard estimados. Referências oficiais orientam competências e estilo; não são questões oficiais copiadas. Dados, textos e situações de atividade são fictícios. Classificação de dificuldade não é calibração por desempenho. Nenhuma aprovação humana ou publicação atribuída.\n\n${rows.map(q => `## ${q.label} — ${q.topic}\n\nID: ${q.id}. Versão: ${q.version}. Dificuldade estimada: ${q.difficulty}. Família: ${q.family}.\n\n${q.statement}\n\n${q.options.map((o, i) => `- **${"ABCDE"[i]})** ${o}`).join("\n")}\n\n**Gabarito: ${q.correctAnswer}.** ${q.explanation}\n\nRevisor/data: pendentes.\n`).join("\n")}`;
  artifacts.push([`docs/revisao-atual/REVISAO-${subject.toUpperCase()}.md`, review]);
}
assert.ok(process.argv.slice(2).every(arg => arg === "--check"));
for (const [relative, expected] of artifacts) {
  const url = new URL(relative, root);
  if (process.argv.includes("--check")) assert.equal(readFileSync(url, "utf8").replaceAll("\r\n", "\n"), expected, relative);
  else { mkdirSync(new URL("./", url), { recursive: true }); writeFileSync(url, expected); }
}
console.log("500 questões preparadas: 100 reformuladas e 400 novas; nenhuma carga ou publicação executada.");
