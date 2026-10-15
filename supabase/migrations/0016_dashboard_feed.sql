-- 0016_dashboard_feed.sql
--
-- Dashboard Feed (/audit/admin/dashboard, 2026-10-15). The Feed is one list of
-- everything Chris should do today, in his order: Email → Sales → Jobs →
-- Marketing → Client work → Other. Each item can be marked Done, Snoozed to
-- tomorrow, or Skipped.
--
-- Scope:
--   - dash_feed_status: one row per Feed item Chris acted on. Item ids are
--     stable across hourly refreshes (Gmail message id, job_leads.id,
--     project:<id>:<hash>, …). title/grp/mins are copied in so "done today"
--     still lists an item after its source is gone.
--   - dash_sales_admin: read-only sales leads that live in this database —
--     recent Blog Hands sign-ups, free-post claims, and low Findability scores.
--     Swoop (a different Supabase project) is read on Chris's PC and arrives
--     through dash_state 'sales'. tool_runs_7d (added live as 0016b_dash_sales_tool_runs)
--     counts this week's runs of the chrishornak.com tools for the Pulse card.
--   - Nothing else changes.
--
-- Same access pattern as 0010/0014/0015: RLS on with no policies (the anon key
-- can't touch the table), and every read/write goes through an
-- admin_check()-gated security definer RPC. Idempotent.

create table if not exists dash_feed_status (
  item_id    text primary key check (char_length(item_id) between 1 and 200),
  status     text not null check (status in ('done', 'snoozed', 'skipped')),
  until      date,
  title      text not null default '' check (char_length(title) <= 300),
  grp        text not null default '' check (char_length(grp) <= 20),
  mins       int  not null default 0 check (mins between 0 and 600),
  updated_at timestamptz not null default now()
);
-- brand (added live as 0016c_dash_feed_status_brand): a win keeps its brand color after the item leaves the Feed.
alter table dash_feed_status add column if not exists brand text not null default '' check (char_length(brand) <= 60);

alter table dash_feed_status enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

create index if not exists dash_feed_status_updated_idx on dash_feed_status (updated_at desc);

-- Rows still in force: everything from the last 90 days. The page decides what
-- "snoozed until tomorrow" or "done today" means in New York time.
create or replace function dash_feed_status_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(json_build_object(
           'id', s.item_id, 'status', s.status, 'until', s.until,
           'title', s.title, 'grp', s.grp, 'mins', s.mins, 'brand', s.brand, 'at', s.updated_at
         ) order by s.updated_at desc), '[]'::json)
    into result
  from dash_feed_status s
  where s.updated_at >= now() - interval '90 days';

  return result;
end;
$$;

-- p_status null = undo (the row is removed and the item is open again).
drop function if exists dash_feed_status_set(text, text, text, date, text, text, int);
create or replace function dash_feed_status_set(
  p_secret text, p_item_id text, p_status text, p_until date default null,
  p_title text default '', p_grp text default '', p_mins int default 0, p_brand text default ''
)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_status is null then
    delete from dash_feed_status where item_id = p_item_id;
    return true;
  end if;

  insert into dash_feed_status (item_id, status, until, title, grp, mins, brand, updated_at)
  values (p_item_id, p_status, p_until, left(coalesce(p_title, ''), 300), left(coalesce(p_grp, ''), 20),
          least(greatest(coalesce(p_mins, 0), 0), 600), left(coalesce(p_brand, ''), 60), now())
  on conflict (item_id) do update
    set status = excluded.status, until = excluded.until, title = excluded.title,
        grp = excluded.grp, mins = excluded.mins, brand = excluded.brand, updated_at = now();

  -- Keep the table small: rows older than 90 days no longer matter.
  delete from dash_feed_status where updated_at < now() - interval '90 days';
  return true;
end;
$$;

-- Sales leads from this database. Read-only. Chris's own and test accounts are left out.
create or replace function dash_sales_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  result json;
  internal text[] := array['%@bloghands.com', '%@chrishornak.com', '%@swiftgrowth.marketing', 'chris+%'];
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select json_build_object(
    'signups', (
      select coalesce(json_agg(json_build_object(
               'id', a.id, 'email', a.email, 'name', a.name, 'website', a.website_url,
               'stage', a.stage, 'at', a.created_at) order by a.created_at desc), '[]'::json)
      from accounts a
      where a.created_at >= now() - interval '14 days'
        and not coalesce(a.is_internal, false)
        and not (a.email ilike any (internal))
    ),
    'claims', (
      select coalesce(json_agg(json_build_object(
               'id', f.id, 'email', f.email, 'domain', f.domain, 'topic', f.topic, 'at', f.created_at)
               order by f.created_at desc), '[]'::json)
      from funnel_events f
      where f.event = 'claimed'
        and f.created_at >= now() - interval '14 days'
        and not (coalesce(f.email, '') ilike any (internal))
    ),
    'low_scores', (
      select coalesce(json_agg(x order by x.at desc), '[]'::json)
      from (
        select distinct on (r.domain) r.domain, r.overall_score as score, r.created_at as at
        from audit_runs r
        where not r.is_synthetic and r.overall_score < 60
          and r.created_at >= now() - interval '14 days'
        order by r.domain, r.created_at desc
      ) x
    ),
    'tool_runs_7d', json_build_object(
      'findability', (select count(*) from audit_runs where not is_synthetic and created_at >= now() - interval '7 days'),
      'authority',   (select count(*) from authority_checks where created_at >= now() - interval '7 days'),
      'og',          (select count(*) from og_checks where created_at >= now() - interval '7 days')
    )
  ) into result;

  return result;
end;
$$;

grant execute on function dash_feed_status_admin(text)                                   to anon, authenticated;
grant execute on function dash_feed_status_set(text, text, text, date, text, text, int, text) to anon, authenticated;
grant execute on function dash_sales_admin(text)                                         to anon, authenticated;
