// Artefatos internos de revisão. Não publica nem se conecta ao banco.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { contentVersion } from "./lib/content-versions.mjs";

const root = new URL("../", import.meta.url);
const letters = ["A", "B", "C", "D", "E"];
const rows = JSON.parse(readFileSync(new URL("content/portugues-lote-1.json", root), "utf8"));
assert.equal(rows.length, 18);
const ids = rows.map((_, i) => `d1380000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`);
const version = contentVersion(ids[0]);
assert.ok(ids.every(id => contentVersion(id) === version));
for (const row of rows) {
  assert.deepEqual(Object.keys(row).sort(), ["topic", "difficulty", "statement", "options", "correctAnswer", "explanation"].sort());
  for (const [key, max] of [["topic", 160], ["statement", 20000], ["explanation", 20000]]) {
    assert.equal(typeof row[key], "string");
    assert.ok(row[key].trim().length > 0 && row[key].length <= max);
  }
  assert.ok(["easy", "medium", "hard"].includes(row.difficulty));
  assert.ok(letters.includes(row.correctAnswer));
  assert.equal(row.options.length, 5);
  assert.ok(row.options.every(o => typeof o === "string" && o.trim().length > 0 && o.length <= 4000));
  assert.equal(new Set(row.options.map(o => o.trim())).size, 5);
}
assert.equal(new Set(rows.map(r => r.statement.trim())).size, 18);
const quote = value => `'${value.replaceAll("'", "''")}'`;
const values = rows.map((r, i) => `  (${[ids[i], r.statement, ...r.options, r.topic, r.difficulty, r.correctAnswer, r.explanation].map(quote).join(", ")})`).join(",\n");
const sql = `-- Etapa 38: 18 questões originais de Português; geradas com auxílio de IA.
-- Revisão humana pendente. Gerado por scripts/build-portuguese-content.mjs.
-- Fonte atual: revisão da etapa 41, versão ${version}; INSERT não atualiza linhas existentes.
-- Apenas INSERT atômico em draft; reexecução preserva conteúdo, status e gabaritos.
-- Não reparar um gabarito de questão existente silenciosamente.
with source_data (id, statement, option_a, option_b, option_c, option_d, option_e,
                  topic, difficulty, correct_answer, explanation) as (
  values
${values}
), inserted_model as (
  insert into private.simulations (id,title,question_count,subject,published,free_access)
  values ('d1381000-0000-4000-8000-000000000001','Português',20,'portugues',false,false)
  on conflict (id) do nothing
  returning id
), inserted_questions as (
  insert into public.questions (id, statement, option_a, option_b, option_c, option_d, option_e,
                               subject, topic, difficulty, target_exam, status, version)
  select id::uuid, statement, option_a, option_b, option_c, option_d, option_e,
         'portugues', topic, difficulty, 'both', 'draft', ${version} from source_data
  on conflict (id) do nothing
  returning id
)
insert into public.question_answers (question_id, correct_answer, explanation)
select q.id, s.correct_answer, s.explanation
from inserted_questions q join source_data s on s.id::uuid = q.id;
`;
const doc = `# Revisão de Português — etapa 38

18 questões originais, geradas com auxílio de IA, para complementar as duas questões de Português do [lote inicial](REVISAO-SEED.md). Não são questões oficiais nem uma validação do programa de uma prova específica. Dificuldade estimada; adequação pedagógica e revisão humana pendentes.

Material interno com gabaritos. Fonte: content/portugues-lote-1.json; SQL: supabase/content/portugues-lote-1.sql. Não colocar estes arquivos em public nem servir como página do aluno. Fonte atual com ajustes da etapa 41: registros draft, versão ${version} e destino both. O manifesto antes/depois está em content/revisao-etapa-41.json; o INSERT não aplica correções a linhas existentes. O modelo de Português com vinte questões também permanece em rascunho.

## Como revisar

Para cada questão, confira enunciado, cinco alternativas, uma única resposta correta, sentido no contexto, explicação e nível adequado. Registre as correções pelo número/ID. A verificação técnica e uma solicitação para continuar não substituem aprovação editorial. Não editar registros publicados/usados sem preservar a versão anterior e os snapshots.

Com as duas questões anteriores, o lote reúne vinte questões de Português. Foi preparado um modelo de Português com vinte questões, em rascunho. A quantidade só permite usá-lo depois de aprovação e publicação explícitas das questões e do modelo. Não significa variedade suficiente para vender estudo ilimitado nem cobre simulados das outras matérias.

${rows.map((r, i) => `## P${String(i + 3).padStart(2, "0")} — ${r.topic}

ID: ${ids[i]}. Dificuldade estimada: ${r.difficulty}.

${r.statement}

${r.options.map((o, j) => `- **${letters[j]})** ${o}`).join("\n")}

**Gabarito: ${r.correctAnswer}.** ${r.explanation}

Revisão humana: pendente.
Revisor/data: não registrados.
Correções: não registradas.
`).join("\n")}`;
assert.ok(process.argv.slice(2).every(a => a === "--check"));
for (const [relative, expected] of [["supabase/content/portugues-lote-1.sql", sql], ["docs/REVISAO-PORTUGUES.md", doc]]) {
  const url = new URL(relative, root);
  if (process.argv.includes("--check")) assert.equal(readFileSync(url, "utf8").replaceAll("\r\n", "\n"), expected, `${relative} diverge da fonte`);
  else writeFileSync(fileURLToPath(url), expected);
}
console.log("18 questões validadas; SQL e revisão sincronizados. Aprovação humana pendente.");
