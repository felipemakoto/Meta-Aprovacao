create table public.site_status (
  id smallint primary key default 1 check (id = 1),
  announcement text check (char_length(announcement) between 1 and 300),
  maintenance boolean not null default false
);

insert into public.site_status default values;

alter table public.site_status enable row level security;
revoke all on public.site_status from public, anon, authenticated, service_role;
grant select, update (announcement, maintenance) on public.site_status to service_role;
