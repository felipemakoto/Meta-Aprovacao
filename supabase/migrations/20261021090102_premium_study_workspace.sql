-- Additive Premium workspace. Free RPCs and historical attempts remain available.
create table private.study_institutions (
 id text primary key check(id ~ '^[a-z][a-z0-9-]{1,40}$'), name text not null,
 selection text not null, question_count int not null check(question_count between 5 and 100),
 duration_minutes int not null check(duration_minutes between 10 and 360),
 subjects jsonb not null check(jsonb_typeof(subjects)='object'), fixed_distribution boolean not null,
 source_url text not null check(source_url ~ '^https://'), verified_on date not null, notes text not null default ''
);
insert into private.study_institutions values
 ('etec','ETEC','Ensino Médio e Técnico · 2027/1',50,240,'{"matematica":10,"portugues":10,"ciencias":10,"historia":10,"geografia":10}',false,'https://vestibulinho.etec.sp.gov.br/duvidas-frequentes/','2026-10-21','Treino com cobertura equilibrada. O exame interdisciplinar não fixa cotas por matéria; não é reprodução de prova oficial.'),
 ('ifsp','IFSP','Técnico integrado · 2027/1',30,180,'{"matematica":15,"portugues":15}',true,'https://vtp.ifsp.edu.br/index.php/processo-seletivo-tecnico/4475-psi-2027.html','2026-10-21','15 questões de Português e 15 de Matemática. Questões do banco validado da plataforma.');
create table private.study_official_events (
 id bigint generated always as identity primary key, institution text not null references private.study_institutions,
 title text not null, event_date date not null, event_time time, kind text not null check(kind in('exam','registration','result')),
 source_url text not null check(source_url ~ '^https://'), verified_on date not null
);
insert into private.study_official_events(institution,title,event_date,event_time,kind,source_url,verified_on) values
 ('etec','Encerramento das inscrições · ETEC 2027/1','2026-11-03','20:00','registration','https://vestibulinho.etec.sp.gov.br/calendario/','2026-10-21'),
 ('etec','Vestibulinho ETEC 2027/1','2026-12-06','13:30','exam','https://vestibulinho.etec.sp.gov.br/calendario/','2026-10-21'),
 ('etec','Gabarito oficial · ETEC 2027/1','2026-12-09','15:00','result','https://vestibulinho.etec.sp.gov.br/calendario/','2026-10-21'),
 ('ifsp','Encerramento das inscrições · IFSP integrado 2027/1','2026-10-05',null,'registration','https://vtp.ifsp.edu.br/index.php/processo-seletivo-tecnico/4475-psi-2027.html','2026-10-21'),
 ('ifsp','Prova · IFSP integrado 2027/1','2026-11-22',null,'exam','https://vtp.ifsp.edu.br/index.php/processo-seletivo-tecnico/4475-psi-2027.html','2026-10-21'),
 ('ifsp','Resultado final · IFSP integrado 2027/1','2027-01-07',null,'result','https://vtp.ifsp.edu.br/index.php/processo-seletivo-tecnico/4475-psi-2027.html','2026-10-21');
