begin;
do $$
declare u uuid:=gen_random_uuid();free_u uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();origin uuid:=gen_random_uuid();sub uuid:=gen_random_uuid();
 ref text:=encode(extensions.gen_random_bytes(32),'hex');ev bigint;local_id uuid;t timestamptz:=clock_timestamp();paid timestamptz:=t-interval '1 minute';
 quick uuid:=gen_random_uuid();quick2 uuid:=gen_random_uuid();math uuid:=gen_random_uuid();math2 uuid:=gen_random_uuid();draft_id uuid:=gen_random_uuid();missing_id uuid:=gen_random_uuid();
 qid uuid;q jsonb;first_q jsonb;state jsonb;math_state jsonb;result jsonb;answers jsonb;usage jsonb;nonce uuid:=gen_random_uuid();denied boolean;i int;subject_value text;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(free_u,t),(unconfirmed,null);
 -- Tudo ocorre dentro de rollback; conteúdo editorial existente não é modificado no estado confirmado.
 update public.questions set status='draft' where status='published';update private.simulations set published=false;
 foreach subject_value in array array['matematica','portugues','ciencias','historia','geografia'] loop
  for i in 1..case when subject_value='matematica' then 20 else 2 end loop
   qid:=gen_random_uuid();
   insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
   values(qid,'Benefício privado','1','2','3','4','5',subject_value,'__premium__','easy','both','published');
   insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação');
  end loop;
 end loop;
 insert into private.simulations(id,title,question_count,subject,published,free_access) values
 (quick,'Rápido A',10,null,true,true),(quick2,'Rápido B',10,null,true,true),
 (math,'Math A',20,'matematica',true,false),(math2,'Math B',20,'matematica',true,false),
 (draft_id,'Rascunho',20,'matematica',false,false),(missing_id,'Sem questões suficientes',25,'matematica',true,false);
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','benefits-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,paid-interval '1 minute',paid+interval '59 minutes');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref,'sha256'),'hex'),'purchase_approved',origin::text,'benefits-fixture','offer','{}') returning id into ev;
 set local role service_role;
 if (public.read_daily_limits(u)->>'hasPremium')::boolean or jsonb_array_length(public.simulation_catalog(u))<>2 then raise exception 'unpaid benefits exposed';end if;
 perform public.record_cakto_payment_check(ev,jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object('orderId',origin,'subscriptionId',sub,'productId','benefits-fixture','offerId','offer','orderCreatedAt',paid-interval '30 seconds','paidAt',paid,'paidPriceCents',1150,'currency','BRL')));
 usage:=public.read_daily_limits(u);
 if not (usage->>'hasPremium')::boolean or (usage->>'accessUntil')::timestamptz<>paid+interval '720 hours' or
 usage->'practice'->'limit'<>'null'::jsonb or usage->'practice'->'remaining'<>'null'::jsonb or usage->'simulations'->'limit'<>'null'::jsonb then raise exception 'premium quota not unlimited';end if;
 if jsonb_array_length(public.simulation_catalog(u))<>4 or jsonb_array_length(public.simulation_catalog(free_u))<>2 then raise exception 'catalog availability/isolation';end if;
 denied:=false;begin perform public.read_daily_limits(unconfirmed);exception when raise_exception then denied:=sqlerrm='login_required';end;if not denied then raise exception 'unconfirmed benefits';end if;
 first_q:=public.start_question_practice_request(u,'matematica','__premium__','easy','all',null,nonce);
 for i in 2..12 loop q:=public.start_question_practice(u,'matematica','__premium__','easy','all',null);end loop;
 if public.read_daily_limits(u)->'practice'->>'used'<>'12' or public.start_question_practice_request(u,'matematica','__premium__','easy','all',null,nonce)<>first_q then raise exception 'practice cap/dedup';end if;
 state:=public.start_simulation(u,quick);perform public.start_simulation(u,quick2);math_state:=public.start_simulation(u,math);
 if jsonb_array_length(math_state->'quiz'->'questions')<>20 or public.read_daily_limits(u)->'simulations'->>'used'<>'3' or public.start_simulation(u,math)<>math_state then raise exception 'simulation unlimited/resume';end if;
 if math_state::text like '%correctAnswer%' or math_state::text like '%explanation%' then raise exception 'answers exposed';end if;
 denied:=false;begin perform public.start_simulation(u,draft_id);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'draft exposed';end if;
 denied:=false;begin perform public.start_simulation(u,missing_id);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'missing content exposed';end if;
 denied:=false;begin perform public.start_simulation(free_u,math);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'nonfree direct ID bypass';end if;
 select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer','B')) into answers from jsonb_array_elements(state->'quiz'->'questions') x;
 result:=public.submit_simulation(u,(state->'quiz'->>'id')::uuid,answers);
 if public.start_simulation(u,quick)->'quiz'->>'id'=state->'quiz'->>'id' then raise exception 'completed premium restart failed';end if;
 for i in 13..30 loop perform public.start_question_practice(u,'matematica','__premium__','easy','all',null);end loop;
 denied:=false;begin perform public.start_question_practice(u,'matematica','__premium__','easy','all',null);exception when raise_exception then denied:=sqlerrm='rate_limited';end;if not denied then raise exception 'premium bypassed technical throttle';end if;
 reset role;
 select id into local_id from private.subscriptions where user_id=u;
 -- Expirar o mesmo período sem mover o relógio nem esperar trinta dias.
 update private.cakto_access_periods set paid_at=t-interval '31 days',access_from=t-interval '31 days',access_until=t-interval '1 day' where subscription_id=local_id;
 perform private.refresh_cakto_access(local_id);
 set local role service_role;
 usage:=public.read_daily_limits(u);
 if (usage->>'hasPremium')::boolean or usage->'practice'->>'limit'<>'10' or usage->'practice'->>'remaining'<>'0' or usage->'simulations'->>'limit'<>'1' or usage->'simulations'->>'remaining'<>'0' or usage->'accessUntil'<>'null'::jsonb then raise exception 'expired quota did not return to free';end if;
 if jsonb_array_length(public.simulation_catalog(u))<>2 then raise exception 'expired premium catalog retained';end if;
 denied:=false;begin perform public.start_question_practice(u,'matematica','__premium__','easy','all',null);exception when raise_exception then denied:=sqlerrm='daily_practice_limit';end;if not denied then raise exception 'expired new practice permitted';end if;
 denied:=false;begin perform public.start_simulation(u,math2);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'expired nonfree template permitted';end if;
 if public.start_question_practice_request(u,'matematica','__premium__','easy','all',null,nonce)<>first_q or public.start_simulation(u,math)<>math_state then raise exception 'existing attempts blocked after expiry';end if;
 perform public.answer_question_practice(u,(first_q->>'id')::uuid,'B');
 select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer','B')) into answers from jsonb_array_elements(math_state->'quiz'->'questions') x;
 perform public.submit_simulation(u,(math_state->'quiz'->>'id')::uuid,answers);
 if public.read_history_detail(u,'simulations',(result->>'id')::uuid)<>result then raise exception 'free review blocked';end if;
 reset role;
 -- Revogação e lacuna futura também removem benefícios, mesmo com intervalo agregado granted.
 update private.cakto_access_periods set paid_at=paid,access_from=paid,access_until=paid+interval '720 hours',revoked_at=t where subscription_id=local_id;
 update private.subscriptions set access_state='granted',access_from=paid,access_until=paid+interval '720 hours' where id=local_id;
 if (public.read_daily_limits(u)->>'hasPremium')::boolean then raise exception 'refund kept benefits';end if;
 update private.cakto_access_periods set access_from=t+interval '1 day',access_until=t+interval '31 days',revoked_at=null where subscription_id=local_id;
 if (public.read_daily_limits(u)->>'hasPremium')::boolean then raise exception 'future period kept benefits';end if;
 if has_function_privilege('service_role','private.daily_limits(uuid)','execute') or has_function_privilege('service_role','private.start_limited_practice(uuid,text,text,text,text,uuid,uuid)','execute') or has_function_privilege('authenticated','public.start_simulation(uuid,uuid)','execute') then raise exception 'benefits privilege bypass';end if;
end$$;
select true as premium_benefits_unlimited_catalog_expiry_reversal_resume_privacy_passed;
rollback;
