-- 0018_dashboard_extras.sql
--
-- Dashboard extras (/audit/admin/dashboard, 2026-10-15):
--   - dash_feed_mins: Chris's own time estimate for one Feed item (click "~15m" to change it).
--     Keyed by the same stable item ids as dash_feed_status.
--   - dash_win_days: one row per New York day with wins in the last 60 days, for the day
--     streak. Wins = Feed items marked done (dash_feed_status) + to-dos ticked (dash_todos).
--     Read-only.
--   - Nothing else changes.
--
-- Same access pattern as 0010–0017: RLS on with no policies, every read/write through an
-- admin_check()-gated security definer RPC. Idempotent.

create table if not exists dash_feed_mins (
  item_id    text primary key check (char_length(item_id) between 1 and 200),
  mins       int  not null check (mins between 1 and 600),
  updated_at timestamptz not null default now()
);

alter table dash_feed_mins enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

-- { "<item_id>": mins, ... } for the last 90 days of overrides.
create or replace function dash_feed_mins_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_object_agg(m.item_id, m.mins), '{}'::json) into result
  from dash_feed_mins m
  where m.updated_at >= now() - interval '90 days';

  return result;
end;
$$;

-- p_mins null = back to the default estimate.
create or replace function dash_feed_mins_set(p_secret text, p_item_id text, p_mins int)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_mins is null then
    delete from dash_feed_mins where item_id = p_item_id;
    return true;
  end if;

  insert into dash_feed_mins (item_id, mins, updated_at)
  values (p_item_id, least(greatest(p_mins, 1), 600), now())
  on conflict (item_id) do update set mins = excluded.mins, updated_at = now();

  delete from dash_feed_mins where updated_at < now() - interval '90 days';
  return true;
end;
$$;

-- [{ d: 'YYYY-MM-DD', wins: n, mins: n }] for New York days with at least one win, last 60 days.
create or replace function dash_win_days(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  with w as (
    select (s.updated_at at time zone 'America/New_York')::date as d, s.mins
    from dash_feed_status s
    where s.status = 'done' and s.updated_at >= now() - interval '60 days'
    union all
    select (t.done_at at time zone 'America/New_York')::date as d, 10 as mins
    from dash_todos t
    where t.done_at is not null and t.done_at >= now() - interval '60 days'
  )
  select coalesce(json_agg(json_build_object('d', to_char(d, 'YYYY-MM-DD'), 'wins', n, 'mins', m) order by d), '[]'::json)
    into result
  from (select d, count(*) as n, sum(mins) as m from w group by d) x;

  return result;
end;
$$;

grant execute on function dash_feed_mins_admin(text)          to anon, authenticated;
grant execute on function dash_feed_mins_set(text, text, int) to anon, authenticated;
grant execute on function dash_win_days(text)                 to anon, authenticated;
