-- Etapa 23: limites confirmados pelo usuário. Todos os usuários atuais são gratuitos.
alter table private.simulations add column free_access boolean not null default false;
alter table private.simulations add constraint free_simulation_format check(not free_access or (question_count=10 and subject is null));
update private.simulations set free_access=true where title='Simulado rápido' and question_count=10 and subject is null;
create index simulation_daily_idx on private.simulation_attempts(user_id,started_at);

-- A tentativa é o registro de consumo, inclusive quando abandonada. Não há contador no cliente.
create function private.daily_limits(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp(); day_start timestamptz; next_day timestamptz; p int; s int;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 day_start:=((t at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo';
 next_day:=(((t at time zone 'America/Sao_Paulo')::date+1)::timestamp at time zone 'America/Sao_Paulo');
 select count(*)::int into p from private.practice_attempts where user_id=p_user_id and created_at>=day_start and created_at<=t;
 select count(*)::int into s from private.simulation_attempts where user_id=p_user_id and started_at>=day_start and started_at<=t;
 return jsonb_build_object('resetsAt',next_day,'practice',jsonb_build_object('limit',10,'used',p,'remaining',greatest(0,10-p)),
  'simulations',jsonb_build_object('limit',1,'used',s,'remaining',greatest(0,1-s)));
end;$$;
create function public.read_daily_limits(p_user_id uuid) returns jsonb
language sql security definer set search_path='' as $$ select private.daily_limits(p_user_id); $$;

-- Os implementadores anteriores ficam privados e sem EXECUTE para a API.
alter function public.start_question_practice(uuid,text,text,text,text,uuid) set schema private;
alter function public.start_simulation(uuid,uuid) set schema private;
alter function public.simulation_catalog(uuid) set schema private;
revoke all on function private.start_question_practice(uuid,text,text,text,text,uuid),private.start_simulation(uuid,uuid),private.simulation_catalog(uuid) from public,anon,authenticated,service_role;

create table private.practice_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 input jsonb not null,
 attempt_id uuid not null references private.practice_attempts(id) on delete cascade,
 primary key(user_id,request_id)
);
alter table private.practice_requests enable row level security;
revoke all on private.practice_requests from public,anon,authenticated,service_role;

create function private.start_limited_practice(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare usage jsonb; result jsonb; stored private.practice_requests%rowtype; a private.practice_attempts%rowtype;
 input jsonb:=jsonb_build_array(p_subject,p_topic,p_difficulty,p_exam,p_previous);
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));
 usage:=private.daily_limits(p_user_id);
 if p_request_id is not null then
  select * into stored from private.practice_requests where user_id=p_user_id and request_id=p_request_id;
  if found then
   if stored.input<>input then raise exception 'invalid_input';end if;
   select * into a from private.practice_attempts where id=stored.attempt_id and user_id=p_user_id;
   if a.expires_at<=clock_timestamp() then raise exception 'attempt_unavailable';end if;
   return jsonb_build_object('id',a.id,'questionId',a.question_id,'expiresAt',a.expires_at,'subject',a.snapshot->>'subject',
    'topic',a.snapshot->>'topic','statement',a.snapshot->>'statement','options',a.snapshot->'options');
  end if;
 end if;
 if (usage->'practice'->>'remaining')::int=0 then raise exception 'daily_practice_limit';end if;
 result:=private.start_question_practice(p_user_id,p_subject,p_topic,p_difficulty,p_exam,p_previous);
 if result is not null and p_request_id is not null then
  insert into private.practice_requests values(p_user_id,p_request_id,input,(result->>'id')::uuid);
 end if;
 return result;
end;$$;
create function public.start_question_practice(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid)
returns jsonb language sql security definer set search_path='' as $$
 select private.start_limited_practice(p_user_id,p_subject,p_topic,p_difficulty,p_exam,p_previous,null);
$$;
create function public.start_question_practice_request(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_request_id is null then raise exception 'invalid_input';end if;
 return private.start_limited_practice(p_user_id,p_subject,p_topic,p_difficulty,p_exam,p_previous,p_request_id);
end;$$;

create function public.simulation_catalog(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare catalog jsonb;
begin
 catalog:=private.simulation_catalog(p_user_id);
 return (select coalesce(jsonb_agg(item order by ord),'[]'::jsonb) from jsonb_array_elements(catalog) with ordinality x(item,ord)
  join private.simulations s on s.id=(item->>'id')::uuid where s.free_access);
end;$$;
create function public.start_simulation(p_user_id uuid,p_simulation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare usage jsonb; existing uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));
 usage:=private.daily_limits(p_user_id);
 -- Retomar uma tentativa existente não consome outro simulado, mesmo se o modelo mudou.
 select id into existing from private.simulation_attempts where user_id=p_user_id and simulation_id=p_simulation_id
  and completed_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
 if found then return public.read_simulation(p_user_id,existing);end if;
 if not exists(select 1 from private.simulations where id=p_simulation_id and free_access and published) then raise exception 'simulation_unavailable';end if;
 if (usage->'simulations'->>'remaining')::int=0 then raise exception 'daily_simulation_limit';end if;
 return private.start_simulation(p_user_id,p_simulation_id);
end;$$;

revoke all on function private.daily_limits(uuid),private.start_limited_practice(uuid,text,text,text,text,uuid,uuid),
 public.read_daily_limits(uuid),public.start_question_practice(uuid,text,text,text,text,uuid),
 public.start_question_practice_request(uuid,text,text,text,text,uuid,uuid),public.simulation_catalog(uuid),public.start_simulation(uuid,uuid)
 from public,anon,authenticated,service_role;
grant execute on function public.read_daily_limits(uuid),public.start_question_practice(uuid,text,text,text,text,uuid),
 public.start_question_practice_request(uuid,text,text,text,text,uuid,uuid),public.simulation_catalog(uuid),public.start_simulation(uuid,uuid) to service_role;
