// Ensaio da publicação editorial: toda mutação permanece dentro de ROLLBACK.
// Não consulta a Cakto, não concede Premium e não altera privilégios.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { delta } from "./lib/editorial-patch.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, "content/revisao-etapa-47.json"), "utf8"));
const patch = readFileSync(path.join(root, "supabase/content/publicacao-etapa-47.sql"), "utf8");
assert.equal(manifest.changes.length, 500);
assert.equal(new Set(manifest.changes.map(c => c.id)).size, 500);
assert.equal(manifest.models.length, 6);
assert.equal(new Set(manifest.models.map(m => m.id)).size, 6);
for (const c of manifest.changes) {
  assert.equal(c.before.status, "draft");
  assert.equal(c.after.status, "published");
  assert.ok(c.after.version === c.before.version || c.after.version === c.before.version + 1);
}
for (const m of manifest.models) {
  assert.equal(m.before.id, m.id);
  assert.equal(m.after.id, m.id);
  assert.equal(m.before.published, false);
  assert.equal(m.after.published, true);
  assert.deepEqual({ ...m.before, published: true }, m.after);
}
const quick = manifest.models.filter(m => m.after.free_access);
assert.equal(quick.length, 1);
assert.equal(quick[0].after.question_count, 10);
assert.equal(quick[0].after.subject, null);
const subjectModels = manifest.models.filter(m => !m.after.free_access);
assert.equal(subjectModels.length, 5);
assert.deepEqual(subjectModels.map(m => m.after.subject).sort(), ["ciencias", "geografia", "historia", "matematica", "portugues"]);
assert.ok(subjectModels.every(m => m.after.question_count === 20));
assert.equal(patch.split("do $stage47$").length, 2);
assert.ok(!/\bcommit\s*;/i.test(patch));
const fn = patch.replace("do $stage47$", "create function pg_temp.stage47_apply() returns void language plpgsql as $stage47$");
const quote = s => `'${String(s).replaceAll("'", "''")}'`;
const json = value => quote(JSON.stringify(value)) + "::jsonb";
const changedIds = manifest.changes.map(c => quote(c.id)).join(",");
const modelIds = manifest.models.map(m => quote(m.id)).join(",");
const reverse = json(manifest.changes.map(c => ({ id: c.id, patch: delta(c, "before") })));

const contentSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(q) order by id)::text,'[]')) from public.questions q) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a)`;
const modelSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text,'[]')) from private.simulations s)`;
const attemptSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(p) order by id)::text,'[]')) from private.practice_attempts p) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by id)::text,'[]')) from private.simulation_attempts a) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by id)::text,'[]')) from public.guest_quiz_attempts a) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(q) order by attempt_id,position)::text,'[]')) from private.guest_quiz_questions q)`;
const protectedSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(q) order by id)::text,'[]')) from public.questions q where id not in (${changedIds})) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a where question_id not in (${changedIds})) ||
 (select md5(coalesce(jsonb_agg(case when id in (${modelIds}) then to_jsonb(s)-'published' else to_jsonb(s) end order by id)::text,'[]')) from private.simulations s) ||
 ${attemptSnapshot}`;
