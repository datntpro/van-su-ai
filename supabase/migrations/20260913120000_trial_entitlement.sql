-- Van Su AI P0: Trial Pro 7 days + entitlement source
-- Run AFTER 20260913000000_profiles.sql
-- is_pro remains PAID ONLY — never set true solely because of trial.

alter table public.profiles
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists trial_consumed boolean not null default false,
  add column if not exists entitlement_source text not null default 'none';

comment on column public.profiles.is_pro is 'Paid Pro only (RevenueCat / server). Do NOT set true for trial.';
comment on column public.profiles.trial_started_at is 'When 7-day Pro trial started (Option A: after cloud signup + onboarding birth date).';
comment on column public.profiles.trial_ends_at is 'trial_started_at + 7 days';
comment on column public.profiles.trial_consumed is 'True once trial granted; blocks re-trial on same account.';
comment on column public.profiles.entitlement_source is 'none | trial | revenuecat | promo';

-- Optional check constraint (idempotent via drop/create)
alter table public.profiles drop constraint if exists profiles_entitlement_source_check;
alter table public.profiles
  add constraint profiles_entitlement_source_check
  check (entitlement_source in ('none', 'trial', 'revenuecat', 'promo'));

-- Client-callable: start trial once if not consumed and birth_date present.
-- Uses server now() to reduce device-clock abuse.
create or replace function public.start_trial_if_eligible()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select * into row from public.profiles where id = uid for update;
  if not found then
    insert into public.profiles (id) values (uid)
    on conflict (id) do nothing;
    select * into row from public.profiles where id = uid for update;
  end if;

  -- Already consumed or already paid → return as-is (no re-trial)
  if row.trial_consumed or row.is_pro then
    return row;
  end if;

  -- Require birth_date (onboarding complete)
  if row.birth_date is null then
    raise exception 'birth_date required before trial';
  end if;

  update public.profiles
  set
    trial_started_at = now(),
    trial_ends_at = now() + interval '7 days',
    trial_consumed = true,
    entitlement_source = case
      when entitlement_source = 'revenuecat' then entitlement_source
      else 'trial'
    end,
    updated_at = now()
  where id = uid
  returning * into row;

  return row;
end;
$$;

revoke all on function public.start_trial_if_eligible() from public;
grant execute on function public.start_trial_if_eligible() to authenticated;

-- Helper view of effective pro is client-side; keep schema simple.
