import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { loadCatalog, root } from "./lib/editorial-content.mjs";
import { editorialNotesReport, maxNotesBytes, parseEditorialNotes } from "./lib/editorial-notes.mjs";

try {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0].startsWith("--")) throw Error("Use npm.cmd run content:review:report -- caminho-do-arquivo.json");
  const source = args[0];
  let text;
  try {
    const stat = statSync(source);
    if (!stat.isFile() || stat.size > maxNotesBytes) throw Error();
    text = readFileSync(source, "utf8");
  } catch { throw Error("Não foi possível ler um arquivo de anotações de até 1,2 MB. Confira o caminho e o tamanho."); }
  const catalog = loadCatalog();
  const notes = parseEditorialNotes(text, catalog);
  const report = editorialNotesReport(notes, catalog);
  const folder = new URL("out/revisoes-recebidas/", root);
  const file = new URL(`revisao-${randomUUID()}.md`, folder);
  mkdirSync(folder, { recursive: true });
  writeFileSync(file, report, { flag: "wx" });
  console.log(`Relatório local criado: ${fileURLToPath(file)}`);
  console.log("Arquivo original preservado. Nenhuma anotação, aprovação ou publicação gravada no banco.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
