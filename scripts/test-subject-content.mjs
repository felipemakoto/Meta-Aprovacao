// Teste da etapa 39 em transação com rollback. Só executar em fase de rascunho.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { contentVersion } from "./lib/content-versions.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const packagePath = require.resolve("supabase/package.json");
const cli = JSON.parse(readFileSync(packagePath, "utf8"));
const cliEntry = path.resolve(path.dirname(packagePath), cli.bin.supabase);
const tempFile = path.join(root, "supabase/.temp/test-subject-content.sql");
const seed = readFileSync(path.join(root, "supabase/content/etapa-39.sql"), "utf8");
const definitions = [["ciencias", "d1390000", "d1391000"], ["historia", "d1392000", "d1393000"], ["geografia", "d1394000", "d1395000"]];
const snapshot = `md5(coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q),'[]')||coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a),'[]')||coalesce((select jsonb_agg(to_jsonb(s) order by id)::text from private.simulations s),'[]'))`;
const checks = definitions.map(([subject, q, s]) => {
  const ids = `select ('${q}-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,18)n`;
  return `do $$ begin
 if (select count(*) from public.questions where id in(${ids}) and subject='${subject}' and target_exam='both' and version=${contentVersion(q+"-0000-4000-8000-000000000001")} and status='draft')<>18 then raise exception 'Lote ${subject} incompleto ou fora de rascunho';end if;
 if (select count(*) from public.question_answers where question_id in(${ids}))<>18 then raise exception 'Gabaritos incompletos';end if;
 if exists(select 1 from public.questions q where id in(${ids}) and (select count(distinct btrim(o)) from unnest(array[q.option_a,q.option_b,q.option_c,q.option_d,q.option_e])o)<>5) then raise exception 'Alternativas repetidas';end if;
 if not exists(select 1 from private.simulations where id='${s}-0000-4000-8000-000000000001' and subject='${subject}' and question_count=20 and not published and not free_access) then raise exception 'Modelo inesperado';end if;
end $$;
-- Fixtures de revisão/incompletude somente nesta transação.
update public.questions set topic='Revisão temporária',status='reviewed' where id='${q}-0000-4000-8000-000000000001';
update public.question_answers set correct_answer='A',explanation='Explicação temporária para conferir preservação.' where question_id='${q}-0000-4000-8000-000000000001';
delete from public.question_answers where question_id='${q}-0000-4000-8000-000000000002';
update private.simulations set title='Revisão temporária do modelo' where id='${s}-0000-4000-8000-000000000001';`;
}).join("\n");
const sql = `begin;
set local statement_timeout='15s';
${seed}
${checks}
do $$ begin perform set_config('stage39.snapshot',${snapshot},true);end $$;
${seed}
${seed}
do $$ begin if ${snapshot}<>current_setting('stage39.snapshot') then raise exception 'Reexecução alterou registros existentes';end if;end $$;
select 'three_batches_complete_and_repeat_preserves_all_rows' as check_name,true as passed;
rollback;`;
try {
  writeFileSync(tempFile, sql);
  const result = spawnSync(process.execPath, [cliEntry, "db", "query", "--linked", "--file", tempFile], { cwd: root, stdio: "inherit", timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error("Teste dos lotes falhou; conferir mensagem da CLI.");
} finally { rmSync(tempFile, { force: true }); }
