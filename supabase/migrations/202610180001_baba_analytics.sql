create table if not exists public.baba_installs (
  install_id uuid primary key,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  plan text not null default 'Unknown' check (plan in ('Day', 'Month', 'Lifetime', 'Unknown')),
  app_version text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.baba_installs enable row level security;
revoke all on public.baba_installs from anon, authenticated;

create or replace function public.baba_admin_stats()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from public.baba_installs),
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('country', country_code, 'users', users) order by users desc, country_code)
      from (
        select country_code, count(*)::bigint as users
        from public.baba_installs
        where country_code is not null
        group by country_code
      ) grouped
    ), '[]'::jsonb),
    'plans', coalesce((
      select jsonb_agg(jsonb_build_object('plan', plan, 'users', users) order by users desc, plan)
      from (
        select plan, count(*)::bigint as users
        from public.baba_installs
        group by plan
      ) grouped
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.baba_admin_stats() from public, anon, authenticated;
grant execute on function public.baba_admin_stats() to service_role;
