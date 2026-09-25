-- Etapa 8: conteúdo e gabarito separados, sem acesso direto do navegador.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  statement text not null check (char_length(btrim(statement)) between 1 and 20000),
  option_a text not null check (char_length(btrim(option_a)) between 1 and 4000),
  option_b text not null check (char_length(btrim(option_b)) between 1 and 4000),
  option_c text not null check (char_length(btrim(option_c)) between 1 and 4000),
  option_d text not null check (char_length(btrim(option_d)) between 1 and 4000),
  option_e text not null check (char_length(btrim(option_e)) between 1 and 4000),
  subject text not null check (subject in ('matematica', 'portugues', 'ciencias', 'historia', 'geografia')),
  topic text not null check (char_length(btrim(topic)) between 1 and 160),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  target_exam text not null check (target_exam in ('etec', 'if', 'both')),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_answers (
  question_id uuid primary key references public.questions(id) on delete restrict,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),
  explanation text not null check (char_length(btrim(explanation)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger interno: sem SECURITY DEFINER, sem RPC pública e sem acesso aos gabaritos.
create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated, service_role;

create trigger questions_updated_at
before update on public.questions
for each row execute function private.set_updated_at();

create trigger question_answers_updated_at
before update on public.question_answers
for each row execute function private.set_updated_at();

alter table public.questions enable row level security;
alter table public.question_answers enable row level security;

-- Ausência intencional de policies: RLS nega acesso aos papéis comuns.
-- Revogar também defaults herdados de service_role e conceder só a leitura necessária.
revoke all on table public.questions, public.question_answers from public, anon, authenticated, service_role;
grant select on table public.questions, public.question_answers to service_role;

comment on table public.questions is
  'Banco restrito ao servidor. Retornar apenas questões selecionadas para uma tentativa válida. Novas questões começam em draft e exigem revisão humana.';
comment on table public.question_answers is
  'Gabarito e explicação protegidos. Leitura privilegiada somente no servidor após validar a tentativa; nunca enviar junto ao enunciado.';
comment on column public.questions.version is
  'Versão editorial positiva. Mudanças em questões usadas devem criar outro registro/versão; tentativas futuras preservarão id e versão.';
