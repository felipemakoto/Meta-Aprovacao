// Ensaio transacional integral; fixtures e DDL temporários sempre revertidos.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, "content/revisao-etapa-43.json"), "utf8"));
const patch = readFileSync(path.join(root, "supabase/content/revisao-etapa-43.sql"), "utf8");
assert.equal(patch.split("do $stage43$").length, 2);
const fn = patch.replace("do $stage43$", "create function pg_temp.stage43_apply() returns void language plpgsql as $stage43$");
const quote = s => `'${s.replaceAll("'", "''")}'`;
const old = quote(JSON.stringify(manifest.changes)) + "::jsonb";
const newIds = manifest.additions.map(c => quote(c.id)).join(",");
const snapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(q) order by id)::text,'[]')) from public.questions q)||(select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a)`;
const protectedSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text,'[]')) from private.simulations s)||
 (select md5(coalesce(jsonb_agg(to_jsonb(p) order by id)::text,'[]')) from private.practice_attempts p)||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by id)::text,'[]')) from private.simulation_attempts a)`;
const qid = manifest.changes.at(-1).id;
const uid = "d1439000-0000-4000-8000-000000000001";
const aid = "d1439000-0000-4000-8000-000000000002";
const cases = [
  ["alteração editorial", `update public.questions set statement='Fixture modificada' where id='${qid}';`, "stage43_content_diverged"],
  ["revisada", `update public.questions set status='reviewed' where id='${qid}';`, "stage43_content_diverged"],
  ["publicada", `update public.questions set status='published' where id='${qid}';`, "stage43_content_diverged"],
  ["gabarito ausente", `delete from public.question_answers where question_id='${qid}';`, "stage43_content_diverged"],
  ["gabarito modificado", `update public.question_answers set correct_answer=case when correct_answer='A' then 'B' else 'A' end where question_id='${qid}';`, "stage43_content_diverged"],
  ["prática existente", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());insert into private.practice_attempts(user_id,question_id,snapshot) values('${uid}','${qid}','{}');`, "stage43_content_used"],
  ["simulado existente", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) select '${uid}',id,'Fixture','[{"id":"${qid}"}]' from private.simulations order by id limit 1;`, "stage43_content_used"],
  ["diagnóstico existente", `insert into public.guest_quiz_attempts(id,token_hash) values('${aid}',repeat('3',64));
   insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
   select '${aid}',1,q.id,q.version,q.subject,q.topic,q.statement,jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation from public.questions q join public.question_answers a on a.question_id=q.id where q.id='${qid}';`, "stage43_content_used"],
  ["conflito de ID novo", `insert into public.questions(id,subject,topic,difficulty,statement,option_a,option_b,option_c,option_d,option_e,target_exam,status,version)
   values('${manifest.additions[0].id}','matematica','Fixture','medium','Conflito de fixture','1','2','3','4','5','both','draft',1);`, "stage43_new_id_conflict"],
];
const guards = cases.map(([name, mutation, reason]) => `do $guard$ declare h text;begin h:=${snapshot};
 begin ${mutation} perform pg_temp.stage43_apply();raise exception 'guard_not_rejected';
 exception when others then if position('${reason}' in sqlerrm)=0 then raise;end if;end;
 if h<>(${snapshot}) then raise exception 'Fixture não revertida: ${name}';end if;
end $guard$;`).join("\n");
const reset = `delete from public.question_answers where question_id in(${newIds});delete from public.questions where id in(${newIds});
 update public.questions q set statement=c->'before'->>'statement',topic=c->'before'->>'topic',difficulty=c->'before'->>'difficulty',
 option_a=c->'before'->'options'->>0,option_b=c->'before'->'options'->>1,option_c=c->'before'->'options'->>2,option_d=c->'before'->'options'->>3,
 option_e=c->'before'->'options'->>4,target_exam=c->'before'->>'targetExam',status='draft',version=(c->'before'->>'version')::int
 from jsonb_array_elements(${old}) c where q.id=(c->>'id')::uuid;
 update public.question_answers a set correct_answer=c->'before'->>'correctAnswer',explanation=c->'before'->>'explanation'
 from jsonb_array_elements(${old}) c where a.question_id=(c->>'id')::uuid;`;
const sql = `begin;set local statement_timeout='30s';
${fn}
-- Primeiro validar o estado real; não substituir revisão divergente para montar fixture.
select pg_temp.stage43_apply();
${reset}
${guards}
do $positive$ declare h text;begin
 h:=${protectedSnapshot};perform pg_temp.stage43_apply();
 if h<>(${protectedSnapshot}) then raise exception 'Modelos ou tentativas alterados';end if;
 if (select count(*) from public.questions where status='draft')<>500 then raise exception 'Carga incompleta';end if;
 if exists(select subject from public.questions group by subject having count(*)<>100) then raise exception 'Distribuição incorreta';end if;
 h:=${snapshot};perform pg_temp.stage43_apply();perform pg_temp.stage43_apply();
 if h<>(${snapshot}) then raise exception 'Reexecução alterou registros ou timestamps';end if;
end $positive$;
select '500_drafts_nine_guards_repeatable' as check_name,true as passed;
rollback;`;
const require = createRequire(import.meta.url);
const pkg = require.resolve("supabase/package.json");
const entry = path.resolve(path.dirname(pkg), require(pkg).bin.supabase);
const file = path.join(root, "supabase/.temp/test-exam-bank.sql");
try {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", "--file", file], { cwd: root, encoding: "utf8", timeout: 90000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) { console.error((result.stderr || result.stdout).slice(0, 1500)); throw Error("Ensaio falhou; transação sem COMMIT."); }
  console.log("Ensaio SQL aprovado: 500 rascunhos, nove rejeições, reexecução sem alterações e preservação de modelos/tentativas. Rollback concluído.");
} finally { unlinkSync(file); }
