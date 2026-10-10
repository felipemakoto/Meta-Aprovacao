import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const file = new URL("../../content/revisao-etapa-41.json", import.meta.url);
export const revision = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { schema: 1, changes: [] };
assert.equal(revision.schema, 1);
const versions = new Map();
for (const change of revision.changes) {
  assert.match(change.id, /^[a-f0-9-]{36}$/);
  assert.ok(!versions.has(change.id));
  assert.equal(change.before.version, 1);
  assert.equal(change.after.version, 2);
  assert.equal(change.before.status, "draft");
  assert.equal(change.after.status, "draft");
  versions.set(change.id, change.after.version);
}
export const contentVersion = id => versions.get(id) ?? 1;
export function editorialProjection(q) {
  const { subject, topic, difficulty, statement, options, correctAnswer, explanation, status, version, targetExam } = q;
  return { subject, topic, difficulty, statement, options, correctAnswer, explanation, status, version, targetExam };
}
