-- 0020_dashboard_goals.sql
--
-- Dashboard goals (/audit/admin/dashboard, 2026-10-16). Chris's own goal pick for one
-- Feed item or to-do (tap the goal chip to change it).
--
-- Scope:
--   - dash_item_goals: item_id → goal key. Keyed by the same stable item ids as
--     dash_feed_status / dash_feed_mins (to-dos use 'todo:<uuid>'). A goal key comes from
--     a `Key:` line in GOALS.md, or 'upkeep'. No row = the automatic goal.
--   - The goal list itself is NOT here: it rides in dash_state ('goals', 'goals_edits'),
--     pushed from GOALS.md by .agent/scripts/dash-refresh.mjs.
--   - Nothing else changes.
--
-- Same access pattern as 0010–0019: RLS on with no policies, every read/write through an
-- admin_check()-gated security definer RPC. Idempotent.

create table if not exists dash_item_goals (
  item_id    text primary key check (char_length(item_id) between 1 and 200),
  goal       text not null check (goal ~ '^[a-z0-9-]{1,40}$'),
  updated_at timestamptz not null default now()
);

alter table dash_item_goals enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

-- { "<item_id>": "<goal key>", ... } for the last 120 days of picks.
create or replace function dash_item_goals_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_object_agg(g.item_id, g.goal), '{}'::json) into result
  from dash_item_goals g
  where g.updated_at >= now() - interval '120 days';

  return result;
end;
$$;

-- p_goal null = back to the automatic goal.
create or replace function dash_item_goal_set(p_secret text, p_item_id text, p_goal text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_goal is null then
    delete from dash_item_goals where item_id = p_item_id;
    return true;
  end if;

  insert into dash_item_goals (item_id, goal, updated_at)
  values (p_item_id, p_goal, now())
  on conflict (item_id) do update set goal = excluded.goal, updated_at = now();

  delete from dash_item_goals where updated_at < now() - interval '120 days';
  return true;
end;
$$;

grant execute on function dash_item_goals_admin(text)              to anon, authenticated;
grant execute on function dash_item_goal_set(text, text, text)     to anon, authenticated;
