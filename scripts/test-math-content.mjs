// Banco vinculado: testa inserção/reexecução e reverte todas as fixtures.
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
const tempFile = path.join(root, "supabase/.temp/test-math-content.sql");
const seed = readFileSync(path.join(root, "supabase/content/matematica-lote-1.sql"), "utf8");
const batch = "select ('d1370000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,18) n";
const snapshot = `md5(coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q),'[]') || coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a),'[]'))`;
const sql = `begin;
set local statement_timeout = '15s';
${seed}
do $$ begin
 if (select count(*) from public.questions where id in (${batch})) <> 18 then raise exception 'Lote incompleto'; end if;
 if (select count(*) from public.questions where id in (${batch}) and subject='matematica' and target_exam='both' and version=${contentVersion("d1370000-0000-4000-8000-000000000001")} and status='draft') <> 18 then raise exception 'Metadados inesperados'; end if;
 if (select count(*) from public.question_answers where question_id in (${batch})) <> 18 then raise exception 'Gabaritos incompletos'; end if;
 if exists (select 1 from public.questions q where id in (${batch}) and (select count(distinct btrim(o)) from unnest(array[q.option_a,q.option_b,q.option_c,q.option_d,q.option_e]) o) <> 5) then raise exception 'Alternativas repetidas'; end if;
end $$;
-- Revisão simulada e um gabarito ausente não devem ser sobrescritos pelo seed.
update public.questions set topic='Revisão temporária',status='reviewed'
where id='d1370000-0000-4000-8000-000000000001';
update public.question_answers set correct_answer='A',explanation='Explicação temporária para testar preservação.'
where question_id='d1370000-0000-4000-8000-000000000001';
delete from public.question_answers where question_id='d1370000-0000-4000-8000-000000000002';
do $$ begin perform set_config('stage37.snapshot',${snapshot},true); end $$;
${seed}
${seed}
do $$ begin
 if ${snapshot} <> current_setting('stage37.snapshot') then raise exception 'Reexecução alterou dados existentes'; end if;
end $$;
select 'math_batch_complete_and_repeat_preserves_all_rows' as check_name,true as passed;
rollback;
`;
try {
  writeFileSync(tempFile, sql);
  const result = spawnSync(process.execPath, [cliEntry, "db", "query", "--linked", "--file", tempFile], { cwd: root, stdio: "inherit", timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error("Teste do lote falhou; confira a mensagem da CLI.");
} finally { rmSync(tempFile, { force: true }); }