const wholeSnapshot = `${contentSnapshot} || ${modelSnapshot} || ${attemptSnapshot}`;
const qid = manifest.changes.at(-1).id;
const mid = subjectModels.at(-1).id;
const guardUser = randomUUID();
const guardAttempt = randomUUID();
// Uma questão published exatamente igual ao estado after é válida. O antigo
// caso de rejeição desse estado é substituído por ausência da questão.
const cases = [
  ["editorial_divergence", `update public.questions set statement='Fixture modificada' where id='${qid}';`, "stage47_content_diverged"],
  ["reviewed_state", `update public.questions set status='reviewed' where id='${qid}';`, "stage47_content_diverged"],
  ["missing_question", `delete from public.question_answers where question_id='${qid}'; delete from public.questions where id='${qid}';`, "stage47_content_diverged"],
  ["missing_answer", `delete from public.question_answers where question_id='${qid}';`, "stage47_content_diverged"],
  ["answer_divergence", `update public.question_answers set correct_answer=case when correct_answer='A' then 'B' else 'A' end where question_id='${qid}';`, "stage47_content_diverged"],
  ["practice_used", `insert into auth.users(id,email_confirmed_at) values('${guardUser}',now()); insert into private.practice_attempts(user_id,question_id,snapshot) values('${guardUser}','${qid}','{}');`, "stage47_content_used"],
  ["simulation_used", `insert into auth.users(id,email_confirmed_at) values('${guardUser}',now()); insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) values('${guardUser}','${mid}','Fixture','[{"id":"${qid}"}]');`, "stage47_content_used"],
  ["diagnostic_used", `insert into public.guest_quiz_attempts(id,token_hash) values('${guardAttempt}',repeat('3',64));
   insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
   select '${guardAttempt}',1,q.id,q.version,q.subject,q.topic,q.statement,jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation from public.questions q join public.question_answers a on a.question_id=q.id where q.id='${qid}';`, "stage47_content_used"],
  ["version_divergence", `update public.questions set version=version+9 where id='${qid}';`, "stage47_content_diverged"],
  ["missing_model", `delete from private.simulation_attempts where simulation_id='${mid}'; delete from private.simulations where id='${mid}';`, "stage47_model_diverged"],
  ["model_configuration", `update private.simulations set question_count=question_count+1 where id='${mid}';`, "stage47_model_diverged"],
];
const guards = cases.map(([name, mutation, reason]) => `do $guard$ declare h text; begin h := ${wholeSnapshot};
 begin ${mutation} perform pg_temp.stage47_apply(); raise exception 'release_test_guard_not_rejected_${name}';
 exception when others then if position('${reason}' in sqlerrm)=0 then raise; end if; end;
 if h <> (${wholeSnapshot}) then raise exception 'release_test_guard_rollback_${name}'; end if;
end $guard$;`).join("\n");
const reset = `create temporary table release_reset as select value as c from jsonb_array_elements(${reverse});
 update public.questions q set subject=coalesce(c->'patch'->>'subject',subject),statement=coalesce(c->'patch'->>'statement',statement),
 topic=coalesce(c->'patch'->>'topic',topic),difficulty=coalesce(c->'patch'->>'difficulty',difficulty),
 option_a=coalesce(c->'patch'->'options'->>0,option_a),option_b=coalesce(c->'patch'->'options'->>1,option_b),
 option_c=coalesce(c->'patch'->'options'->>2,option_c),option_d=coalesce(c->'patch'->'options'->>3,option_d),option_e=coalesce(c->'patch'->'options'->>4,option_e),
 target_exam=coalesce(c->'patch'->>'targetExam',target_exam),status=coalesce(c->'patch'->>'status',status),version=coalesce((c->'patch'->>'version')::int,version)
 from release_reset where q.id=(c->>'id')::uuid;
 update public.question_answers a set correct_answer=coalesce(c->'patch'->>'correctAnswer',correct_answer),explanation=coalesce(c->'patch'->>'explanation',explanation)
 from release_reset where a.question_id=(c->>'id')::uuid;
 update private.simulations set published=false where id in (${modelIds});`;

