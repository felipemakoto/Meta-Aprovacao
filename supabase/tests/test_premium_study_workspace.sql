do $$
declare u uuid:=gen_random_uuid();other_u uuid:=gen_random_uuid();free_u uuid:=gen_random_uuid();who uuid;origin_id uuid;sub uuid;ref text;
 t timestamptz:=clock_timestamp();ev bigint;w jsonb;config jsonb;attempt jsonb;first_attempt jsonb;result jsonb;aid uuid;qid uuid;sid uuid;deny boolean;nonce uuid:=gen_random_uuid();n int;rowrecord record;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(other_u,t),(free_u,t);
 foreach who in array array[u,other_u] loop
  origin_id:=gen_random_uuid();sub:=gen_random_uuid();ref:=encode(extensions.gen_random_bytes(32),'hex');
  insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
  values(ref,who,'cakto','premium-workspace-fixture','offer','https://pay.cakto.com.br/fixture',2299,2299,t-interval '2 minutes',t+interval '58 minutes');
  insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
  values(encode(extensions.digest(ref,'sha256'),'hex'),'purchase_approved',origin_id::text,'premium-workspace-fixture','offer','{}') returning id into ev;
  perform public.record_cakto_payment_check(ev,jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object('orderId',origin_id,'subscriptionId',sub,'productId','premium-workspace-fixture','offerId','offer','orderCreatedAt',t-interval '90 seconds','paidAt',t-interval '1 minute','paidPriceCents',2299,'currency','BRL')));
 end loop;
 deny:=false;begin perform public.premium_study_workspace(free_u,30);exception when raise_exception then deny:=sqlerrm='premium_required';end;
 if not deny then raise exception 'premium_free_access';end if;
 deny:=false;begin perform public.premium_study_workspace(gen_random_uuid(),30);exception when raise_exception then deny:=sqlerrm='login_required';end;
 if not deny then raise exception 'premium_anonymous_access';end if;
 config:=jsonb_build_object('institution','etec','examDate',current_date+45,'weekdays',jsonb_build_array(1,2,3,4,5),'minutes',60,'startTime','18:00','dailyGoal',20,'weeklyGoal',100,'reminder',15);
 -- A database timezone already on the next civil day must accept today's Brasilia exam date.
 perform set_config('TimeZone','Pacific/Kiritimati',true);
 perform public.premium_study_profile(u,jsonb_set(config,'{examDate}',to_jsonb((statement_timestamp() at time zone 'America/Sao_Paulo')::date)));
 perform set_config('TimeZone','UTC',true);
 perform public.premium_study_profile(u,config);w:=public.premium_study_workspace(u,30);
 perform public.premium_study_sync_plan(u,(w->'profile'->>'version')::timestamptz,repeat('a',64),jsonb_build_array(jsonb_build_object('key',current_date||':0','title','Praticar','date',current_date,'time','18:00','minutes',30,'subject','matematica','topic','','kind','practice','goal',10,'reminder',15)));
 select id into sid from private.study_sessions where user_id=u and source='plan';
 config:=jsonb_build_object('title','Sessão editada','date',current_date,'time','19:00','minutes',30,'subject','matematica','topic','','kind','practice','goal',10,'reminder',5,'completed',false,'archived',false);
 perform public.premium_study_session(u,sid,nonce,config);
 perform public.premium_study_sync_plan(u,(w->'profile'->>'version')::timestamptz,repeat('b',64),'[]');
 if not exists(select 1 from private.study_sessions where id=sid and title='Sessão editada' and not archived and source='manual') then raise exception 'premium_manual_overwritten';end if;
 deny:=false;begin perform public.premium_study_session(other_u,sid,nonce,config);exception when raise_exception then deny:=sqlerrm='activity_unavailable';end;
 if not deny then raise exception 'premium_session_idor';end if;
 config:=jsonb_set(config,'{completed}','true');perform public.premium_study_session(u,sid,nonce,config);
 if (public.premium_study_workspace(other_u,30)->'profile')<>'null'::jsonb or jsonb_array_length(public.premium_study_workspace(other_u,30)->'sessions')<>0 then raise exception 'premium_workspace_idor';end if;
 -- Validated question fixtures, only inside rollback. No fake content is published.
 for n in 1..8 loop
  qid:=gen_random_uuid();insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
  values(qid,'Teste isolado','1','2','3','4','5','matematica','__premium_workspace__','easy','both','published');
  insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação validada da fixture');
  insert into private.practice_attempts(user_id,question_id,snapshot,answer,completed_at) values(u,qid,jsonb_build_object('subject','matematica','topic','__premium_workspace__','difficulty','easy','correctAnswer','B'),'A',t);
 end loop;
 w:=public.premium_study_workspace(u,30);
 if not exists(select 1 from jsonb_array_elements(w->'groups') g where g->>'level'='topic' and g->>'topic'='__premium_workspace__' and (g->>'n')::int=8 and (g->>'correct')::int=0) then raise exception 'premium_diagnosis_incorrect';end if;
 result:=public.premium_study_cards(u,'matematica','__premium_workspace__','review');
 if jsonb_array_length(result)<>8 then raise exception 'premium_review_selection';end if;
 qid:=(result->0->>'id')::uuid;nonce:=gen_random_uuid();result:=public.premium_study_rate(u,qid,'review',3,nonce);
 if public.premium_study_rate(u,qid,'review',3,nonce)<>result or jsonb_array_length(public.premium_study_cards(u,'matematica','__premium_workspace__','review'))<>7 then raise exception 'premium_srs_replay_or_due';end if;
 if jsonb_array_length(public.premium_study_cards(other_u,'matematica','__premium_workspace__','review'))<>0 then raise exception 'premium_srs_idor';end if;
 config:=jsonb_build_object('mode','custom','institution','etec','subjects',jsonb_build_array('matematica'),'topics',jsonb_build_array('__premium_workspace__'),'difficulty','easy','count',5,'minutes',10);
 nonce:=gen_random_uuid();attempt:=public.premium_study_start_exam(u,config,nonce);aid:=(attempt->'quiz'->>'id')::uuid;
 if public.premium_study_start_exam(u,config,nonce)<>attempt or jsonb_array_length(attempt->'quiz'->'questions')<>5 or attempt->'quiz'->'questions'->0 ?| array['correctAnswer','explanation'] then raise exception 'premium_exam_contract';end if;
 if public.read_simulation(other_u,aid) is not null then raise exception 'premium_exam_idor';end if;
 qid:=(attempt->'quiz'->'questions'->0->>'id')::uuid;
 perform public.premium_study_save_exam(u,aid,jsonb_build_object(qid,'B'),jsonb_build_array(qid),1);
 if public.read_simulation(u,aid)->'quiz'->'premium'->'draft'->>qid::text<>'B' then raise exception 'premium_draft_not_saved';end if;
 deny:=false;begin perform public.premium_study_save_exam(other_u,aid,'{}','[]',1);exception when raise_exception then deny:=sqlerrm='attempt_unavailable';end;
 if not deny then raise exception 'premium_draft_idor';end if;
 deny:=false;begin perform public.premium_study_save_exam(u,aid,'{}','[]',1);exception when raise_exception then deny:=sqlerrm='draft_conflict';end;
 if not deny then raise exception 'premium_old_draft_won';end if;
 update private.simulation_attempts set started_at=t-interval '11 minutes',expires_at=t-interval '1 minute' where id=aid;
 result:=public.read_simulation(u,aid);
 if (result->'result'->>'score')::int<>1 or result->'result'->>'timed'<>'true' or (result->'result'->>'total')::int<>5 then raise exception 'premium_timed_grade';end if;
 if public.read_simulation(u,aid)<>result or (select count(*) from private.simulation_attempts where user_id=u and completed_at is not null)<>1 then raise exception 'premium_grade_replay';end if;
 if (public.read_study_statistics(u,'all')->>'simulations')::int<>1 then raise exception 'premium_statistics_not_shared';end if;
 config:=config||jsonb_build_object('mode','realistic','institution','ifsp');attempt:=public.premium_study_start_exam(u,config,gen_random_uuid());
 if jsonb_array_length(attempt->'quiz'->'questions')<>30 or
 (select count(*) from jsonb_array_elements(attempt->'quiz'->'questions') q where q->>'subject'='matematica')<>15 or
 extract(epoch from ((attempt->'quiz'->>'expiresAt')::timestamptz-(attempt->'quiz'->>'startedAt')::timestamptz)) not between 10799 and 10801 then raise exception 'premium_official_structure';end if;
 first_attempt:=attempt;attempt:=public.premium_study_start_exam(u,config,gen_random_uuid());
 if exists(select 1 from jsonb_array_elements(first_attempt->'quiz'->'questions') a join jsonb_array_elements(attempt->'quiz'->'questions') b on a->>'id'=b->>'id') then raise exception 'premium_avoidable_repetition';end if;
 -- Paid feature expiry is checked even on the original simulation route.
 update private.cakto_access_periods set revoked_at=t where subscription_id in(select id from private.subscriptions where user_id=u);
 deny:=false;begin perform public.read_simulation(u,(attempt->'quiz'->>'id')::uuid);exception when raise_exception then deny:=sqlerrm='premium_required';end;
 if not deny then raise exception 'premium_expired_read';end if;
 deny:=false;begin perform public.submit_simulation(u,(attempt->'quiz'->>'id')::uuid,'[]');exception when raise_exception then deny:=sqlerrm='premium_required';end;
 if not deny then raise exception 'premium_expired_submit';end if;
 -- New sales are regular; historical paid receipts remain unchanged.
 result:=public.create_checkout_intent(free_u,'premium-workspace-fixture','offer','https://pay.cakto.com.br/fixture',2299);
 if (result->>'firstPriceCents')::int<>2299 then raise exception 'premium_regular_price';end if;
 deny:=false;begin perform public.create_checkout_intent(free_u,'premium-workspace-fixture','offer','https://pay.cakto.com.br/fixture?coupon=primeiracompra',1150);exception when raise_exception then deny:=sqlerrm='invalid_checkout_offer';end;
 if not deny then raise exception 'premium_coupon_accepted';end if;
 for rowrecord in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'premium_study_%' loop
  if has_function_privilege('anon',rowrecord.signature,'execute') or has_function_privilege('authenticated',rowrecord.signature,'execute') or not has_function_privilege('service_role',rowrecord.signature,'execute') then raise exception 'premium_rpc_permissions';end if;
 end loop;
 if has_table_privilege('service_role','private.study_sessions','select,insert,update,delete') then raise exception 'premium_table_permissions';end if;
end$$;
select true as premium_study_sql_passed;
