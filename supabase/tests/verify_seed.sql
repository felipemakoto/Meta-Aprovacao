-- Somente leitura, restrita aos dez IDs do lote inicial.
with expected as (
  select ('d1090000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid as id
  from generate_series(1, 10) n
), batch as (
  select q.* from public.questions q join expected e using (id)
), answers as (
  select a.* from public.question_answers a join expected e on e.id = a.question_id
)
select 'ten_seed_questions' as check_name, (select count(*) from batch) = 10 as passed
union all
select 'ten_matching_answers', (select count(*) from answers) = 10
union all
select 'two_questions_per_subject',
  (select count(*) from (select subject from batch group by subject having count(*) = 2) s) = 5
union all
select 'all_drafts_version_one',
  (select count(*) from batch where status = 'draft' and version = 1 and target_exam = 'both') = 10
union all
select 'five_distinct_options_each',
  (select count(*) from batch q where
    (select count(distinct btrim(o)) from unnest(array[q.option_a,q.option_b,q.option_c,q.option_d,q.option_e]) o) = 5) = 10;