const freeUser = randomUUID();
const internalUser = randomUUID();
const requestId = randomUUID();
const expectedModels = json(subjectModels.map(m => ({ id: m.id, subject: m.after.subject })));
const smoke = `do $smoke$
declare free_user uuid:='${freeUser}'; internal_user uuid:='${internalUser}'; model jsonb;
 state jsonb; resumed jsonb; result jsonb; answers jsonb; usage jsonb; catalog jsonb;
 first_q jsonb; next_q jsonb; feedback jsonb; expected_answer text; i int; denied boolean; h text;
begin
 insert into auth.users(id,email_confirmed_at) values(free_user,now()),(internal_user,now());
 usage:=public.read_daily_limits(free_user);
 if (usage->>'hasPremium')::boolean or usage->'accessUntil'<>'null'::jsonb or
 usage->'practice'->>'remaining'<>'10' or usage->'simulations'->>'remaining'<>'1' then raise exception 'release_test_initial_free_limits'; end if;
 catalog:=public.simulation_catalog(free_user);
 if jsonb_array_length(catalog)<>1 or catalog->0->>'id'<>'${quick[0].id}' then raise exception 'release_test_free_catalog'; end if;
 for model in select value from jsonb_array_elements(${expectedModels}) loop
  denied:=false; begin perform public.start_simulation(free_user,(model->>'id')::uuid);
  exception when others then if sqlerrm<>'simulation_unavailable' then raise; end if; denied:=true; end;
  if not denied then raise exception 'release_test_free_premium_denial'; end if;
 end loop;
 state:=public.start_simulation(free_user,'${quick[0].id}');
 if jsonb_array_length(state->'quiz'->'questions')<>10 or state->'quiz'->>'questionCount'<>'10' then raise exception 'release_test_quick_count'; end if;
 if (select count(distinct x->>'subject') from jsonb_array_elements(state->'quiz'->'questions') x)<>5 or
 exists(select 1 from jsonb_array_elements(state->'quiz'->'questions') x group by x->>'subject' having count(*)<>2) then raise exception 'release_test_quick_balance'; end if;
 if (select count(distinct x->>'id') from jsonb_array_elements(state->'quiz'->'questions') x)<>10 or
 exists(select 1 from jsonb_array_elements(state->'quiz'->'questions') x where x ? 'correctAnswer' or x ? 'correct_answer' or x ? 'explanation') then raise exception 'release_test_quick_leak_or_duplicate'; end if;
 resumed:=public.start_simulation(free_user,'${quick[0].id}');
 if resumed<>state or public.read_daily_limits(free_user)->'simulations'->>'used'<>'1' then raise exception 'release_test_resume_quota'; end if;
 select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer',x->>'correctAnswer') order by x->>'id') into answers
 from private.simulation_attempts a cross join lateral jsonb_array_elements(a.snapshots) x where a.id=(state->'quiz'->>'id')::uuid;
 result:=public.submit_simulation(free_user,(state->'quiz'->>'id')::uuid,answers);
 if result->>'total'<>'10' or result->>'score'<>'10' or
 exists(select 1 from jsonb_array_elements(result->'questions') x where not (x->>'correct')::boolean or coalesce(x->>'explanation','')='') then raise exception 'release_test_quick_correction'; end if;
 if public.submit_simulation(free_user,(state->'quiz'->>'id')::uuid,answers)<>result or
 public.read_simulation(free_user,(state->'quiz'->>'id')::uuid)->'result'<>result then raise exception 'release_test_correction_replay'; end if;
 denied:=false; begin perform public.start_simulation(free_user,'${quick[0].id}');
 exception when others then if sqlerrm<>'daily_simulation_limit' then raise; end if; denied:=true; end;
 if not denied then raise exception 'release_test_second_quick_limit'; end if;
 first_q:=public.start_question_practice_request(free_user,'matematica','','all','all',null,'${requestId}');
 if first_q is null or first_q ? 'correctAnswer' or first_q ? 'explanation' then raise exception 'release_test_practice_leak'; end if;
 for i in 2..10 loop next_q:=public.start_question_practice(free_user,'matematica','','all','all',null);
  if next_q is null then raise exception 'release_test_practice_missing'; end if; end loop;
 if public.read_daily_limits(free_user)->'practice'->>'used'<>'10' or
 public.start_question_practice_request(free_user,'matematica','','all','all',null,'${requestId}')<>first_q then raise exception 'release_test_practice_retry_quota'; end if;
 denied:=false; begin perform public.start_question_practice(free_user,'portugues','','all','all',null);
 exception when others then if sqlerrm<>'daily_practice_limit' then raise; end if; denied:=true; end;
 if not denied then raise exception 'release_test_eleventh_practice'; end if;
 select snapshot->>'correctAnswer' into expected_answer from private.practice_attempts where id=(first_q->>'id')::uuid;
 feedback:=public.answer_question_practice(free_user,(first_q->>'id')::uuid,expected_answer);
 if not (feedback->>'correct')::boolean or coalesce(feedback->>'explanation','')='' then raise exception 'release_test_practice_correction'; end if;
 -- DB owner testa seleção/correção internas dos cinco modelos. A conta continua
 -- gratuita; nenhum pagamento fictício, ACL ou período de acesso é criado.
 for model in select value from jsonb_array_elements(${expectedModels}) loop
  state:=private.start_simulation(internal_user,(model->>'id')::uuid);
  if jsonb_array_length(state->'quiz'->'questions')<>20 or state->'quiz'->>'questionCount'<>'20' or
  (select count(distinct x->>'id') from jsonb_array_elements(state->'quiz'->'questions') x)<>20 then raise exception 'release_test_subject_count'; end if;
  if exists(select 1 from jsonb_array_elements(state->'quiz'->'questions') x where x->>'subject'<>model->>'subject' or
  x ? 'correctAnswer' or x ? 'correct_answer' or x ? 'explanation') then raise exception 'release_test_subject_leak_or_mismatch'; end if;
  if public.read_simulation(free_user,(state->'quiz'->>'id')::uuid) is not null then raise exception 'release_test_attempt_owner'; end if;
  select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer',x->>'correctAnswer') order by x->>'id') into answers
  from private.simulation_attempts a cross join lateral jsonb_array_elements(a.snapshots) x where a.id=(state->'quiz'->>'id')::uuid;
  result:=public.submit_simulation(internal_user,(state->'quiz'->>'id')::uuid,answers);
  if result->>'total'<>'20' or result->>'score'<>'20' or
  exists(select 1 from jsonb_array_elements(result->'questions') x where not (x->>'correct')::boolean or coalesce(x->>'explanation','')='') then raise exception 'release_test_subject_correction'; end if;
 end loop;
 if (public.read_daily_limits(free_user)->>'hasPremium')::boolean or (public.read_daily_limits(internal_user)->>'hasPremium')::boolean or
 exists(select 1 from private.subscriptions where user_id in(free_user,internal_user)) then raise exception 'release_test_commercial_access_changed'; end if;
 if has_function_privilege('service_role','private.start_simulation(uuid,uuid)','execute') or
 has_function_privilege('authenticated','public.start_simulation(uuid,uuid)','execute') or
 has_function_privilege('anon','public.start_simulation(uuid,uuid)','execute') then raise exception 'release_test_privilege_bypass'; end if;
 -- O after exato permanece idempotente também quando já há tentativas novas.
 h := ${wholeSnapshot}; perform pg_temp.stage47_apply();
 if h<>(${wholeSnapshot}) then raise exception 'release_test_reexecution_after_use'; end if;
end $smoke$;
-- Remover as fixtures antes de comparar os históricos preexistentes.
delete from auth.users where id in('${freeUser}','${internalUser}');
do $preserved$ begin
 if (select hash from release_preserved)<>(${protectedSnapshot}) then raise exception 'release_test_smoke_changed_existing_data'; end if;
end $preserved$;`;

