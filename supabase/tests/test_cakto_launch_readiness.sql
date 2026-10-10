begin;
do $$
declare r jsonb;base jsonb;sub text;k integer;q uuid;missing uuid;v text;
begin
 base:=public.cakto_launch_readiness();
 if (base->'questions'->>'usablePublished')::int<>0 then raise exception 'requires prelaunch or isolated test database';end if;
 if base->'questions'->>'diagnosticReady'<>'false' or (base->'simulations'->>'usableFreeQuick')::int<>0 then raise exception 'draft content counted';end if;
 -- Publicação transitória de fixtures, revertida; nunca aprova o conteúdo editorial real.
 foreach sub in array array['matematica','portugues','ciencias','historia','geografia'] loop
  for k in 1..2 loop
   q:=gen_random_uuid();
   insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
    values(q,'Fixture interna','A','B','C','D','E',sub,'Fixture','easy','both','published');
   if sub='geografia' and k=2 then missing:=q;else insert into public.question_answers values(q,'A','Fixture',clock_timestamp(),clock_timestamp());end if;
  end loop;
 end loop;
 insert into private.simulations(title,question_count,subject,published,free_access) values('Fixture rápido',10,null,true,true),('Fixture Premium',20,'matematica',true,false);
 r:=public.cakto_launch_readiness();
 if r->'questions'->>'diagnosticReady'<>'false' or (r->'questions'->>'missingAnswersPublished')::int<>1 or (r->'simulations'->>'usableFreeQuick')::int<>0 then raise exception 'missing answer counted';end if;
 insert into public.question_answers values(missing,'A','Fixture',clock_timestamp(),clock_timestamp());
 r:=public.cakto_launch_readiness();if r->'questions'->>'diagnosticReady'<>'true' or (r->'simulations'->>'usableFreeQuick')::int<>1 or (r->'simulations'->>'usablePremiumBySubject')::int<>0 then raise exception 'catalog coverage invalid';end if;
 for k in 1..18 loop
  q:=gen_random_uuid();
  insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
   values(q,'Fixture interna','A','B','C','D','E','matematica','Fixture','easy','both','published');
  insert into public.question_answers values(q,'A','Fixture',clock_timestamp(),clock_timestamp());
 end loop;
 r:=public.cakto_launch_readiness();if (r->'simulations'->>'usablePremiumBySubject')::int<>1 or (r->'simulations'->>'usablePremium')::int<>1 then raise exception 'subject catalog not ready';end if;
 update public.questions set status='reviewed' where id=missing;
 r:=public.cakto_launch_readiness();if r->'questions'->>'diagnosticReady'<>'false' or (r->'questions'->>'reviewed')::int<>(base->'questions'->>'reviewed')::int+1 then raise exception 'reviewed content counted';end if;
 if r::text ~ 'Fixture interna|correct_answer|explanation|secret|reference|orderId' then raise exception 'private content leaked';end if;
 foreach v in array array['anon','authenticated'] loop
  if has_function_privilege(v,'public.cakto_launch_readiness()','execute') then raise exception 'client read allowed';end if;
 end loop;
 if not has_function_privilege('service_role','public.cakto_launch_readiness()','execute') then raise exception 'server read denied';end if;
 if ((r->'retentionInventory')-'schedulerRuns') is distinct from ((base->'retentionInventory')-'schedulerRuns') then raise exception 'commercial data changed';end if;
end$$;
select true as readiness_content_catalog_privacy_permissions_passed;
rollback;
