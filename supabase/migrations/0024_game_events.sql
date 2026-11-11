-- 0024_game_events.sql
--
-- Block Sector play counts (2026-11-11). Chris: "what would the experienced professionals suggest" → panel: measure
-- strangers' play, not only what testers say; Chris picked "2" = anonymous play counts first.
-- One row per small game event (page open, intro watched, run ended, left mid-run) from /api/play/event.
--
-- Scope:
--   - NEW table game_events: insert-only for the anon key (the site's API route), no SELECT policy, so no row is
--     readable from outside. Chris's reports are read with the service role (Supabase MCP / SQL editor).
--   - Anonymous: a random per-device id made by the game (no name, no email, no IP address, no cookies).
--   - Nothing else changes.
--
-- Applied via the Supabase MCP (project avsokercllnaiifoibwj). Idempotent.

create extension if not exists pgcrypto;

create table if not exists public.game_events (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  game       text not null check (game ~ '^[a-z0-9-]{1,32}$'),
  build      text not null check (length(build) between 1 and 32),
  player     uuid not null,                 -- random id the game keeps on the device (localStorage)
  visit      uuid not null,                 -- random id per page load
  kind       text not null check (kind in ('open', 'intro', 'run', 'away')),
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 2048)
);

create index if not exists game_events_game_created_idx on public.game_events (game, created_at desc);
create index if not exists game_events_player_idx on public.game_events (player);

alter table public.game_events enable row level security;

drop policy if exists "game_events: insert public" on public.game_events;
create policy "game_events: insert public"
  on public.game_events for insert to anon
  with check (true);
-- (No SELECT policy → no row is readable with the anon key.)

-- This project still auto-grants every right to anon + authenticated on new tables; take them back (TRUNCATE skips RLS).
revoke all on public.game_events from anon, authenticated;
grant insert on public.game_events to anon;
grant select, insert, update, delete on public.game_events to service_role;
