create table if not exists public.baba_license_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  key_hint text not null check (key_hint ~ '^[A-Z0-9]{4}$'),
  plan text not null check (plan in ('Day','Month','Lifetime')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  claimed_install_id uuid,
  claimed_at timestamptz,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

alter table public.baba_license_keys enable row level security;
revoke all on public.baba_license_keys from anon, authenticated;

create or replace function public.baba_claim_license(p_key_hash text, p_install_id uuid)
returns table(valid boolean, plan text, error text)
language plpgsql security definer set search_path = '' as $$
declare selected_plan text;
begin
  update public.baba_license_keys k
  set claimed_install_id = coalesce(k.claimed_install_id, p_install_id),
      claimed_at = coalesce(k.claimed_at, now())
  where k.key_hash = lower(p_key_hash)
    and k.revoked_at is null
    and (k.claimed_install_id is null or k.claimed_install_id = p_install_id)
  returning k.plan into selected_plan;
  if selected_plan is null then
    return query select false, null::text, 'invalid_or_already_claimed'::text;
  else
    return query select true, selected_plan, null::text;
  end if;
end;
$$;

create or replace function public.baba_create_license_key(p_key_hash text, p_key_hint text, p_plan text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  insert into public.baba_license_keys(key_hash,key_hint,plan)
  values(lower(p_key_hash),upper(p_key_hint),p_plan) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.baba_admin_list_license_keys()
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',id,'hint',key_hint,'plan',plan,'createdAt',created_at,'revokedAt',revoked_at,'revoked',revoked_at is not null,
    'claimedInstallId',claimed_install_id,'claimedAt',claimed_at,'country',country_code
  ) order by created_at desc),'[]'::jsonb) from public.baba_license_keys;
$$;

create or replace function public.baba_revoke_license_key(p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed_count integer;
begin
  update public.baba_license_keys set revoked_at=coalesce(revoked_at,now()) where id=p_id;
  get diagnostics changed_count = row_count;
  return changed_count > 0;
end;
$$;

revoke all on function public.baba_claim_license(text,uuid) from public,anon,authenticated;
revoke all on function public.baba_create_license_key(text,text,text) from public,anon,authenticated;
revoke all on function public.baba_admin_list_license_keys() from public,anon,authenticated;
revoke all on function public.baba_revoke_license_key(uuid) from public,anon,authenticated;
grant execute on function public.baba_claim_license(text,uuid) to service_role;
grant execute on function public.baba_create_license_key(text,text,text) to service_role;
grant execute on function public.baba_admin_list_license_keys() to service_role;
grant execute on function public.baba_revoke_license_key(uuid) to service_role;



