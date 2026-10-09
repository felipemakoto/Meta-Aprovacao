-- Etapa 33: direitos atuais vêm do período pago, nunca do cliente ou do status comercial.
create or replace function private.daily_limits(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp(); day_start timestamptz; next_day timestamptz; p int; s int; access jsonb; premium boolean;
begin
 access:=private.subscription_access(p_user_id);premium:=(access->>'hasPremium')::boolean;
 day_start:=((t at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo';
 next_day:=(((t at time zone 'America/Sao_Paulo')::date+1)::timestamp at time zone 'America/Sao_Paulo');
 select count(*)::int into p from private.practice_attempts where user_id=p_user_id and created_at>=day_start and created_at<=t;
 select count(*)::int into s from private.simulation_attempts where user_id=p_user_id and started_at>=day_start and started_at<=t;
 return jsonb_build_object('hasPremium',premium,'accessUntil',access->'accessUntil','resetsAt',next_day,
 'practice',jsonb_build_object('limit',case when premium then null else 10 end,'used',p,'remaining',case when premium then null else greatest(0,10-p) end),
 'simulations',jsonb_build_object('limit',case when premium then null else 1 end,'used',s,'remaining',case when premium then null else greatest(0,1-s) end));
end;$$;

create or replace function private.start_limited_practice(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid,p_request_id uuid)
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
 if not (usage->>'hasPremium')::boolean and (usage->'practice'->>'remaining')::int=0 then raise exception 'daily_practice_limit';end if;
 result:=private.start_question_practice(p_user_id,p_subject,p_topic,p_difficulty,p_exam,p_previous);
 if result is not null and p_request_id is not null then
  insert into private.practice_requests values(p_user_id,p_request_id,input,(result->>'id')::uuid);
 end if;
 return result;
end;$$;

create or replace function public.simulation_catalog(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare catalog jsonb;premium boolean;
begin
 premium:=(private.subscription_access(p_user_id)->>'hasPremium')::boolean;
 catalog:=private.simulation_catalog(p_user_id);
 return (select coalesce(jsonb_agg(item order by ord),'[]'::jsonb) from jsonb_array_elements(catalog) with ordinality x(item,ord)
  join private.simulations s on s.id=(item->>'id')::uuid where premium or s.free_access);
end;$$;

create or replace function public.start_simulation(p_user_id uuid,p_simulation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare usage jsonb; existing uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));
 usage:=private.daily_limits(p_user_id);
 -- Tentativa já iniciada continua disponível após expiração do Premium ou esgotamento da cota.
 select id into existing from private.simulation_attempts where user_id=p_user_id and simulation_id=p_simulation_id
  and completed_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
 if found then return public.read_simulation(p_user_id,existing);end if;
 if not exists(select 1 from private.simulations where id=p_simulation_id and published and (free_access or (usage->>'hasPremium')::boolean)) then raise exception 'simulation_unavailable';end if;
 if not (usage->>'hasPremium')::boolean and (usage->'simulations'->>'remaining')::int=0 then raise exception 'daily_simulation_limit';end if;
 return private.start_simulation(p_user_id,p_simulation_id);
end;$$;

-- CREATE OR REPLACE conserva ACLs; reforçar a proibição de acesso direto aos implementadores.
revoke all on function private.daily_limits(uuid),private.start_limited_practice(uuid,text,text,text,text,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.simulation_catalog(uuid),public.start_simulation(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.simulation_catalog(uuid),public.start_simulation(uuid,uuid) to service_role;
