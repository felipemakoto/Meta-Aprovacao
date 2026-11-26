alter table public.site_status
  add column maintenance_message text
  check (char_length(maintenance_message) between 1 and 300);

grant update (maintenance_message) on public.site_status to service_role;
