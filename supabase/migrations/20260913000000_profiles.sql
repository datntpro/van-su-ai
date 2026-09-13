-- Van Su AI: profiles tied to auth.users
-- Run in Supabase SQL Editor (Dashboard → SQL) or via supabase db push.
-- Requires Email auth enabled (Authentication → Providers → Email).

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  birth_date date,
  birth_time text,
  birth_place text,
  display_name text,
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User birth/onboarding profile; Free usage limits stay client-local (AsyncStorage).';
comment on column public.profiles.is_pro is 'Cloud Pro flag (optional sync); Free daily/weekly limits remain local.';

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-insert profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS: users read/update only own row
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insert is done by security definer trigger; allow authenticated insert of own row
-- as a fallback (e.g. legacy users created before the trigger existed).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- NOTE: usage_limits
-- Free quotas (horoscope/day, face/week, chat/day) stay in AsyncStorage for MVP.
-- Sync profile birth data + is_pro to cloud; keep Free limits local to avoid
-- clock-skew / multi-device gaming complexity for now.
-- ---------------------------------------------------------------------------
