-- =========================================================
-- GAMEVERSE
-- Anonymous, privacy-preserving usage measurement
-- =========================================================

-- UUID generation
create extension if not exists pgcrypto;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.anonymous_users (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null unique,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),

  constraint app_sessions_anonymous_user_fk
    foreign key (anonymous_user_id)
    references public.anonymous_users(anonymous_user_id)
    on delete cascade
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null,
  game_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration integer,
  played_offline boolean not null default false,
  synced_at timestamptz,

  constraint game_sessions_anonymous_user_fk
    foreign key (anonymous_user_id)
    references public.anonymous_users(anonymous_user_id)
    on delete cascade
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists anonymous_users_last_seen_idx
  on public.anonymous_users(last_seen desc);

create index if not exists app_sessions_user_idx
  on public.app_sessions(anonymous_user_id);

create index if not exists game_sessions_user_idx
  on public.game_sessions(anonymous_user_id);

create index if not exists game_sessions_game_idx
  on public.game_sessions(game_name);

-- =========================================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================================

alter table public.anonymous_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.game_sessions enable row level security;

-- =========================================================
-- REMOVE OLD POLICIES
-- =========================================================

drop policy if exists "anonymous usage select" on public.anonymous_users;
drop policy if exists "anonymous usage insert" on public.anonymous_users;
drop policy if exists "anonymous usage update" on public.anonymous_users;

drop policy if exists "anonymous sessions select" on public.app_sessions;
drop policy if exists "anonymous sessions insert" on public.app_sessions;
drop policy if exists "anonymous sessions update" on public.app_sessions;

drop policy if exists "anonymous game sessions select" on public.game_sessions;
drop policy if exists "anonymous game sessions insert" on public.game_sessions;
drop policy if exists "anonymous game sessions update" on public.game_sessions;

-- =========================================================
-- ANONYMOUS USERS
-- Required because upsert/update may need access to the row.
-- =========================================================

create policy "anonymous usage select"
on public.anonymous_users
for select
to anon
using (true);

create policy "anonymous usage insert"
on public.anonymous_users
for insert
to anon
with check (true);

create policy "anonymous usage update"
on public.anonymous_users
for update
to anon
using (true)
with check (true);

-- =========================================================
-- APP SESSIONS
-- =========================================================

create policy "anonymous sessions select"
on public.app_sessions
for select
to anon
using (true);

create policy "anonymous sessions insert"
on public.app_sessions
for insert
to anon
with check (true);

create policy "anonymous sessions update"
on public.app_sessions
for update
to anon
using (true)
with check (true);

-- =========================================================
-- GAME SESSIONS
-- =========================================================

create policy "anonymous game sessions select"
on public.game_sessions
for select
to anon
using (true);

create policy "anonymous game sessions insert"
on public.game_sessions
for insert
to anon
with check (true);

create policy "anonymous game sessions update"
on public.game_sessions
for update
to anon
using (true)
with check (true);

-- =========================================================
-- OPTIONAL: HELPFUL VIEW FOR MOST PLAYED GAMES
-- Do NOT expose this view to the browser.
-- =========================================================

create or replace view public.game_play_counts as
select
  game_name,
  count(*) as play_count
from public.game_sessions
group by game_name
order by play_count desc;

-- =========================================================
-- TEST QUERIES
-- =========================================================

-- Unique users:
-- select count(*) as unique_users
-- from public.anonymous_users;

-- App sessions:
-- select count(*) as app_session_count
-- from public.app_sessions;

-- Total game plays:
-- select count(*) as total_game_plays
-- from public.game_sessions;

-- Real most-played games:
-- select game_name, count(*) as plays
-- from public.game_sessions
-- group by game_name
-- order by plays desc;