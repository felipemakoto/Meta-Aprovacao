import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export const root = new URL("../../", import.meta.url);
export const subjects = [
  ["matematica", "Matemática", "M", "d1370000"],
  ["portugues", "Português", "P", "d1380000"],
  ["ciencias", "Ciências", "C", "d1390000"],
  ["historia", "História", "H", "d1392000"],
  ["geografia", "Geografia", "G", "d1394000"],
];
export const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function loadCatalog() {
  // O seed contém somente tuplas de literais; rejeitar qualquer outra forma.
  const seed = readFileSync(new URL("supabase/seed.sql", root), "utf8");
  const initial = [...seed.matchAll(/^  \(('(?:''|[^'])*'.*)\),?\r?$/gm)].map(match => {
    const values = [...match[1].matchAll(/'((?:''|[^'])*)'/g)].map(m => m[1].replaceAll("''", "'"));
    assert.equal(values.length, 12);
    assert.equal(values.map(v => `'${v.replaceAll("'", "''")}'`).join(", "), match[1]);
    const [id, statement, ...rest] = values;
    const [subject, topic, difficulty, correctAnswer, explanation] = rest.slice(5);
    return { id, subject, topic, difficulty, statement, options: rest.slice(0, 5), correctAnswer, explanation, references: [] };
  });
  assert.equal(initial.length, 10);
  const references = JSON.parse(readFileSync(new URL("content/referencias-etapa-39.json", root), "utf8"));
  const questions = subjects.flatMap(([subject, name, label, prefix]) => {
    const first = initial.filter(q => q.subject === subject);
    assert.equal(first.length, 2);
    const extra = JSON.parse(readFileSync(new URL(`content/${subject}-lote-1.json`, root), "utf8"));
    assert.equal(extra.length, 18);
    return [...first, ...extra.map((q, i) => ({ ...q, id: `${prefix}-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, references: (q.sourceKeys ?? []).map(k => {
      assert.ok(Object.hasOwn(references, k));
      return references[k];
    }) }))].map((q, i) => {
      const { sourceKeys: _sourceKeys, ...data } = q;
      void _sourceKeys;
      const row = { ...data, subject, subjectName: name, label: label + String(i + 1).padStart(2, "0"), status: "draft", version: 1, targetExam: "both" };
      assert.match(row.id, /^[a-f0-9-]{36}$/);
      assert.equal(row.options.length, 5);
      assert.equal(new Set(row.options).size, 5);
      assert.ok("ABCDE".includes(row.correctAnswer) && row.correctAnswer.length === 1);
      assert.ok(row.statement && row.explanation);
      return row;
    });
  });
  assert.equal(new Set(questions.map(q => q.id)).size, 100);
  assert.equal(new Set(questions.map(q => q.statement.trim())).size, 100);
  return { schema: 1, questions, catalogHash: hash(questions) };
}

export function summarize(catalog) {
  return subjects.map(([subject, name]) => {
    const rows = catalog.questions.filter(q => q.subject === subject);
    const extra = rows.slice(2);
    const letters = extra.map(q => q.correctAnswer).join("");
    const pattern = letters.slice(0, 5);
    return { name, count: rows.length, easy: rows.filter(q => q.difficulty === "easy").length,
      medium: rows.filter(q => q.difficulty === "medium").length, hard: rows.filter(q => q.difficulty === "hard").length,
      letters, pattern, repeats: extra.filter((q, i) => q.correctAnswer === pattern[i % 5]).length };
  });
}
