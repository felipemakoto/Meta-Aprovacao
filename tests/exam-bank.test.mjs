import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadCatalog, root } from "../scripts/lib/editorial-content.mjs";
import { number } from "../scripts/content/bank-utils.mjs";
const catalog = loadCatalog();
const previous = JSON.parse(readFileSync(new URL("content/catalogo-etapa-42.json", root), "utf8"));
const approx = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, `${a} ≠ ${b}`);
test("500 rascunhos, todos os cem anteriores reformulados e versões preservadas no histórico", () => {
  assert.equal(catalog.questions.length, 500);
  assert.equal(new Set(catalog.questions.map(q => q.statement)).size, 500);
  assert.equal(new Set(catalog.questions.map(q => q.id)).size, 500);
  for (const old of previous.questions) {
    const q = catalog.questions.find(q => q.id === old.id);
    assert.ok(q);
    assert.notEqual(q.statement, old.statement);
    assert.equal(q.version, old.version + 1);
  }
  for (const subject of ["matematica", "portugues", "ciencias", "historia", "geografia"]) {
    const rows = catalog.questions.filter(q => q.subject === subject);
    assert.equal(rows.length, 100);
    assert.equal(new Set(rows.map(q => q.family)).size, 20);
    for (const q of rows) {
      assert.equal(q.status, "draft");
      assert.ok(["medium", "hard"].includes(q.difficulty));
      assert.equal(new Set(q.options).size, 5);
      assert.match(q.provenance, /Autoral/);
      assert.equal(q.targetExam, ["matematica", "portugues"].includes(subject) ? "both" : "etec");
    }
  }
});
test("cem gabaritos matemáticos satisfazem as relações originais; contagem e probabilidades por enumeração", () => {
  for (const q of catalog.questions.filter(q => q.subject === "matematica")) {
    const a = q.audit, r = a.result;
    assert.ok(q.options["ABCDE".indexOf(q.correctAnswer)].startsWith(number(r)));
    switch (a.kind) {
      case "fraction": approx((r - a.reserve) / 3, a.rest); break;
      case "successive": approx(r / a.start, 0.96); break;
      case "inverseDiscount": approx(r + a.initial + a.discount, a.price); approx(a.initial / a.price, 0.75); break;
      case "work": approx(r * a.newWorkers * a.newHours, a.workers * a.days * a.hours); break;
      case "tariff": approx(a.fixedA + 3 * r, a.fixedB + 5 * r); break;
      case "tickets": approx(r * a.full + (a.total - r) * a.reduced, a.income); break;
      case "average": approx((a.old * a.average + a.added * r) / (a.old + a.added), a.newAverage); break;
      case "weighted": approx(r * (a.n1 + a.n2), a.n1 * a.p1 + a.n2 * a.p2); break;
      case "probability": {
        let all = 0, red = 0;
        for (let i = 0; i < a.red + a.blue; i++) for (let j = 0; j < a.red + a.blue; j++) if (i !== j) { all++; if (i < a.red && j < a.red) red++; }
        approx(r / 100, red / all); break;
      }
      case "sets": approx(a.total - r, a.a + a.b - a.both); break;
      case "scale": approx(r / a.factor * 100000 / a.cm, a.scale); break;
      case "border": approx(r + (a.length - 2 * a.path) * (a.width - 2 * a.path), a.length * a.width); break;
      case "ramp": approx((r / 2) ** 2, a.rise ** 2 + a.run ** 2); break;
      case "shadow": approx(r / a.bigShadow, a.smallHeight / a.smallShadow); break;
      case "volume": approx(r * 1000 / a.frac, a.length * a.width * a.height); break;
      case "speed": approx(2 * a.d / r, a.d / a.v1 + a.d / a.v2); break;
      case "polygon": approx((180 - r) * a.sides, 360); break;
      case "combinations": {
        let count = 0;
        for (let i = 0; i < a.available; i++) for (let j = i + 1; j < a.available; j++) count++;
        assert.equal(r, count); break;
      }
      case "sequence": approx(r, Array.from({ length: a.days }, (_, i) => a.initial + i * a.growth).reduce((a, b) => a + b)); break;
      case "targetAverage": approx((a.samples * a.current + a.added * r) / (a.samples + a.added), a.target); break;
      default: assert.fail(`Oráculo ausente: ${q.label}`);
    }
  }
});
test("medidas críticas não confundem porcentagem relativa, pontos percentuais, massa e energia", () => {
  const answer = (family, variant) => {
    const q = catalog.questions.find(q => q.family === family && q.variant === variant);
    return q.options["ABCDE".indexOf(q.correctAnswer)];
  };
  assert.equal(answer("C1", 2), "240 cm³");
  assert.equal(answer("C3", 2), "252.000 J");
  assert.equal(answer("C3", 3), "108.000 J");
  assert.equal(answer("C5", 1), "30 °C");
  assert.equal(answer("C8", 3), "6,25%");
  assert.equal(answer("C9", 3), "47,6%");
  assert.equal(answer("G3", 1), "De 75% para 85%, aumento de 10 pontos percentuais.");
  assert.equal(answer("G12", 3), "62%");
  assert.equal(answer("G16", 2), "20h de terça-feira.");
  assert.equal(answer("G18", 3), "Aproximadamente 14,3%, apesar de não haver aumento de ocupados.");
});
