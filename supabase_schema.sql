-- GameVerse: anonymous, privacy-preserving usage measurement
-- Run this in Supabase SQL Editor.

create table if not exists public.anonymous_users (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null unique,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key,
  anonymous_user_id uuid not null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id uuid primary key,
  anonymous_user_id uuid not null,
  game_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration integer,
  played_offline boolean not null default false,
  synced_at timestamptz
);

create index if not exists anonymous_users_last_seen_idx
  on public.anonymous_users(last_seen desc);

create index if not exists app_sessions_user_idx
  on public.app_sessions(anonymous_user_id);

create index if not exists game_sessions_user_idx
  on public.game_sessions(anonymous_user_id);

create index if not exists game_sessions_game_idx
  on public.game_sessions(game_name);

alter table public.anonymous_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.game_sessions enable row level security;

-- The app sends only random anonymous UUIDs and aggregate session data.
-- No SELECT policy is created, so browser clients cannot browse usage data.
drop policy if exists "anonymous usage insert" on public.anonymous_users;
create policy "anonymous usage insert"
on public.anonymous_users for insert to anon
with check (true);

drop policy if exists "anonymous usage update" on public.anonymous_users;
create policy "anonymous usage update"
on public.anonymous_users for update to anon
using (true) with check (true);

drop policy if exists "anonymous sessions insert" on public.app_sessions;
create policy "anonymous sessions insert"
on public.app_sessions for insert to anon
with check (true);

drop policy if exists "anonymous sessions update" on public.app_sessions;
create policy "anonymous sessions update"
on public.app_sessions for update to anon
using (true) with check (true);

drop policy if exists "anonymous game sessions insert" on public.game_sessions;
create policy "anonymous game sessions insert"
on public.game_sessions for insert to anon
with check (true);

drop policy if exists "anonymous game sessions update" on public.game_sessions;
create policy "anonymous game sessions update"
on public.game_sessions for update to anon
using (true) with check (true);

-- Useful aggregate queries for the hackathon dashboard:
-- select count(*) as unique_users from public.anonymous_users;
-- select count(*) as app_sessions from public.app_sessions;
-- select game_name, count(*) as plays
-- from public.game_sessions
-- group by game_name
-- order by plays desc;
