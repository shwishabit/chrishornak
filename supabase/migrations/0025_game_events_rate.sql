-- 0025_game_events_rate.sql
--
-- Block Sector 3.48 (Test Lab step 4, 2026-11-12, Chris picked "2"): the one tap after a run (Too hard / Just right /
-- Too easy) arrives as a new event kind 'rate'. The run event's new fields (dead, rage, mood) live inside the jsonb
-- data column and need no change here.
--
-- Scope: only the kind check on game_events gains 'rate'. Nothing else changes. Idempotent.
-- Apply via the Supabase MCP (project avsokercllnaiifoibwj) only on Chris's OK, BEFORE the 3.48 ship (an old route
-- drops 'rate' with a 400; an old check would make the new route's insert fail with a 500).

alter table public.game_events drop constraint if exists game_events_kind_check;
alter table public.game_events add constraint game_events_kind_check
  check (kind in ('open', 'intro', 'run', 'away', 'rate'));
