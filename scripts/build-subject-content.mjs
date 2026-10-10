// Etapa 39: gera apenas arquivos internos; não se conecta ao banco nem publica.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { contentVersion } from "./lib/content-versions.mjs";

const root = new URL("../", import.meta.url);
const definitions = [
  { subject: "ciencias", name: "Ciências", label: "C", questions: "d1390000", model: "d1391000", initial: "5 e 6" },
  { subject: "historia", name: "História", label: "H", questions: "d1392000", model: "d1393000", initial: "7 e 8" },
  { subject: "geografia", name: "Geografia", label: "G", questions: "d1394000", model: "d1395000", initial: "9 e 10" },
];
const sources = JSON.parse(readFileSync(new URL("content/referencias-etapa-39.json", root), "utf8"));
for (const s of Object.values(sources)) {
  assert.deepEqual(Object.keys(s).sort(), ["title", "url", "access"].sort());
  const url = new URL(s.url);
  assert.equal(url.protocol, "https:");
  assert.ok(["openstax.org", "usgs.gov", "nasa.gov", "gov.br", "leg.br", "ibge.gov.br", "legifrance.gouv.fr", "metmuseum.org"].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)));
  assert.ok(s.title.length > 0 && s.access.length > 0);
}
const letters = ["A", "B", "C", "D", "E"];
const statements = new Set(["matematica", "portugues"].flatMap(subject => JSON.parse(readFileSync(new URL(`content/${subject}-lote-1.json`, root), "utf8")).map(r => r.statement.trim())));
const quote = text => `'${text.replaceAll("'", "''")}'`;
const artifacts = [];
const sqlBatches = [];
for (const d of definitions) {
  const rows = JSON.parse(readFileSync(new URL(`content/${d.subject}-lote-1.json`, root), "utf8"));
  assert.equal(rows.length, 18);
  const ids = rows.map((_, i) => `${d.questions}-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
  const version = contentVersion(ids[0]);
  assert.ok(ids.every(id => contentVersion(id) === version));
  for (const r of rows) {
    assert.deepEqual(Object.keys(r).sort(), ["topic", "difficulty", "statement", "options", "correctAnswer", "explanation", "sourceKeys"].sort());
    for (const [key, max] of [["topic", 160], ["statement", 20000], ["explanation", 20000]]) assert.ok(typeof r[key] === "string" && r[key].trim().length > 0 && r[key].length <= max);
    assert.ok(["easy", "medium", "hard"].includes(r.difficulty));
    assert.ok(letters.includes(r.correctAnswer));
    assert.ok(Array.isArray(r.options) && r.options.length === 5 && r.options.every(o => typeof o === "string" && o.trim().length > 0 && o.length <= 4000));
    assert.equal(new Set(r.options.map(o => o.trim())).size, 5);
    assert.ok(Array.isArray(r.sourceKeys) && r.sourceKeys.every(key => Object.hasOwn(sources, key)));
    assert.equal(new Set(r.sourceKeys).size, r.sourceKeys.length);
    assert.ok(!statements.has(r.statement.trim()), "Enunciado duplicado entre lotes");
    statements.add(r.statement.trim());
  }
  const values = rows.map((r, i) => `  (${[ids[i], r.statement, ...r.options, r.topic, r.difficulty, r.correctAnswer, r.explanation].map(quote).join(", ")})`).join(",\n");
  const sql = `-- Etapa 39: ${d.name}; originais geradas com auxílio de IA, revisão humana pendente.
-- Gerado por scripts/build-subject-content.mjs. Uma instrução atômica por lote.
-- Fonte atual: revisão da etapa 41, versão ${version}; INSERT não atualiza linhas existentes.
-- Conflitos de ID preservam conteúdo/modelos/gabaritos; sem reparo silencioso.
with source_data (id, statement, option_a, option_b, option_c, option_d, option_e,
                  topic, difficulty, correct_answer, explanation) as (
  values
${values}
), inserted_model as (
  insert into private.simulations(id,title,question_count,subject,published,free_access)
  values('${d.model}-0000-4000-8000-000000000001',${quote(d.name)},20,${quote(d.subject)},false,false)
  on conflict(id) do nothing returning id
), inserted_questions as (
  insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,
                               subject,topic,difficulty,target_exam,status,version)
  select id::uuid,statement,option_a,option_b,option_c,option_d,option_e,
         ${quote(d.subject)},topic,difficulty,'both','draft',${version} from source_data
  on conflict(id) do nothing returning id
)
insert into public.question_answers(question_id,correct_answer,explanation)
select q.id,s.correct_answer,s.explanation
from inserted_questions q join source_data s on s.id::uuid=q.id;
`;
  sqlBatches.push(sql);
  artifacts.push([`supabase/content/${d.subject}-lote-1.sql`, sql]);
  const doc = `# Revisão de ${d.name} — etapa 39

18 questões originais geradas com auxílio de IA, complementando as duas do [lote inicial](REVISAO-SEED.md), entradas ${d.initial}. As iniciais correspondem a ${d.label}01/${d.label}02; as novas a ${d.label}03–${d.label}20. Fonte atual com ajustes da etapa 41: questões draft, versão ${version}, destino both. Manifesto antes/depois em content/revisao-etapa-41.json; o INSERT não aplica correções a linhas existentes. Modelo de vinte questões da matéria também em rascunho, sem acesso gratuito.

Material interno com gabaritos: não colocar em public nem servir como página do aluno. Fonte: content/${d.subject}-lote-1.json. Revisão humana, adequação pedagógica e dificuldade estimada ainda pendentes; não são questões oficiais, não certificam cobertura de edital ou variedade suficiente para vender estudo ilimitado.

## Conferência editorial

Confira clareza, única resposta correta, alternativas, explicação e nível adequado. Registre correções pelo número e identifique revisor/data antes da aprovação editorial. O assistente não registra revisão humana em nome do usuário; um pedido para continuar não publica conteúdo ou modelos.

Referências são apoio à conferência dos conceitos, não fontes de questões copiadas. O tipo de acesso consultado está indicado, inclusive quando foi limitado a trechos indexados. Sem referência externa listada, o exercício usa exemplos, cálculos ou conceitos básicos formulados para este lote; a ausência não comprova validação. Os cenários fictícios não são documentos históricos reais. Leis citadas em História são analisadas no contexto histórico indicado.

${rows.map((r, i) => `## ${d.label}${String(i + 3).padStart(2, "0")} — ${r.topic}

ID: ${ids[i]}. Dificuldade estimada: ${r.difficulty}.

${r.statement}

${r.options.map((o, j) => `- **${letters[j]})** ${o}`).join("\n")}

**Gabarito: ${r.correctAnswer}.** ${r.explanation}

${r.sourceKeys.length ? "Referências de apoio:\n\n" + r.sourceKeys.map(key => { const s = sources[key]; return `- [${s.title}](${s.url}) — ${s.access}.`; }).join("\n") : "Referência externa: não listada; conferir o exemplo/conceito na revisão."}

Revisão humana: pendente.
Revisor/data: não registrados.
Correções: não registradas.
`).join("\n")}`;
  artifacts.push([`docs/REVISAO-${d.subject.toUpperCase()}.md`, doc]);
}
artifacts.push(["supabase/content/etapa-39.sql", "-- Três lotes. Envolver em BEGIN/COMMIT para carga conjunta atômica.\n" + sqlBatches.join("\n")]);
assert.ok(process.argv.slice(2).every(a => a === "--check"));
for (const [relative, expected] of artifacts) {
  const url = new URL(relative, root);
  if (process.argv.includes("--check")) assert.equal(readFileSync(url, "utf8").replaceAll("\r\n", "\n"), expected, `${relative} diverge da fonte`);
  else writeFileSync(url, expected);
}
console.log("54 questões e 3 modelos em rascunho: artefatos sincronizados; revisão humana pendente.");
