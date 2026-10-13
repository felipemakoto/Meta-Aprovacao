import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const migration = readFileSync(path.join(root, "supabase/migrations/20261012220000_study_selection_priority.sql"), "utf8");
const test = readFileSync(path.join(root, "supabase/tests/test_study_selection_priority.sql"), "utf8");
const file = path.join(root, "supabase/.temp/test-study-selection.sql");
const require = createRequire(import.meta.url);
const pkg = require.resolve("supabase/package.json");
const entry = path.resolve(path.dirname(pkg), require(pkg).bin.supabase);
try {
  writeFileSync(file, test.replace("set local statement_timeout='30s';", () => "set local statement_timeout='30s';\n" + migration));
  const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", "--file", file], { cwd: root, encoding: "utf8", timeout: 90000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) { console.error((result.stderr + "\n" + result.stdout).slice(0, 2500)); throw Error("Seleção não validada; transação sem COMMIT."); }
  console.log("Seleção validada: prioridade cruzada, repetição permitida, retry/retomada, filtros, snapshot e privilégios. Rollback concluído.");
} finally { unlinkSync(file); }
