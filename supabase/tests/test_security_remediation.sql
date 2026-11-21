do $$
declare token text:=encode(extensions.gen_random_bytes(32),'hex');client text:=encode(extensions.gen_random_bytes(32),'hex');
 q jsonb;r jsonb;n integer;denied boolean;t timestamptz:=clock_timestamp();w timestamptz;
 u uuid:=gen_random_uuid();other_user uuid:=gen_random_uuid();qid uuid:=gen_random_uuid();aid uuid;
begin
 q:=public.start_guest_quiz_limited(token,client);
 if public.start_guest_quiz_limited(token,client)<>q then raise exception 'security_guest_retry_changed';end if;
 if (select sum(used) from private.guest_quiz_rate_buckets where bucket_key='client:'||client)<>1 then raise exception 'security_retry_charged';end if;
 for n in 2..20 loop perform public.start_guest_quiz_limited(encode(extensions.gen_random_bytes(32),'hex'),client);end loop;
 denied:=false;
 begin perform public.start_guest_quiz_limited(encode(extensions.gen_random_bytes(32),'hex'),client);
 exception when raise_exception then denied:=sqlerrm='rate_limited';end;
 if not denied or (select sum(used) from private.guest_quiz_rate_buckets where bucket_key='client:'||client)<>20 then raise exception 'security_network_limit_failed';end if;
 if public.start_guest_quiz_limited(token,client)<>q then raise exception 'security_limit_blocked_resume';end if;
 w:=date_trunc('minute',clock_timestamp());
 insert into private.guest_quiz_rate_buckets values('global',w,120,w+interval '24 hours')
 on conflict(bucket_key,window_start) do update set used=120;
 denied:=false;
 begin perform public.start_guest_quiz_limited(encode(extensions.gen_random_bytes(32),'hex'),encode(extensions.gen_random_bytes(32),'hex'));
 exception when raise_exception then denied:=sqlerrm='rate_limited';end;
 if not denied then raise exception 'security_global_limit_failed';end if;
 insert into auth.users(id,email_confirmed_at) values(u,t),(other_user,t);
 insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
 values(qid,'Fixture de retomada','1','2','3','4','5','matematica','__security_resume__','easy','both','published');
 insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação protegida');
 q:=public.start_question_practice(u,'matematica','__security_resume__','easy','etec',null);aid:=(q->>'id')::uuid;
 select count(*) into n from private.practice_attempts where user_id=u;
 r:=public.read_open_question_practice(u);
 if r<>q or r ?| array['correctAnswer','explanation','snapshot'] then raise exception 'security_resume_snapshot_failed';end if;
 if public.read_open_question_practice(other_user) is not null then raise exception 'security_resume_cross_account';end if;
 if (select count(*) from private.practice_attempts where user_id=u)<>n then raise exception 'security_resume_consumed_quota';end if;
 perform public.answer_question_practice(u,aid,'B');
 if public.read_open_question_practice(u) is not null then raise exception 'security_resume_completed';end if;
 update private.practice_attempts set answer=null,completed_at=null,created_at=t-interval '2 hours',expires_at=t-interval '1 hour' where id=aid;
 if public.read_open_question_practice(u) is not null then raise exception 'security_resume_expired';end if;
 if has_function_privilege('anon','public.start_guest_quiz_limited(text,text)','EXECUTE') or
 has_function_privilege('authenticated','public.read_open_question_practice(uuid)','EXECUTE') or
 has_table_privilege('service_role','private.guest_quiz_rate_buckets','SELECT,INSERT,UPDATE,DELETE') or
 has_function_privilege('service_role','private.wake_cakto_dependency_jobs(uuid,uuid)','EXECUTE') then raise exception 'security_permissions_failed';end if;
end$$;

