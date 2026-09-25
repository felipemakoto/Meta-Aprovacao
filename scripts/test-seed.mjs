import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const packagePath = require.resolve("supabase/package.json");
const cliPackage = JSON.parse(readFileSync(packagePath, "utf8"));
const cliEntry = path.resolve(path.dirname(packagePath), cliPackage.bin.supabase);
const tempFile = path.join(root, "supabase/.temp/test-seed-transaction.sql");
const before = `begin;
set local statement_timeout = '15s';
do $$
begin
  if (select count(*) from public.questions
      where id in (select ('d1090000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,10) n)) <> 10 then
    raise exception 'Aplicar o seed antes deste teste';
  end if;
end $$;
-- Simula uma revisão editorial, visível apenas nesta transação.
update public.questions set topic = 'Revisão temporária', status = 'reviewed'
where id = 'd1090000-0000-4000-8000-000000000001';
update public.question_answers set explanation = 'Explicação revisada temporariamente para testar preservação.'
where question_id = 'd1090000-0000-4000-8000-000000000001';
do $$
begin
  perform set_config('stage9.snapshot', md5(
    coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q), '[]') ||
    coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a), '[]')
  ), true);
end $$;`;
const after = `do $$
declare after_hash text;
begin
  select md5(
    coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q), '[]') ||
    coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a), '[]')
  ) into after_hash;
  if after_hash <> current_setting('stage9.snapshot') then
    raise exception 'Seed duplicou dados ou alterou conteúdo/status/timestamps existentes';
  end if;
end $$;
select 'seed_repeat_preserves_all_rows' as check_name, true as passed;
rollback;`;

mkdirSync(path.dirname(tempFile), { recursive: true });
try {
  const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");
  writeFileSync(tempFile, [before, seed, seed, after].join("\n"));
  const result = spawnSync(process.execPath, [cliEntry, "db", "query", "--linked", "--file", tempFile], {
    cwd: root, stdio: "inherit", timeout: 60000, windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error("Teste do seed falhou; confira a mensagem da CLI.");
} finally {
  rmSync(tempFile, { force: true });
}