create table private.study_profiles (
 user_id uuid primary key references auth.users on delete cascade,
 config jsonb not null, updated_at timestamptz not null default clock_timestamp(), plan_fingerprint text
);
create table private.study_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 title text not null check(char_length(title) between 1 and 120), study_date date not null,
 start_time time not null, minutes int not null check(minutes between 10 and 360),
 subject text check(subject in('matematica','portugues','ciencias','historia','geografia')),
 topic text not null default '' check(char_length(topic)<=160),
 kind text not null check(kind in('practice','review','flashcards','simulation','personal')),
 goal int not null check(goal between 1 and 100), reminder_minutes int not null default 15 check(reminder_minutes in(0,5,15,30,60)),
 completed_at timestamptz, archived boolean not null default false,
 source text not null check(source in('manual','plan')), plan_key text,
 request_id uuid, unique(user_id,request_id), unique(user_id,plan_key), updated_at timestamptz not null default clock_timestamp()
);
create index study_sessions_calendar_idx on private.study_sessions(user_id,study_date) where not archived;
create table private.study_repetition (
 user_id uuid not null references auth.users on delete cascade, question_id uuid not null references public.questions,
 mode text not null check(mode in('review','flashcard')), interval_days int not null check(interval_days between 1 and 180),
 ease numeric not null check(ease between 1.3 and 3), repetitions int not null check(repetitions>=0),
 due_at timestamptz not null, reviewed_at timestamptz not null, primary key(user_id,question_id,mode)
);
create table private.study_repetition_log (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 question_id uuid not null references public.questions, mode text not null check(mode in('review','flashcard')),
 rating int not null check(rating between 1 and 4), reviewed_at timestamptz not null default clock_timestamp(),
 request_id uuid not null, due_at timestamptz not null, unique(user_id,request_id)
);
create index study_repetition_due_idx on private.study_repetition(user_id,mode,due_at);
create table private.study_documents (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
 institution text not null references private.study_institutions, year int not null check(year between 2000 and 2100),
 selection text not null check(char_length(selection) between 1 and 120),
 exam_url text not null check(exam_url ~ '^https://'), answer_url text not null check(answer_url ~ '^https://'),
 source_url text not null check(source_url ~ '^https://'), verified_on date not null,
 unique nulls not distinct(user_id,institution,exam_url)
);
-- Link, do not copy or redistribute third-party PDFs. Source attribution is retained.
insert into private.study_documents(institution,year,selection,exam_url,answer_url,source_url,verified_on) values
 ('etec',2026,'1º semestre · Ensino Médio e Técnico','https://fatweb.s3.amazonaws.com/vestibulinhoetec/gabarito/20261176943/A-CADERNO-VESTIBULINHO-1SEM2026.pdf','https://fatweb.s3.amazonaws.com/vestibulinhoetec/gabarito/20261176943/A-GABARITO-VESTIBULINHO-1SEM2026.pdf','https://vestibulinho.etec.sp.gov.br/provas-gabaritos/','2026-10-21'),
 ('etec',2026,'2º semestre · Ensino Médio e Técnico','https://fatweb.s3.amazonaws.com/vestibulinhoetec/gabarito/20262210689/A-CADERNO-VESTIBULINHO-2SEM2026.pdf','https://fatweb.s3.amazonaws.com/vestibulinhoetec/gabarito/20262210689/A-GABARITO-VESTIBULINHO-2SEM2026.pdf','https://vestibulinho.etec.sp.gov.br/provas-gabaritos/','2026-10-21'),
 ('ifsp',2026,'Integrado · Tipo 1 · Gabarito preliminar','https://concurso30.fundacaocefetminas.org.br/documentos/CadernodeProvaTIPO1Integrado122639008142733807990.pdf','https://concurso30.fundacaocefetminas.org.br/documentos/GabaritoPreliminarIFSPintegradopublicado122639008143426588325.pdf','https://www.ifsp.edu.br/index.php/conict11/17-ultimas-noticias/5551-confira-os-gabaritos-preliminares-das-provas-de-selecao-dos-cursos-tecnicos','2026-10-21');
do $$declare tab text;begin foreach tab in array array['study_institutions','study_official_events','study_profiles','study_sessions','study_repetition','study_repetition_log','study_documents'] loop
 execute format('alter table private.%I enable row level security',tab);
 execute format('revoke all on private.%I from public,anon,authenticated,service_role',tab);
end loop;end$$;

