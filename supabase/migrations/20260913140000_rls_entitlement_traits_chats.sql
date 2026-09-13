-- Van Su AI: lock entitlement columns + personalized AI profile + horoscope chats
-- Run AFTER 20260913120000_trial_entitlement.sql
--
-- Access flow (locked):
--   1) User registers a Free cloud account (handle_new_user inserts empty profile, NO trial)
--   2) Onboarding saves birth_date (client-allowed columns only)
--   3) App calls RPC start_trial_if_eligible() — ONLY path that writes trial_*
-- Never grant trial before registration. Clients must NOT UPDATE entitlement fields.

-- ---------------------------------------------------------------------------
-- 1) Entitlement columns: client read-only (RPC / service_role / table owner only)
-- ---------------------------------------------------------------------------

create or replace function public.is_privileged_entitlement_writer()
returns boolean
language plpgsql
stable
as $$
begin
  -- security definer RPCs run as function owner (postgres)
  if current_user in ('postgres', 'supabase_admin', 'service_role', 'supabase_auth_admin') then
    return true;
  end if;
  if coalesce(current_setting('role', true), '') = 'service_role' then
    return true;
  end if;
  return false;
end;
$$;

revoke all on function public.is_privileged_entitlement_writer() from public, anon, authenticated;

create or replace function public.protect_profile_entitlement_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_privileged_entitlement_writer() then
      new.is_pro := false;
      new.trial_started_at := null;
      new.trial_ends_at := null;
      new.trial_consumed := false;
      new.entitlement_source := 'none';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_pro is distinct from old.is_pro
       or new.trial_started_at is distinct from old.trial_started_at
       or new.trial_ends_at is distinct from old.trial_ends_at
       or new.trial_consumed is distinct from old.trial_consumed
       or new.entitlement_source is distinct from old.entitlement_source
    then
      if not public.is_privileged_entitlement_writer() then
        raise exception 'entitlement columns are read-only for clients'
          using errcode = '42501';
      end if;
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_entitlement on public.profiles;
create trigger profiles_protect_entitlement
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_entitlement_columns();

-- Column-level privileges: authenticated may not write entitlement fields
revoke update on table public.profiles from public, anon, authenticated;
revoke insert on table public.profiles from public, anon, authenticated;

grant select on table public.profiles to authenticated;

grant insert (
  id,
  birth_date,
  birth_time,
  birth_place,
  display_name
) on table public.profiles to authenticated;

grant update (
  birth_date,
  birth_time,
  birth_place,
  display_name,
  updated_at
) on table public.profiles to authenticated;

comment on column public.profiles.is_pro is
  'Paid Pro only. Client UPDATE forbidden — service_role / apply_paid_pro / start_trial_if_eligible only.';
comment on column public.profiles.trial_started_at is
  'Set only by start_trial_if_eligible (security definer). Client UPDATE forbidden.';
comment on column public.profiles.trial_ends_at is
  'Set only by start_trial_if_eligible (security definer). Client UPDATE forbidden.';
comment on column public.profiles.trial_consumed is
  'Set only by start_trial_if_eligible (security definer). Client UPDATE forbidden.';
comment on column public.profiles.entitlement_source is
  'Set only by RPC / service_role. Client UPDATE forbidden.';

-- Paid Pro from webhook / admin (NOT granted to authenticated / Expo)
create or replace function public.apply_paid_pro(p_user_id uuid, p_is_pro boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if p_user_id is null then
    raise exception 'user id required';
  end if;

  update public.profiles
  set
    is_pro = p_is_pro,
    entitlement_source = case
      when p_is_pro then 'revenuecat'
      when trial_consumed and trial_ends_at is not null and trial_ends_at > now() then 'trial'
      else 'none'
    end,
    updated_at = now()
  where id = p_user_id
  returning * into row;

  if not found then
    raise exception 'profile not found';
  end if;

  return row;
end;
$$;

revoke all on function public.apply_paid_pro(uuid, boolean) from public, anon, authenticated;
grant execute on function public.apply_paid_pro(uuid, boolean) to service_role;

-- Reinforce: start_trial_if_eligible stays the only client-callable writer
comment on function public.start_trial_if_eligible() is
  'Option A: after cloud signup + birth_date. Never grant trial before registration. Only RPC that writes trial_*.';

-- ---------------------------------------------------------------------------
-- 2) user_traits — personalized AI profile (no entitlement columns)
-- ---------------------------------------------------------------------------
create table if not exists public.user_traits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender text,
  relationship_status text,
  career text,
  concerns text[] not null default '{}',
  location_current text,
  additional_notes text,
  questionnaire jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.user_traits is
  'Per-user traits for deep AI analysis. Clients may CRUD own row only — no entitlement fields.';
comment on column public.user_traits.questionnaire is
  'Flexible answers (year_goal, extra intake, etc.).';

create or replace function public.set_user_traits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_traits_set_updated_at on public.user_traits;
create trigger user_traits_set_updated_at
  before update on public.user_traits
  for each row
  execute function public.set_user_traits_updated_at();

alter table public.user_traits enable row level security;

drop policy if exists "user_traits_select_own" on public.user_traits;
create policy "user_traits_select_own"
  on public.user_traits
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_traits_insert_own" on public.user_traits;
create policy "user_traits_insert_own"
  on public.user_traits
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_traits_update_own" on public.user_traits;
create policy "user_traits_update_own"
  on public.user_traits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_traits_delete_own" on public.user_traits;
create policy "user_traits_delete_own"
  on public.user_traits
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_traits to authenticated;
revoke all on table public.user_traits from anon, public;

-- ---------------------------------------------------------------------------
-- 3) horoscope_chats — multi-turn Tử vi messages (own-only)
-- ---------------------------------------------------------------------------
create table if not exists public.horoscope_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists horoscope_chats_user_created_idx
  on public.horoscope_chats (user_id, created_at);

comment on table public.horoscope_chats is
  'Tử vi conversational messages. RLS: user reads/writes own rows only.';

alter table public.horoscope_chats enable row level security;

drop policy if exists "horoscope_chats_select_own" on public.horoscope_chats;
create policy "horoscope_chats_select_own"
  on public.horoscope_chats
  for select
  using (auth.uid() = user_id);

drop policy if exists "horoscope_chats_insert_own" on public.horoscope_chats;
create policy "horoscope_chats_insert_own"
  on public.horoscope_chats
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "horoscope_chats_delete_own" on public.horoscope_chats;
create policy "horoscope_chats_delete_own"
  on public.horoscope_chats
  for delete
  using (auth.uid() = user_id);

-- no UPDATE policy — messages are append-only

grant select, insert, delete on table public.horoscope_chats to authenticated;
revoke all on table public.horoscope_chats from anon, public;
revoke update on table public.horoscope_chats from authenticated, anon, public;