do $$
declare u uuid:=gen_random_uuid();origin_id uuid:=gen_random_uuid();renewal_id uuid:=gen_random_uuid();sub uuid:=gen_random_uuid();
 ref text:=encode(extensions.gen_random_bytes(32),'hex');t timestamptz:=clock_timestamp();ev bigint;pending_ev bigint;waiting_ev bigint;lease uuid:=gen_random_uuid();
 proof jsonb;r jsonb;snap jsonb;local_id uuid;denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t);
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','security-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,t-interval '3 hours',t-interval '2 hours');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'first','sha256'),'hex'),'purchase_approved',origin_id::text,'security-fixture','offer','{}') returning id into ev;
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'pending','sha256'),'hex'),'refund',renewal_id::text,'security-fixture','offer',jsonb_build_object('subscriptionId',sub)) returning id into pending_ev;
 insert into private.cakto_payment_jobs(event_id,state,attempts,lease_token,lease_until) values(pending_ev,'running',8,lease,t+interval '2 minutes');
 r:=jsonb_build_object('outcome','retry','reason','subscription_binding_missing','dependency',jsonb_build_object('subscriptionId',sub,'originOrderId',origin_id));
 perform public.finish_cakto_lifecycle_job(pending_ev,lease,r);
 if not exists(select 1 from private.cakto_payment_jobs where event_id=pending_ev and state='exhausted' and dependency_subscription_id=sub) then raise exception 'security_missing_not_saved';end if;
 if exists(select 1 from private.subscriptions where user_id=u) then raise exception 'security_dependency_granted';end if;
 proof:=jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object('orderId',origin_id,'subscriptionId',sub,'productId','security-fixture','offerId','offer','orderCreatedAt',t-interval '170 minutes','paidAt',t-interval '160 minutes','paidPriceCents',1150,'currency','BRL'));
 perform public.record_cakto_payment_check(ev,proof);
 if not exists(select 1 from private.cakto_payment_jobs where event_id=pending_ev and state='queued' and attempts=0) then raise exception 'security_missing_not_woken';end if;
 select id into local_id from private.subscriptions where user_id=u;
 -- Waiting for period 2: period 3 is retried after the new ledger row, never auto-approved.
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'period3','sha256'),'hex'),'purchase_approved',gen_random_uuid()::text,'security-fixture','offer',jsonb_build_object('subscriptionId',sub)) returning id into waiting_ev;
 insert into private.cakto_payment_jobs(event_id,state,attempts,lease_token,lease_until) values(waiting_ev,'running',1,lease,t+interval '2 minutes');
 perform public.finish_cakto_lifecycle_job(waiting_ev,lease,r);
 snap:=jsonb_build_object('subscriptionId',sub,'originOrderId',origin_id,'productId','security-fixture','offerId','offer','providerStatus','canceled','providerUpdatedAt',t-interval '10 minutes','orderStatus','paid','action','preserve','occurredAt',null);
 r:=jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap,'renewal',jsonb_build_object('orderId',renewal_id,'period',2,'orderCreatedAt',t-interval '1 hour','paidAt',t-interval '30 minutes','paidPriceCents',2299,'currency','BRL'));
 perform public.record_cakto_lifecycle_check(pending_ev,r);
 if not exists(select 1 from private.cakto_payment_jobs where event_id=waiting_ev and state='queued' and attempts=0) then raise exception 'security_period_not_woken';end if;
 if (select count(*) from private.cakto_access_periods where subscription_id=local_id)<>2 then raise exception 'security_canceled_renewal_rejected';end if;
 update private.cakto_payment_jobs set state='verified' where event_id=waiting_ev;
 perform public.record_cakto_payment_check(ev,proof);perform public.record_cakto_lifecycle_check(pending_ev,r);
 if (select state from private.cakto_payment_jobs where event_id=waiting_ev)<>'verified' or
 (select count(*) from private.cakto_access_periods where subscription_id=local_id)<>2 then raise exception 'security_replay_changed_job_or_period';end if;
 -- Reversal remains sticky even with a later paid/cancelled replay.
 perform public.record_cakto_lifecycle_check(pending_ev,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap||jsonb_build_object('orderStatus','refunded','action','revoke','occurredAt',t-interval '5 minutes')));
 perform public.record_cakto_lifecycle_check(pending_ev,r);
 if not exists(select 1 from private.cakto_access_periods where order_id=renewal_id and revoked_at is not null) then raise exception 'security_reversal_resurrected';end if;
 -- Untrusted context cannot smuggle additional fields into stored evidence.
 update private.cakto_payment_jobs set state='running',attempts=1,lease_token=lease,lease_until=t+interval '2 minutes' where event_id=pending_ev;
 denied:=false;
 begin perform public.finish_cakto_lifecycle_job(pending_ev,lease,jsonb_build_object('outcome','retry','reason','subscription_binding_missing','dependency',jsonb_build_object('subscriptionId',sub,'originOrderId',origin_id,'customer','private')));
 exception when raise_exception then denied:=sqlerrm='invalid_dependency';end;
 if not denied then raise exception 'security_dependency_unknown_field';end if;
end$$;
select true as security_remediation_sql_passed;