create function private.require_study_premium(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 if not coalesce((private.subscription_access(p_user_id)->>'hasPremium')::boolean,false) then raise exception 'premium_required';end if;
end$$;
revoke all on function private.require_study_premium(uuid) from public,anon,authenticated,service_role;

-- A single observation stream feeds diagnosis, radar, repetitions and plan priorities.
create function private.study_observations(p_user_id uuid)
returns table(question_id uuid,subject text,topic text,difficulty text,correct boolean,answered_at timestamptz)
language sql stable security definer set search_path='' as $$
 select a.question_id,a.snapshot->>'subject',a.snapshot->>'topic',coalesce(a.snapshot->>'difficulty',q.difficulty::text,'unknown'),a.answer=a.snapshot->>'correctAnswer',a.completed_at
 from private.practice_attempts a left join public.questions q on q.id=a.question_id where a.user_id=p_user_id and a.completed_at is not null
 union all
 select (x->>'id')::uuid,x->>'subject',x->>'topic',coalesce(x->>'difficulty',q.difficulty::text,'unknown'),(x->>'correct')::boolean,a.completed_at
 from private.simulation_attempts a cross join lateral jsonb_array_elements(a.feedback->'questions') x
 left join public.questions q on q.id=(x->>'id')::uuid where a.user_id=p_user_id and a.completed_at is not null
 union all
 select (x->>'id')::uuid,x->>'subject',x->>'topic',coalesce(x->>'difficulty',q.difficulty::text,'unknown'),(x->>'correct')::boolean,a.completed_at
 from private.quiz_result_owners o join private.guest_quiz_results a on a.attempt_id=o.attempt_id
 cross join lateral jsonb_array_elements(a.feedback->'questions') x left join public.questions q on q.id=(x->>'id')::uuid where o.user_id=p_user_id;
$$;
revoke all on function private.study_observations(uuid) from public,anon,authenticated,service_role;

create function public.premium_study_workspace(p_user_id uuid,p_days int default 30) returns jsonb
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
 'sessions',(select coalesce(jsonb_agg(to_jsonb(s)-'user_id'-'request_id' order by study_date,start_time),'[]') from (select * from private.study_sessions where user_id=p_user_id and not archived and study_date between current_date-90 and current_date+730 order by study_date,start_time limit 1000) s),
 'documents',(select coalesce(jsonb_agg(to_jsonb(d)-'user_id' order by year desc,selection),'[]') from private.study_documents d where d.user_id is null or d.user_id=p_user_id),
 'reviewHistory',(select coalesce(jsonb_agg(to_jsonb(h)-'user_id'-'request_id' order by reviewed_at desc),'[]') from (select * from private.study_repetition_log where user_id=p_user_id order by reviewed_at desc limit 50) h),
 'due',(select jsonb_build_object('review',count(*) filter(where mode='review'),'flashcard',count(*) filter(where mode='flashcard')) from private.study_repetition where user_id=p_user_id and due_at<=t),
 'topics',(select coalesce(jsonb_agg(r),'[]') from (select distinct subject,topic from public.questions where status='published' order by subject,topic) r),
 'exams',(select coalesce(jsonb_agg(to_jsonb(e) order by started_at desc),'[]') from (select id,title,started_at,expires_at,completed_at from private.simulation_attempts where user_id=p_user_id and premium_config is not null order by started_at desc limit 20) e));
end$$;