const sql = `begin;
set local statement_timeout='60s';
${fn}
create temporary table release_preserved as select ${protectedSnapshot} as hash;
-- Validar o estado real ANTES de usar qualquer reset como fixture.
select pg_temp.stage47_apply();
do $initial$ begin if (select hash from release_preserved)<>(${protectedSnapshot}) then raise exception 'release_test_initial_preservation'; end if; end $initial$;
${reset}
${guards}
do $positive$ declare h text; begin
 h := ${protectedSnapshot}; perform pg_temp.stage47_apply();
 if h<>(${protectedSnapshot}) then raise exception 'release_test_positive_preservation'; end if;
 if (select count(*) from public.questions where id in (${changedIds}) and status='published')<>500 then raise exception 'release_test_publication_count'; end if;
 if (select count(distinct subject) from public.questions where id in (${changedIds}))<>5 or
 exists(select subject from public.questions where id in (${changedIds}) group by subject having count(*)<>100) then raise exception 'release_test_subject_distribution'; end if;
 if (select count(*) from private.simulations where id in (${modelIds}) and published)<>6 then raise exception 'release_test_models_count'; end if;
 h := ${wholeSnapshot}; perform pg_temp.stage47_apply(); perform pg_temp.stage47_apply();
 if h<>(${wholeSnapshot}) then raise exception 'release_test_reexecution_timestamps'; end if;
end $positive$;
${smoke}
do $repeat_after_use$ declare h text; begin
 h := ${wholeSnapshot}; perform pg_temp.stage47_apply();
 if h<>(${wholeSnapshot}) then raise exception 'release_test_final_reexecution'; end if;
end $repeat_after_use$;
select '500_published_six_models_eleven_guards_free_limits_privacy_correction' as check_name,true as passed;
rollback;`;

const require = createRequire(import.meta.url);
const pkg = require.resolve("supabase/package.json");
const entry = path.resolve(path.dirname(pkg), require(pkg).bin.supabase);
const dir = path.join(root, "supabase/.temp");
mkdirSync(dir, { recursive: true });
const file = path.join(dir, `test-editorial-release-${randomUUID()}.sql`);
try {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", "--file", file], {
    cwd: root, encoding: "utf8", timeout: 120000, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error || result.status !== 0 || /"_tag"\s*:\s*"Error"/.test(result.stdout)) {
    // Imprimir apenas identificadores de diagnóstico; nunca SQL, respostas ou credenciais.
    const codes = [...new Set((result.stdout + "\n" + result.stderr).match(/\b(?:stage47_[a-z_]+|release_test_[a-z_]+|daily_practice_limit|daily_simulation_limit|simulation_unavailable|rate_limited)\b/g) ?? [])];
    console.error({ status: result.status, signal: result.signal, code: result.error?.code, diagnostics: codes });
    throw Error("Ensaio de publicação falhou; nenhuma transação com COMMIT foi enviada.");
  }
  assert.match(result.stdout, /500_published_six_models_eleven_guards_free_limits_privacy_correction/);
  console.log("Ensaio aprovado: 500 publicadas, seis modelos, onze rejeições, reexecução sem alterar timestamps e preservação de históricos/configurações. Rápido e cinco matérias conferidos, cotas gratuitas e gabaritos protegidos. Rollback concluído; acesso comercial real não certificado.");
} finally {
  rmSync(file, { force: true });
}
