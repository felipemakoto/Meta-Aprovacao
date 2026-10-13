import assert from "node:assert/strict";
export const number = n => {
  assert.ok(Number.isFinite(n));
  return Number(n.toFixed(4)).toLocaleString("pt-BR", { maximumFractionDigits: 4 });
};
export const money = n => `R$ ${n.toFixed(2).replace(".", ",")}`;
export function wrongNumbers(answer, candidates) {
  const values = [...candidates, answer + 1, answer - 1, answer + 2, answer - 2, answer * 2, answer / 2];
  const seen = new Set([number(answer)]);
  return values.filter(n => Number.isFinite(n) && !seen.has(number(n)) && (seen.add(number(n)), true)).slice(0, 4);
}
export function question(topic, statement, answer, distractors, explanation, difficulty = "hard") {
  const options = [answer, ...distractors];
  assert.equal(options.length, 5);
  assert.equal(new Set(options).size, 5, topic + ": alternativas iguais");
  assert.ok(statement.length > 90 && explanation.length > 50, topic);
  return { topic, statement, options, correctAnswer: "A", explanation, difficulty };
}
export function numeric(topic, statement, answer, wrong, explanation, suffix = "", difficulty = "hard") {
  return question(topic, statement, number(answer) + suffix, wrong.map(n => number(n) + suffix), explanation, difficulty);
}
export function block(topic, passage, tasks) {
  assert.equal(tasks.length, 5, topic);
  return tasks.map(([prompt, answer, wrong, why, level]) => question(topic, `${passage}\n\n${prompt}`, answer, wrong, why, level ?? "hard"));
}
