create table private.quiz_result_owners (
  attempt_id uuid primary key references public.guest_quiz_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_at timestamptz not null default clock_timestamp()
);
create index quiz_result_owners_user_idx on private.quiz_result_owners(user_id, saved_at desc, attempt_id);
alter table private.quiz_result_owners enable row level security;
revoke all on private.quiz_result_owners from public, anon, authenticated, service_role;

-- Somente o servidor passa o ID obtido por auth.getUser, nunca do payload.
create function public.claim_quiz_result(p_token_hash text, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.guest_quiz_attempts%rowtype; owner_id uuid;
begin
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null)
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'attempt_unavailable';
  end if;
  select * into a from public.guest_quiz_attempts where token_hash=p_token_hash for update;
  if not found then raise exception 'attempt_unavailable'; end if;
  select user_id into owner_id from private.quiz_result_owners where attempt_id=a.id;
  if owner_id is not null then
    if owner_id=p_user_id then return a.id; end if;
    raise exception 'attempt_unavailable';
  end if;
  if a.completed_at is null or a.expires_at<=clock_timestamp()
    or not exists(select 1 from private.guest_quiz_results where attempt_id=a.id) then
    raise exception 'attempt_unavailable';
  end if;
  insert into private.quiz_result_owners(attempt_id,user_id) values(a.id,p_user_id);
  -- Encerra o acesso anônimo. A leitura autenticada não depende deste prazo.
  update public.guest_quiz_attempts set expires_at=clock_timestamp() where id=a.id;
  return a.id;
end;
$$;

create function public.read_saved_quiz_result(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select r.feedback from private.quiz_result_owners o
  join private.guest_quiz_results r on r.attempt_id=o.attempt_id
  where o.user_id=p_user_id
  order by o.saved_at desc, o.attempt_id limit 1;
$$;
revoke all on function public.claim_quiz_result(text,uuid), public.read_saved_quiz_result(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.claim_quiz_result(text,uuid), public.read_saved_quiz_result(uuid) to service_role;
