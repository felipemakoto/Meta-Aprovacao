-- Keep study civil dates in Brasilia, regardless of the database/session timezone.
-- CREATE OR REPLACE preserves existing service-only ACLs and all stored data.
create or replace function public.premium_study_workspace(p_user_id uuid,p_days int default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare groups jsonb;t timestamptz:=clock_timestamp();
begin
 perform private.require_study_premium(p_user_id);
 if p_days is null or p_days not in(0,7,30,90) then raise exception 'invalid_input';end if;
 with observations as (select * from private.study_observations(p_user_id) where answered_at<=t and (p_days=0 or answered_at>=t-make_interval(days=>p_days))),
 latest as (select distinct on(question_id) * from observations order by question_id,answered_at desc),
 rows as (
 select 'subject' level,subject,'' topic,'' difficulty,count(*) n,count(*) filter(where correct) correct from latest group by subject
 union all select 'topic',subject,topic,'',count(*),count(*) filter(where correct) from latest group by subject,topic
 union all select 'difficulty',subject,'',difficulty,count(*),count(*) filter(where correct) from latest group by subject,difficulty
 ) select coalesce(jsonb_agg(to_jsonb(rows) order by level,subject,topic,difficulty),'[]') into groups from rows;
 return jsonb_build_object('asOf',t,'days',p_days,'groups',groups,
 'institutions',(select coalesce(jsonb_agg(to_jsonb(i) order by name),'[]') from private.study_institutions i),
 'officialEvents',(select coalesce(jsonb_agg(to_jsonb(e) order by event_date),'[]') from private.study_official_events e),
 'profile',(select config||jsonb_build_object('version',updated_at,'fingerprint',plan_fingerprint) from private.study_profiles where user_id=p_user_id),
 'sessions',(select coalesce(jsonb_agg(to_jsonb(s)-'user_id'-'request_id' order by study_date,start_time),'[]') from (select * from private.study_sessions where user_id=p_user_id and not archived and study_date between (statement_timestamp() at time zone 'America/Sao_Paulo')::date-90 and (statement_timestamp() at time zone 'America/Sao_Paulo')::date+730 order by study_date,start_time limit 1000) s),
 'documents',(select coalesce(jsonb_agg(to_jsonb(d)-'user_id' order by year desc,selection),'[]') from private.study_documents d where d.user_id is null or d.user_id=p_user_id),
 'reviewHistory',(select coalesce(jsonb_agg(to_jsonb(h)-'user_id'-'request_id' order by reviewed_at desc),'[]') from (select * from private.study_repetition_log where user_id=p_user_id order by reviewed_at desc limit 50) h),
 'due',(select jsonb_build_object('review',count(*) filter(where mode='review'),'flashcard',count(*) filter(where mode='flashcard')) from private.study_repetition where user_id=p_user_id and due_at<=t),
 'topics',(select coalesce(jsonb_agg(r),'[]') from (select distinct subject,topic from public.questions where status='published' order by subject,topic) r),
 'exams',(select coalesce(jsonb_agg(to_jsonb(e) order by started_at desc),'[]') from (select id,title,started_at,expires_at,completed_at from private.simulation_attempts where user_id=p_user_id and premium_config is not null order by started_at desc limit 20) e));
end$$;

create or replace function public.premium_study_profile(p_user_id uuid,p_config jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_study_premium(p_user_id);
 if p_config is null or jsonb_typeof(p_config)<>'object' or exists(select 1 from jsonb_each(p_config) x where x.value='null'::jsonb) or not p_config ?& array['institution','examDate','weekdays','minutes','startTime','dailyGoal','weeklyGoal','reminder'] or (select count(*) from jsonb_object_keys(p_config))<>8
 or not exists(select 1 from private.study_institutions where id=p_config->>'institution')
 or (p_config->>'examDate')::date not between (statement_timestamp() at time zone 'America/Sao_Paulo')::date and (statement_timestamp() at time zone 'America/Sao_Paulo')::date+730
 or jsonb_typeof(p_config->'weekdays')<>'array' or jsonb_array_length(p_config->'weekdays') not between 1 and 7
 or exists(select 1 from jsonb_array_elements(p_config->'weekdays') x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-6]$')
 or (select count(distinct x) from jsonb_array_elements(p_config->'weekdays') x)<>jsonb_array_length(p_config->'weekdays')
 or (p_config->>'minutes')::int not between 15 and 240 or p_config->>'startTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or (p_config->>'dailyGoal')::int not between 1 and 100 or (p_config->>'weeklyGoal')::int not between 1 and 700
 or (p_config->>'reminder')::int not in(0,5,15,30,60) then raise exception 'invalid_input';end if;
 insert into private.study_profiles(user_id,config) values(p_user_id,p_config)
 on conflict(user_id) do update set config=excluded.config,updated_at=clock_timestamp(),plan_fingerprint=null;
end$$;

create or replace function public.premium_study_session(p_user_id uuid,p_id uuid,p_request_id uuid,p_session jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 perform private.require_study_premium(p_user_id);
 if p_request_id is null or p_session is null or jsonb_typeof(p_session)<>'object' or exists(select 1 from jsonb_each(p_session) x where x.value='null'::jsonb) or not p_session ?& array['title','date','time','minutes','subject','topic','kind','goal','reminder','completed','archived']
 or (select count(*) from jsonb_object_keys(p_session))<>11 or char_length(p_session->>'title') not between 1 and 120
 or (p_session->>'date')::date not between (statement_timestamp() at time zone 'America/Sao_Paulo')::date-90 and (statement_timestamp() at time zone 'America/Sao_Paulo')::date+730
 or p_session->>'time' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or (p_session->>'minutes')::int not between 10 and 360
 or p_session->>'subject' not in('matematica','portugues','ciencias','historia','geografia','') or char_length(p_session->>'topic')>160
 or p_session->>'kind' not in('practice','review','flashcards','simulation','personal') or (p_session->>'goal')::int not between 1 and 100
 or (p_session->>'reminder')::int not in(0,5,15,30,60) or jsonb_typeof(p_session->'completed')<>'boolean' or jsonb_typeof(p_session->'archived')<>'boolean' then raise exception 'invalid_input';end if;
 perform pg_advisory_xact_lock(hashtextextended('study-session:'||p_user_id::text,0));
 if p_id is not null then
  update private.study_sessions set title=p_session->>'title',study_date=(p_session->>'date')::date,start_time=(p_session->>'time')::time,
  minutes=(p_session->>'minutes')::int,subject=nullif(p_session->>'subject',''),topic=p_session->>'topic',kind=p_session->>'kind',goal=(p_session->>'goal')::int,
  reminder_minutes=(p_session->>'reminder')::int,completed_at=case when (p_session->>'completed')::boolean then coalesce(completed_at,clock_timestamp()) else null end,
  archived=(p_session->>'archived')::boolean,source='manual',updated_at=clock_timestamp() where id=p_id and user_id=p_user_id returning id into target;
  if not found then raise exception 'activity_unavailable';end if;
 else
  select id into target from private.study_sessions where user_id=p_user_id and request_id=p_request_id;
  if found then return target;end if;
  if (select count(*) from private.study_sessions where user_id=p_user_id and not archived and study_date>=(statement_timestamp() at time zone 'America/Sao_Paulo')::date)>1000 then raise exception 'activity_limit';end if;
  insert into private.study_sessions(user_id,title,study_date,start_time,minutes,subject,topic,kind,goal,reminder_minutes,source,request_id)
  values(p_user_id,p_session->>'title',(p_session->>'date')::date,(p_session->>'time')::time,(p_session->>'minutes')::int,nullif(p_session->>'subject',''),p_session->>'topic',p_session->>'kind',(p_session->>'goal')::int,(p_session->>'reminder')::int,'manual',p_request_id) returning id into target;
 end if;
 return target;
end$$;

create or replace function public.premium_study_sync_plan(p_user_id uuid,p_version timestamptz,p_fingerprint text,p_sessions jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare x jsonb;
begin
 perform private.require_study_premium(p_user_id);
 perform 1 from private.study_profiles where user_id=p_user_id and updated_at=p_version for update;
 if not found then raise exception 'plan_changed';end if;
 if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_sessions is null or jsonb_typeof(p_sessions)<>'array' or jsonb_array_length(p_sessions)>100 then raise exception 'invalid_input';end if;
 if exists(select 1 from private.study_profiles where user_id=p_user_id and plan_fingerprint=p_fingerprint) then return;end if;
 -- Never overwrite manual edits or completed work. Obsolete generated tasks are archived, not deleted.
 update private.study_sessions set archived=true where user_id=p_user_id and source='plan' and completed_at is null and study_date>=(statement_timestamp() at time zone 'America/Sao_Paulo')::date;
 for x in select value from jsonb_array_elements(p_sessions) loop
  if (x->>'date')::date not between (statement_timestamp() at time zone 'America/Sao_Paulo')::date and (statement_timestamp() at time zone 'America/Sao_Paulo')::date+28 or x->>'key' !~ '^[0-9-]{10}:[0-2]$' then raise exception 'invalid_input';end if;
  insert into private.study_sessions(user_id,title,study_date,start_time,minutes,subject,topic,kind,goal,reminder_minutes,source,plan_key)
  values(p_user_id,x->>'title',(x->>'date')::date,(x->>'time')::time,(x->>'minutes')::int,x->>'subject',x->>'topic',x->>'kind',(x->>'goal')::int,(x->>'reminder')::int,'plan',x->>'key')
  on conflict(user_id,plan_key) do update set title=excluded.title,start_time=excluded.start_time,minutes=excluded.minutes,subject=excluded.subject,topic=excluded.topic,kind=excluded.kind,goal=excluded.goal,reminder_minutes=excluded.reminder_minutes,archived=false,updated_at=clock_timestamp()
  where private.study_sessions.source='plan' and private.study_sessions.completed_at is null;
 end loop;
 update private.study_profiles set plan_fingerprint=p_fingerprint where user_id=p_user_id;
end$$;

create or replace function public.premium_study_document(p_user_id uuid,p_document jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_study_premium(p_user_id);
 if (select count(*) from private.study_documents where user_id=p_user_id)>=100 then raise exception 'activity_limit';end if;
 if jsonb_typeof(p_document)<>'object' or (select count(*) from jsonb_object_keys(p_document))<>6 or not p_document ?& array['institution','year','selection','examUrl','answerUrl','sourceUrl']
 or not exists(select 1 from private.study_institutions where id=p_document->>'institution') or (p_document->>'year')::int not between 2000 and 2100
 or char_length(p_document->>'selection') not between 1 and 120 then raise exception 'invalid_input';end if;
 -- Server verifies host, source links, content type and PDF magic before invoking this RPC.
 if p_document->>'examUrl' !~ '^https://(fatweb\.s3\.amazonaws\.com/vestibulinhoetec/|concurso30\.fundacaocefetminas\.org\.br/documentos/|([a-z0-9-]+\.)?ifsp\.edu\.br/|assets\.fatvestibulares\.com\.br/)' or
 p_document->>'answerUrl' !~ '^https://(fatweb\.s3\.amazonaws\.com/vestibulinhoetec/|concurso30\.fundacaocefetminas\.org\.br/documentos/|([a-z0-9-]+\.)?ifsp\.edu\.br/|assets\.fatvestibulares\.com\.br/)' then raise exception 'invalid_input';end if;
 insert into private.study_documents(user_id,institution,year,selection,exam_url,answer_url,source_url,verified_on)
 values(p_user_id,p_document->>'institution',(p_document->>'year')::int,p_document->>'selection',p_document->>'examUrl',p_document->>'answerUrl',p_document->>'sourceUrl',(statement_timestamp() at time zone 'America/Sao_Paulo')::date)
 on conflict(user_id,institution,exam_url) do nothing;
end$$;
