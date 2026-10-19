-- Bind older local activations on their first server check and enforce revocation for the bound install.
create or replace function public.baba_check_license_key(p_key_hash text, p_install_id uuid)
returns table(valid boolean, blacklisted boolean, plan text)
language plpgsql security definer set search_path = '' as $$
declare license_row public.baba_license_keys%rowtype;
begin
  select * into license_row
  from public.baba_license_keys
  where key_hash = lower(p_key_hash)
  for update;

  if not found then
    return query select false, false, null::text;
    return;
  end if;

  if license_row.claimed_install_id is null and license_row.revoked_at is null then
    update public.baba_license_keys
    set claimed_install_id = p_install_id, claimed_at = now()
    where id = license_row.id
    returning * into license_row;
  end if;

  if license_row.claimed_install_id is distinct from p_install_id then
    return query select false, false, null::text;
  elsif license_row.revoked_at is not null then
    return query select false, true, license_row.plan;
  else
    return query select true, false, license_row.plan;
  end if;
end;
$$;

revoke all on function public.baba_check_license_key(text,uuid) from public,anon,authenticated;
grant execute on function public.baba_check_license_key(text,uuid) to service_role;
