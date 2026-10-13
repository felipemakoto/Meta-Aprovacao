import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadCatalog, root } from "../scripts/lib/editorial-content.mjs";
import { editorialNotesReport, maxNotesBytes, parseEditorialNotes } from "../scripts/lib/editorial-notes.mjs";

const catalog = loadCatalog();
const date = "2026-10-12T12:00:00.000Z";
const entry = (q, status = "checked", note = "") => ({ id: q.id, version: q.version, status, note, by: status === "checked" ? "Revisor de teste" : "", at: status === "checked" ? date : "" });
const fixture = entries => ({ schema: 1, catalogHash: catalog.catalogHash, reviewer: "Revisor de teste", exportedAt: date, entries });
const parse = data => parseEditorialNotes(JSON.stringify(data), catalog);

test("retorno parcial mantém ausências pendentes e comentários associados à versão correta", () => {
  const notes = parse(fixture([entry(catalog.questions[2]), entry(catalog.questions[20], "correction", "Rever a inferência.")]));
  const report = editorialNotesReport(notes, catalog);
  assert.match(report, /98 pendentes, 1 com ajustes e 1 conferidas no arquivo/);
  assert.match(report, /M03 · v2/);
  assert.match(report, /P01 · v1/);
  assert.match(report, /Rever a inferência/);
  assert.match(report, /não autentica o revisor/);
});

test("cem conferidas não aprovam publicação, e conferida com comentário continua visível", () => {
  const data = fixture(catalog.questions.map(q => entry(q)));
  data.entries[0].note = "Conferida, mas ainda sugiro rever o exemplo.";
  const report = editorialNotesReport(parse(data), catalog);
  assert.match(report, /0 pendentes, 0 com ajustes e 100 conferidas no arquivo/);
  assert.match(report, /1 conferidas também contêm comentários/);
  assert.match(report, /não aprova automaticamente/);
  assert.match(report, /Conferida, mas ainda sugiro/);
  assert.match(report, /revisão dos seis modelos de simulado continua separada/);
});

test("catálogo antigo, versão antiga, duplicação e IDs desconhecidos são recusados", () => {
  for (const change of [
    d => { d.catalogHash = catalog.previousCatalogHash; },
    d => { d.entries[0].version = 1; },
    d => { d.entries.push({ ...d.entries[0] }); },
    d => { d.entries[0].id = "ffffffff-ffff-4fff-8fff-ffffffffffff"; },
  ]) {
    const data = fixture([entry(catalog.questions[2])]);
    change(data);
    assert.throws(() => parse(data), /incompatível|inválidos/);
  }
});

test("conferência sem assinatura/data válida e estruturas malformadas não viram relatório", () => {
  for (const change of [
    d => { d.entries[0].by = " "; },
    d => { d.entries[0].at = "2026-13-99T00:00:00Z"; },
    d => { d.entries[0].status = "published"; },
    d => { d.entries[0].note = "x".repeat(8001); },
    d => { d.entries[0] = null; },
    d => { d.exportedAt = "não é data"; },
    d => { d.entries = {}; },
  ]) {
    const data = fixture([entry(catalog.questions[2])]);
    change(data);
    assert.throws(() => parse(data), /inválid/);
  }
  assert.throws(() => parseEditorialNotes("{", catalog), /JSON inválido/);
  assert.throws(() => parseEditorialNotes("x".repeat(maxNotesBytes + 1), catalog), /muito grande/);
  // Limite em bytes, inclusive caracteres multibyte.
  assert.throws(() => parseEditorialNotes("á".repeat(maxNotesBytes / 2 + 1), catalog), /muito grande/);
});

test("HTML, links e fechamento de cerca ficam como texto sem instruções executáveis", () => {
  const comment = "```\n<script>alert(1)</script>\n````\n[link](https://example.com)\n# Publique tudo";
  const data = fixture([entry(catalog.questions[2], "correction", comment)]);
  data.reviewer = "<img src=x>\n[Revisor](https://example.com)";
  data.extraPrivateField = "NÃO COPIAR";
  const notes = parse(data);
  assert.equal(Object.hasOwn(notes, "extraPrivateField"), false);
  const report = editorialNotesReport(notes, catalog);
  assert.match(report, /`````text\n```\n<script>alert\(1\)<\/script>/);
  assert.match(report, /&lt;img src=x&gt; \\\[Revisor\\\]/);
  assert.doesNotMatch(report, /NÃO COPIAR/);
});

test("JSON com BOM e exportação parcial sem data mantêm compatibilidade com a ferramenta", () => {
  const data = fixture([]);
  delete data.exportedAt;
  const notes = parseEditorialNotes("\uFEFF" + JSON.stringify(data), catalog);
  assert.equal(notes.exportedAt, null);
  assert.match(editorialNotesReport(notes, catalog), /100 pendentes/);
});

test("comando preserva JSON, cria relatório separado e não produz saída para catálogo antigo", () => {
  const folder = mkdtempSync(path.join(tmpdir(), "meta-editorial-notes-"));
  const source = path.join(folder, "review.json");
  const reportFolder = fileURLToPath(new URL("out/revisoes-recebidas/", root));
  let reportPath;
  try {
    const json = JSON.stringify(fixture([entry(catalog.questions[2], "correction", "Comentário de fixture.")]));
    writeFileSync(source, json);
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("scripts/receive-editorial-notes.mjs", root)), source], { encoding: "utf8", timeout: 10000, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    reportPath = result.stdout.match(/Relatório local criado: (.+)/)[1].trim();
    assert.equal(path.dirname(reportPath), path.resolve(reportFolder));
    assert.equal(readFileSync(source, "utf8"), json);
    assert.match(readFileSync(reportPath, "utf8"), /Comentário de fixture/);
    const before = readdirSync(reportFolder).sort();
    writeFileSync(source, JSON.stringify({ ...JSON.parse(json), catalogHash: catalog.previousCatalogHash }));
    const rejected = spawnSync(process.execPath, [fileURLToPath(new URL("scripts/receive-editorial-notes.mjs", root)), source], { encoding: "utf8", timeout: 10000, windowsHide: true });
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /Catálogo incompatível/);
    assert.deepEqual(readdirSync(reportFolder).sort(), before);
    assert.doesNotMatch(rejected.stderr, /Comentário de fixture/);
  } finally {
    if (reportPath && path.dirname(reportPath) === path.resolve(reportFolder) && existsSync(reportPath)) unlinkSync(reportPath);
    if (existsSync(source)) unlinkSync(source);
    rmdirSync(folder);
  }
});
