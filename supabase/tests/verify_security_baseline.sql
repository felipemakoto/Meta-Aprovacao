-- Somente leitura. Executar depois da migration; todas as linhas devem ser true.
with target_owner as (
  select oid from pg_roles where rolname = 'postgres'
), object_types as (
  select unnest(array['r', 'S', 'f']::"char"[]) as kind
), effective_defaults as (
  select t.kind,
    coalesce(d.defaclacl, acldefault(t.kind, o.oid)) as permissions
  from target_owner o cross join object_types t
  left join pg_default_acl d
    on d.defaclrole = o.oid and d.defaclnamespace = 0 and d.defaclobjtype = t.kind
  union all
  select d.defaclobjtype, d.defaclacl
  from pg_default_acl d
  join pg_namespace n on n.oid = d.defaclnamespace
  join target_owner o on o.oid = d.defaclrole
  where n.nspname in ('public', 'private') and d.defaclobjtype in ('r', 'S', 'f')
), unsafe_defaults as (
  select 1 from effective_defaults d
  cross join lateral aclexplode(d.permissions) a
  where a.grantee = 0 or a.grantee in (
    select oid from pg_roles where rolname in ('anon', 'authenticated')
  )
)
select 'private_schema_exists' as check_name,
  exists(select 1 from pg_namespace where nspname = 'private') as passed
union all
select 'private_schema_denies_clients', coalesce((
  select not has_schema_privilege('anon', n.oid, 'USAGE')
    and not has_schema_privilege('authenticated', n.oid, 'USAGE')
    and not has_schema_privilege('anon', n.oid, 'CREATE')
    and not has_schema_privilege('authenticated', n.oid, 'CREATE')
  from pg_namespace n where n.nspname = 'private'
), false)
union all
select 'public_schema_denies_client_ddl',
  not has_schema_privilege('anon', 'public', 'CREATE')
  and not has_schema_privilege('authenticated', 'public', 'CREATE')
union all
select 'new_objects_require_explicit_grants', not exists(select 1 from unsafe_defaults);
