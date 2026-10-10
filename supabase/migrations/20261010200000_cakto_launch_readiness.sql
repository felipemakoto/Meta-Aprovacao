-- Somente leitura agregada; não certifica revisão humana nem uma compra comercial.
create function public.cakto_launch_readiness() returns jsonb
language sql security definer set search_path='' as $$
 with subjects as (
  select unnest(array['matematica','portugues','ciencias','historia','geografia']) as subject
 ), totals as (
  select q.subject,count(*) filter(where q.status='draft') as draft,
   count(*) filter(where q.status='reviewed') as reviewed,count(*) filter(where q.status='published') as published,
   count(*) filter(where q.status='published' and a.question_id is not null) as usable
  from public.questions q left join public.question_answers a on a.question_id=q.id group by q.subject
 ), coverage as (
  select s.subject,coalesce(t.draft,0) as draft,coalesce(t.reviewed,0) as reviewed,
   coalesce(t.published,0) as published,coalesce(t.usable,0) as usable from subjects s left join totals t using(subject)
 ), catalog as (
  select s.published,s.free_access,s.subject,s.question_count,
   s.published and not exists(select 1 from coverage c where (s.subject is null or s.subject=c.subject)
    and c.usable<case when s.subject is null then s.question_count/5 else s.question_count end) as usable
  from private.simulations s
 ) select jsonb_build_object('sampledAt',clock_timestamp(),'health',public.cakto_operational_health(),
  'questions',jsonb_build_object('draft',(select sum(draft) from coverage),'reviewed',(select sum(reviewed) from coverage),
   'published',(select sum(published) from coverage),'usablePublished',(select sum(usable) from coverage),
   'missingAnswersPublished',(select sum(published-usable) from coverage),'diagnosticReady',(select bool_and(usable>=2) from coverage)),
  'subjects',(select jsonb_agg(jsonb_build_object('subject',c.subject,'draft',c.draft,'reviewed',c.reviewed,'published',c.published,
   'usablePublished',c.usable,'missingForDiagnostic',greatest(0,2-c.usable),
   'usablePremiumSimulations',(select count(*) from catalog s where s.usable and not s.free_access and s.subject=c.subject)) order by c.subject) from coverage c),
  'simulations',(select jsonb_build_object('draft',count(*) filter(where not published),'published',count(*) filter(where published),
   'unavailablePublished',count(*) filter(where published and not usable),'usableFree',count(*) filter(where usable and free_access),
   'usableFreeQuick',count(*) filter(where usable and free_access and subject is null and question_count=10),
   'usablePremium',count(*) filter(where usable and not free_access),'usablePremiumBySubject',count(*) filter(where usable and not free_access and subject is not null)) from catalog),
  'retentionInventory',jsonb_build_object('inbox',(select count(*) from private.cakto_event_inbox),
   'jobs',(select count(*) from private.cakto_payment_jobs),'paymentChecks',(select count(*) from private.cakto_payment_checks),
   'lifecycleChecks',(select count(*) from private.cakto_lifecycle_checks),'periods',(select count(*) from private.cakto_access_periods),
   'renewalChecks',(select count(*) from private.cakto_renewal_payments),
   'expiredCheckoutIntents',(select count(*) from private.checkout_intents where provider='cakto' and expires_at<clock_timestamp()),
   'schedulerRuns',(select count(*) from cron.job_run_details d join cron.job j using(jobid) where j.jobname in('meta-cakto-reconcile','meta-cakto-health'))));
$$;
revoke all on function public.cakto_launch_readiness() from public,anon,authenticated,service_role;
grant execute on function public.cakto_launch_readiness() to service_role;
