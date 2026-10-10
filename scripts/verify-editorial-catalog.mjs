// Consulta somente conteúdo: nunca seleciona pessoas, credenciais ou pagamentos.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadCatalog, root } from "./lib/editorial-content.mjs";

const catalog = loadCatalog();
const require = createRequire(import.meta.url);
const cliPackagePath = require.resolve("supabase/package.json");
const cli = require(cliPackagePath);
const entry = path.resolve(path.dirname(cliPackagePath), cli.bin.supabase);
const ids = catalog.questions.map(q => `'${q.id}'`).join(",");
const sql = `select q.id,q.statement,q.subject,q.topic,q.difficulty,q.status,q.version,q.target_exam,
q.option_a,q.option_b,q.option_c,q.option_d,q.option_e,a.correct_answer,a.explanation
from public.questions q left join public.question_answers a on a.question_id=q.id where q.id in (${ids}) order by q.id;`;
const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", sql, "-o", "json"], { cwd: fileURLToPath(root), encoding: "utf8", timeout: 60000, windowsHide: true, maxBuffer: 1024 * 1024 });
assert.ok(!result.error && result.status === 0, "Consulta falhou; nenhuma atualização efetuada.");
// Não imprimir o retorno da CLI; inclui gabaritos internos.
const start = result.stdout.indexOf("{");
const end = result.stdout.lastIndexOf("}");
const rows = JSON.parse(result.stdout.slice(start, end + 1)).rows;
assert.equal(rows.length, 100);
for (const q of catalog.questions) {
  const row = rows.find(r => r.id === q.id);
  assert.ok(row, `Questão ausente: ${q.label}`);
  const { id, statement, subject, topic, difficulty, status, version, targetExam: target_exam, correctAnswer: correct_answer, explanation, options } = q;
  assert.deepEqual(row, { id, statement, subject, topic, difficulty, status, version, target_exam, correct_answer, explanation,
    option_a: options[0], option_b: options[1], option_c: options[2], option_d: options[3], option_e: options[4] }, `Catálogo desatualizado: ${q.label}; regenerar/corrigir explicitamente, sem sobrescrever o banco.`);
}
console.log("Cem questões/gabaritos sincronizados com o banco, todas draft, nas versões editoriais esperadas; consulta somente leitura.");