create function public.premium_study_profile(p_user_id uuid,p_config jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_study_premium(p_user_id);
 if p_config is null or jsonb_typeof(p_config)<>'object' or exists(select 1 from jsonb_each(p_config) x where x.value='null'::jsonb) or not p_config ?& array['institution','examDate','weekdays','minutes','startTime','dailyGoal','weeklyGoal','reminder'] or (select count(*) from jsonb_object_keys(p_config))<>8
 or not exists(select 1 from private.study_institutions where id=p_config->>'institution')
 or (p_config->>'examDate')::date not between current_date and current_date+730
 or jsonb_typeof(p_config->'weekdays')<>'array' or jsonb_array_length(p_config->'weekdays') not between 1 and 7
 or exists(select 1 from jsonb_array_elements(p_config->'weekdays') x where jsonb_typeof(x)<>'number' or x::text !~ '^[0-6]$')
 or (select count(distinct x) from jsonb_array_elements(p_config->'weekdays') x)<>jsonb_array_length(p_config->'weekdays')
 or (p_config->>'minutes')::int not between 15 and 240 or p_config->>'startTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 or (p_config->>'dailyGoal')::int not between 1 and 100 or (p_config->>'weeklyGoal')::int not between 1 and 700
 or (p_config->>'reminder')::int not in(0,5,15,30,60) then raise exception 'invalid_input';end if;
 insert into private.study_profiles(user_id,config) values(p_user_id,p_config)
 on conflict(user_id) do update set config=excluded.config,updated_at=clock_timestamp(),plan_fingerprint=null;
end$$;

create function public.premium_study_session(p_user_id uuid,p_id uuid,p_request_id uuid,p_session jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 perform private.require_study_premium(p_user_id);
 if p_request_id is null or p_session is null or jsonb_typeof(p_session)<>'object' or exists(select 1 from jsonb_each(p_session) x where x.value='null'::jsonb) or not p_session ?& array['title','date','time','minutes','subject','topic','kind','goal','reminder','completed','archived']
 or (select count(*) from jsonb_object_keys(p_session))<>11 or char_length(p_session->>'title') not between 1 and 120
 or (p_session->>'date')::date not between current_date-90 and current_date+730
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
  if (select count(*) from private.study_sessions where user_id=p_user_id and not archived and study_date>=current_date)>1000 then raise exception 'activity_limit';end if;
  insert into private.study_sessions(user_id,title,study_date,start_time,minutes,subject,topic,kind,goal,reminder_minutes,source,request_id)
  values(p_user_id,p_session->>'title',(p_session->>'date')::date,(p_session->>'time')::time,(p_session->>'minutes')::int,nullif(p_session->>'subject',''),p_session->>'topic',p_session->>'kind',(p_session->>'goal')::int,(p_session->>'reminder')::int,'manual',p_request_id) returning id into target;
 end if;
 return target;
end$$;

create function public.premium_study_sync_plan(p_user_id uuid,p_version timestamptz,p_fingerprint text,p_sessions jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare x jsonb;
begin
 perform private.require_study_premium(p_user_id);
 perform 1 from private.study_profiles where user_id=p_user_id and updated_at=p_version for update;
 if not found then raise exception 'plan_changed';end if;
 if p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_sessions is null or jsonb_typeof(p_sessions)<>'array' or jsonb_array_length(p_sessions)>100 then raise exception 'invalid_input';end if;
 if exists(select 1 from private.study_profiles where user_id=p_user_id and plan_fingerprint=p_fingerprint) then return;end if;
 -- Never overwrite manual edits or completed work. Obsolete generated tasks are archived, not deleted.
 update private.study_sessions set archived=true where user_id=p_user_id and source='plan' and completed_at is null and study_date>=current_date;
 for x in select value from jsonb_array_elements(p_sessions) loop
  if (x->>'date')::date not between current_date and current_date+28 or x->>'key' !~ '^[0-9-]{10}:[0-2]$' then raise exception 'invalid_input';end if;
  insert into private.study_sessions(user_id,title,study_date,start_time,minutes,subject,topic,kind,goal,reminder_minutes,source,plan_key)
  values(p_user_id,x->>'title',(x->>'date')::date,(x->>'time')::time,(x->>'minutes')::int,x->>'subject',x->>'topic',x->>'kind',(x->>'goal')::int,(x->>'reminder')::int,'plan',x->>'key')
  on conflict(user_id,plan_key) do update set title=excluded.title,start_time=excluded.start_time,minutes=excluded.minutes,subject=excluded.subject,topic=excluded.topic,kind=excluded.kind,goal=excluded.goal,reminder_minutes=excluded.reminder_minutes,archived=false,updated_at=clock_timestamp()
  where private.study_sessions.source='plan' and private.study_sessions.completed_at is null;
 end loop;
 update private.study_profiles set plan_fingerprint=p_fingerprint where user_id=p_user_id;
end$$;

create function public.premium_study_cards(p_user_id uuid,p_subject text,p_topic text,p_mode text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_study_premium(p_user_id);
 if p_mode not in('review','flashcard') or p_subject not in('','matematica','portugues','ciencias','historia','geografia') or char_length(p_topic)>160 then raise exception 'invalid_input';end if;
 return (with observations as materialized(select * from private.study_observations(p_user_id)),last_answers as (select distinct on(question_id) question_id,correct from observations order by question_id,answered_at desc),error_counts as(select question_id,count(*) n from observations where not correct group by question_id),
 cards as (select q.id,q.subject,q.topic,q.statement,a.correct_answer answer,a.explanation,
 jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e) options,r.due_at,r.interval_days,
 coalesce(ec.n,0) errors
 from public.questions q join public.question_answers a on a.question_id=q.id
 left join private.study_repetition r on r.user_id=p_user_id and r.question_id=q.id and r.mode=p_mode
 left join last_answers l on l.question_id=q.id
 left join error_counts ec on ec.question_id=q.id
 where q.status='published' and (p_subject='' or q.subject=p_subject) and (p_topic='' or q.topic=p_topic)
 and (r.due_at is null or r.due_at<=clock_timestamp()) and (p_mode='flashcard' or l.correct=false or r.question_id is not null)
 order by r.due_at nulls last,q.id limit 40)
 select coalesce(jsonb_agg(to_jsonb(cards)),'[]') from cards);
end$$;

create function public.premium_study_rate(p_user_id uuid,p_question_id uuid,p_mode text,p_rating int,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.study_repetition;old private.study_repetition_log;gap int;e numeric;reps int;due timestamptz;t timestamptz:=clock_timestamp();
begin
 perform private.require_study_premium(p_user_id);
 if p_mode not in('review','flashcard') or p_rating not between 1 and 4 or p_request_id is null or not exists(select 1 from public.questions q join public.question_answers a on a.question_id=q.id where q.id=p_question_id and q.status='published') then raise exception 'invalid_input';end if;
 perform pg_advisory_xact_lock(hashtextextended('study-rate:'||p_user_id::text,0));
 select * into old from private.study_repetition_log where user_id=p_user_id and request_id=p_request_id;
 if found then
  if old.question_id<>p_question_id or old.mode<>p_mode or old.rating<>p_rating then raise exception 'invalid_input';end if;
  return jsonb_build_object('dueAt',old.due_at);
 end if;
 select * into s from private.study_repetition where user_id=p_user_id and question_id=p_question_id and mode=p_mode for update;
 if found and s.due_at>t then raise exception 'review_not_due';end if;
 if p_mode='review' and not found and not exists(select 1 from private.study_observations(p_user_id) where question_id=p_question_id and not correct) then raise exception 'activity_unavailable';end if;
 e:=greatest(1.3,least(3,coalesce(s.ease,2.5)+case p_rating when 1 then -.2 when 2 then -.15 when 4 then .15 else 0 end));
 reps:=case when p_rating=1 then 0 else coalesce(s.repetitions,0)+1 end;
 gap:=case p_rating when 1 then 1 when 2 then greatest(1,round(coalesce(s.interval_days,1)*1.2)::int) when 4 then greatest(4,round(coalesce(s.interval_days,2)*e*1.3)::int) else case when reps=1 then 1 when reps=2 then 6 else round(s.interval_days*e)::int end end;
 gap:=least(180,gap);due:=t+make_interval(days=>gap);
 insert into private.study_repetition values(p_user_id,p_question_id,p_mode,gap,e,reps,due,t)
 on conflict(user_id,question_id,mode) do update set interval_days=excluded.interval_days,ease=excluded.ease,repetitions=excluded.repetitions,due_at=excluded.due_at,reviewed_at=excluded.reviewed_at;
 insert into private.study_repetition_log(user_id,question_id,mode,rating,request_id,due_at) values(p_user_id,p_question_id,p_mode,p_rating,p_request_id,due);
 return jsonb_build_object('dueAt',due);
end$$;

create function public.premium_study_document(p_user_id uuid,p_document jsonb) returns void
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
 values(p_user_id,p_document->>'institution',(p_document->>'year')::int,p_document->>'selection',p_document->>'examUrl',p_document->>'answerUrl',p_document->>'sourceUrl',current_date)
 on conflict(user_id,institution,exam_url) do nothing;
end$$;

alter table private.simulation_attempts add column premium_config jsonb,
 add column premium_request_id uuid, add column study_draft jsonb not null default '{}',
 add column study_marked jsonb not null default '[]', add column draft_revision bigint not null default 0;
create unique index premium_exam_request_idx on private.simulation_attempts(user_id,premium_request_id) where premium_request_id is not null;
insert into private.simulations(id,title,question_count,subject,published,free_access)
 values('f7f10000-0000-4000-8000-000000000001','Modelo interno · simulado personalizado',5,'matematica',false,false);

create function public.premium_study_start_exam(p_user_id uuid,p_config jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare inst private.study_institutions;chosen jsonb;amount int;minutes int;existing private.simulation_attempts;
 target uuid;title text;reused int;
begin
 perform private.require_study_premium(p_user_id);
 perform pg_advisory_xact_lock(hashtextextended('premium-exam:'||p_user_id::text,0));
 if p_request_id is null or p_config is null or jsonb_typeof(p_config)<>'object' or exists(select 1 from jsonb_each(p_config) x where x.value='null'::jsonb) or not p_config ?& array['mode','institution','subjects','topics','difficulty','count','minutes']
 or (select count(*) from jsonb_object_keys(p_config))<>7 or p_config->>'mode' not in('realistic','custom') then raise exception 'invalid_input';end if;
 select * into inst from private.study_institutions where id=p_config->>'institution';
 if not found then raise exception 'institution_unavailable';end if;
 select * into existing from private.simulation_attempts where user_id=p_user_id and premium_request_id=p_request_id;
 if found then
  if existing.premium_config->'input'<>p_config then raise exception 'invalid_input';end if;
  return public.read_simulation(p_user_id,existing.id);
 end if;
 if (select count(*) from private.simulation_attempts where user_id=p_user_id and started_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'rate_limited';end if;
 if p_config->>'mode'='realistic' then amount:=inst.question_count;minutes:=inst.duration_minutes;
 else
  if jsonb_typeof(p_config->'subjects')<>'array' or jsonb_array_length(p_config->'subjects') not between 1 and 5
   or exists(select 1 from jsonb_array_elements_text(p_config->'subjects') s where not inst.subjects ? s)
   or jsonb_typeof(p_config->'topics')<>'array' or jsonb_array_length(p_config->'topics')>30
   or exists(select 1 from jsonb_array_elements_text(p_config->'topics') s where char_length(s)>160)
   or p_config->>'difficulty' not in('all','easy','medium','hard') or (p_config->>'count')::int not between 5 and 100 or (p_config->>'minutes')::int not between 10 and 360 then raise exception 'invalid_input';end if;
  amount:=(p_config->>'count')::int;minutes:=(p_config->>'minutes')::int;
 end if;
 with seen as (
  select question_id,max(answered_at) at from private.study_observations(p_user_id) group by question_id
  union all select (q->>'id')::uuid,max(a.started_at) from private.simulation_attempts a cross join lateral jsonb_array_elements(a.snapshots) q where a.user_id=p_user_id and a.started_at>clock_timestamp()-interval '7 days' group by q->>'id'
 ), last_seen as (select question_id,max(at) at from seen group by question_id), candidates as (
  select q.*,a.correct_answer,a.explanation,l.at seen_at,row_number() over(partition by q.subject order by l.at nulls first,random()) rank
  from public.questions q join public.question_answers a on a.question_id=q.id left join last_seen l on l.question_id=q.id
  where q.status='published' and inst.subjects ? q.subject and q.target_exam::text in('both',case when inst.id='ifsp' then 'if' else inst.id end)
  and (p_config->>'mode'='realistic' or (p_config->'subjects' ? q.subject and (jsonb_array_length(p_config->'topics')=0 or p_config->'topics' ? q.topic) and (p_config->>'difficulty'='all' or q.difficulty::text=p_config->>'difficulty')))
 ), picked as (
  select * from candidates where p_config->>'mode'='custom' or rank<=(inst.subjects->>subject)::int
  order by seen_at nulls first,rank,subject limit amount
 ), ordered as (select *,row_number() over(order by subject,rank) position from picked)
 select jsonb_agg(jsonb_build_object('id',id,'position',position,'version',version,'subject',subject,'topic',topic,'difficulty',difficulty,'statement',statement,
 'options',jsonb_build_array(option_a,option_b,option_c,option_d,option_e),'correctAnswer',correct_answer,'explanation',explanation) order by position),count(*) filter(where seen_at is not null) into chosen,reused from ordered;
 if chosen is null or jsonb_array_length(chosen)<>amount then raise exception 'content_insufficient';end if;
 title:=case when p_config->>'mode'='realistic' then 'Formato '||inst.name else 'Personalizado · '||inst.name end;
 insert into private.simulation_attempts(user_id,simulation_id,title,expires_at,snapshots,premium_config,premium_request_id)
 values(p_user_id,'f7f10000-0000-4000-8000-000000000001',title,clock_timestamp()+make_interval(mins=>minutes),chosen,
 jsonb_build_object('input',p_config,'mode',p_config->>'mode','institution',inst.id,'sourceUrl',inst.source_url,'verifiedOn',inst.verified_on,'notes',inst.notes,'durationMinutes',minutes,'reusedQuestions',reused),p_request_id) returning id into target;
 return public.read_simulation(p_user_id,target);
end$$;

create function private.finish_study_exam(p_user_id uuid,p_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.simulation_attempts;q jsonb;normalized_answers jsonb;draft jsonb;finished timestamptz;result jsonb;
begin
 perform private.require_study_premium(p_user_id);
 select * into a from private.simulation_attempts where id=p_id and user_id=p_user_id and premium_config is not null for update;
 if not found then raise exception 'attempt_unavailable';end if;
 if a.completed_at is not null then return a.feedback;end if;
 draft:=a.study_draft;
 if clock_timestamp()<a.expires_at and p_answers is not null then
  if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)>jsonb_array_length(a.snapshots) then raise exception 'invalid_answers';end if;
  if exists(select 1 from jsonb_array_elements(p_answers) x where jsonb_typeof(x)<>'object' or (select count(*) from jsonb_object_keys(x))<>2 or not x ?& array['questionId','answer'] or x->>'answer' !~ '^[A-E-]$'
   or not exists(select 1 from jsonb_array_elements(a.snapshots) s where s->>'id'=x->>'questionId')) or
  (select count(distinct x->>'questionId') from jsonb_array_elements(p_answers) x)<>jsonb_array_length(p_answers) then raise exception 'invalid_answers';end if;
  select coalesce(jsonb_object_agg(x->>'questionId',x->>'answer'),'{}') into draft from jsonb_array_elements(p_answers) x;
 end if;
 finished:=least(clock_timestamp(),a.expires_at);
 select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer',coalesce(draft->> (x->>'id'),'-')) order by x->>'id') into normalized_answers from jsonb_array_elements(a.snapshots) x;
 select jsonb_build_object('id',a.id,'title',a.title,'timed',true,'completedAt',finished,'durationSeconds',greatest(0,floor(extract(epoch from finished-a.started_at)))::int,
 'total',jsonb_array_length(a.snapshots),'score',count(*) filter(where x->>'correctAnswer'=draft->> (x->>'id')),
 'questions',jsonb_agg(jsonb_build_object('id',x->>'id','position',(x->>'position')::int,'subject',x->>'subject','topic',x->>'topic','difficulty',x->>'difficulty','statement',x->>'statement','options',x->'options',
 'answer',coalesce(draft->> (x->>'id'),'-'),'correctAnswer',x->>'correctAnswer','correct',coalesce(x->>'correctAnswer'=draft->> (x->>'id'),false),'explanation',x->>'explanation') order by (x->>'position')::int)) into result from jsonb_array_elements(a.snapshots) x;
 update private.simulation_attempts set answers=normalized_answers,feedback=result,completed_at=finished where id=a.id;
 return result;
end$$;

alter function public.submit_simulation(uuid,uuid,jsonb) rename to submit_simulation_before_study;
revoke all on function public.submit_simulation_before_study(uuid,uuid,jsonb) from public,anon,authenticated,service_role;
create function public.submit_simulation(p_user_id uuid,p_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from private.simulation_attempts where id=p_id and user_id=p_user_id and premium_config is not null) then
  return private.finish_study_exam(p_user_id,p_id,p_answers);
 end if;
 return public.submit_simulation_before_study(p_user_id,p_id,p_answers);
end$$;
revoke all on function public.submit_simulation(uuid,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.submit_simulation(uuid,uuid,jsonb) to service_role;
revoke all on function private.finish_study_exam(uuid,uuid,jsonb) from public,anon,authenticated,service_role;

create function public.premium_study_save_exam(p_user_id uuid,p_id uuid,p_answers jsonb,p_marked jsonb,p_revision bigint) returns void
language plpgsql security definer set search_path='' as $$
declare a private.simulation_attempts;
begin
 perform private.require_study_premium(p_user_id);
 select * into a from private.simulation_attempts where id=p_id and user_id=p_user_id and premium_config is not null for update;
 if not found or a.completed_at is not null or a.expires_at<=clock_timestamp() then raise exception 'attempt_unavailable';end if;
 if p_revision<=a.draft_revision then raise exception 'draft_conflict';end if;
 if p_revision>a.draft_revision+10000 or jsonb_typeof(p_answers)<>'object' or (select count(*) from jsonb_object_keys(p_answers))>100 or jsonb_typeof(p_marked)<>'array' or jsonb_array_length(p_marked)>100
 or exists(select 1 from jsonb_each(p_answers) x where x.value::text !~ '^"[A-E]"$' or not exists(select 1 from jsonb_array_elements(a.snapshots) q where q->>'id'=x.key))
 or exists(select 1 from jsonb_array_elements_text(p_marked) m where not exists(select 1 from jsonb_array_elements(a.snapshots) q where q->>'id'=m)) then raise exception 'invalid_answers';end if;
 update private.simulation_attempts set study_draft=p_answers,study_marked=p_marked,draft_revision=p_revision where id=a.id;
end$$;

create function public.premium_study_finish_exam(p_user_id uuid,p_id uuid,p_answers jsonb) returns jsonb
language sql security definer set search_path='' as $$ select jsonb_build_object('result',private.finish_study_exam(p_user_id,p_id,p_answers));$$;

-- Existing routes are also guarded: knowing an attempt ID never bypasses Premium.
alter function public.read_simulation(uuid,uuid) rename to read_simulation_before_study;
revoke all on function public.read_simulation_before_study(uuid,uuid) from public,anon,authenticated,service_role;
create function public.read_simulation(p_user_id uuid,p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.simulation_attempts;r jsonb;
begin
 select * into a from private.simulation_attempts where user_id=p_user_id and id=p_id;
 if a.premium_config is null then return public.read_simulation_before_study(p_user_id,p_id);end if;
 perform private.require_study_premium(p_user_id);
 if a.completed_at is not null then return jsonb_build_object('result',a.feedback);end if;
 if a.expires_at<=clock_timestamp() then return jsonb_build_object('result',private.finish_study_exam(p_user_id,p_id,null));end if;
 r:=public.read_simulation_before_study(p_user_id,p_id);
 return jsonb_set(r,'{quiz,premium}',a.premium_config||jsonb_build_object('draft',a.study_draft,'marked',a.study_marked,'revision',a.draft_revision));
end$$;

create index study_exam_expiry_idx on private.simulation_attempts(expires_at) where premium_config is not null and completed_at is null;
create function private.grade_expired_study_exams() returns integer
language plpgsql security definer set search_path='' as $$
declare a record;graded int:=0;
begin
 for a in select id,user_id from private.simulation_attempts where premium_config is not null and completed_at is null and expires_at<=clock_timestamp()
 and coalesce((private.subscription_access(user_id)->>'hasPremium')::boolean,false)
 order by expires_at limit 100 for update skip locked loop
  begin perform private.finish_study_exam(a.user_id,a.id,null);graded:=graded+1;
  exception when raise_exception then if sqlerrm not in('premium_required','login_required') then raise;end if;end;
 end loop;
 return graded;
end$$;
revoke all on function private.grade_expired_study_exams() from public,anon,authenticated,service_role;
-- Separate educational job. Existing Cakto dispatch/monitor jobs are not changed.
select cron.schedule('meta-grade-study-exams','* * * * *','select private.grade_expired_study_exams()');

-- Keep service-only ACLs explicit for every new public entry point.
do $$declare f record;begin for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'premium_study_%' or p.proname='read_simulation') loop
 execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
end loop;end$$;
