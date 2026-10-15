-- 0015_dashboard_v2.sql
--
-- Master dashboard v2 (/audit/admin/dashboard, 2026-10-15). The page becomes a
-- daily home screen: Today, live numbers, project lanes, this week's shipped work,
-- and a skills/agents map.
--
-- Scope:
--   - dash_state: one jsonb blob per key ('today', 'projects', 'scorecard',
--     'catalog', 'health'), pushed hourly by .agent/scripts/dash-refresh.mjs on
--     Chris's PC (the live site can't read local files). Replaces the per-row
--     dash_projects push; dash_projects (0014) stays in place, unused.
--   - dash_bloghands_stats: read-only Blog Hands numbers. Blog Hands lives in this
--     same Supabase project, so no second connection is needed. Chris's own and
--     test accounts are left out of the counts.
--   - Nothing else changes. job_leads, findability and admin_check are untouched.
--
-- Same access pattern as 0010/0014: RLS on with no policies (the anon key can't
-- touch the table), and every read/write goes through an admin_check()-gated
-- security definer RPC.
--
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

create table if not exists dash_state (
  key        text primary key check (char_length(key) between 1 and 60),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table dash_state enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

-- { "<key>": { "data": <jsonb>, "updated_at": "<ts>" }, ... }
create or replace function dash_state_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_object_agg(s.key, json_build_object('data', s.data, 'updated_at', s.updated_at)), '{}'::json)
    into result
  from dash_state s;

  return result;
end;
$$;

-- Whole-blob replace per key: each push is the latest scan, nothing accumulates.
create or replace function dash_state_set(p_secret text, p_key text, p_data jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into dash_state (key, data, updated_at)
  values (p_key, coalesce(p_data, '{}'::jsonb), now())
  on conflict (key) do update set data = excluded.data, updated_at = now();

  return true;
end;
$$;

-- Blog Hands numbers for the dashboard. Read-only.
create or replace function dash_bloghands_stats(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  result json;
  internal text[] := array['%@bloghands.com', '%@chrishornak.com', '%@swiftgrowth.marketing', 'chris+%'];
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  with real_accounts as (
    select a.id, a.stage, a.created_at
    from accounts a
    where not (a.email ilike any (internal))
  )
  select json_build_object(
    'signups_7d',        (select count(*) from real_accounts where created_at >= now() - interval '7 days'),
    'signups_30d',       (select count(*) from real_accounts where created_at >= now() - interval '30 days'),
    'accounts_total',    (select count(*) from real_accounts),
    'subscribers',       (select count(*) from real_accounts where stage = 'subscriber'),
    'active_subs',       (select count(*) from subscriptions s join real_accounts r on r.id = s.account_id
                            where s.status in ('active', 'trialing')),
    'posts_delivered_7d',  (select count(*) from posts p join real_accounts r on r.id = p.account_id
                              where p.delivered_at >= now() - interval '7 days'),
    'posts_delivered_30d', (select count(*) from posts p join real_accounts r on r.id = p.account_id
                              where p.delivered_at >= now() - interval '30 days'),
    'paige_runs_7d',     (select count(*) from paige_runs where created_at >= now() - interval '7 days'),
    'paige_flagged_open',(select count(*) from paige_runs where flagged and reviewed_at is null),
    'paige_failed_7d',   (select count(*) from paige_runs where status = 'failed' and created_at >= now() - interval '7 days'),
    'grader_runs_7d',    (select count(*) from grade_records where created_at >= now() - interval '7 days'),
    'grader_runs_30d',   (select count(*) from grade_records where created_at >= now() - interval '30 days'),
    'free_claims_7d',    (select count(*) from funnel_events where event = 'claimed' and created_at >= now() - interval '7 days'),
    -- orders has had two shapes over Blog Hands' life (0011 vs a later create-if-not-exists
    -- that never ran on prod), so read its columns through jsonb: a missing column is null,
    -- not an error. Paid = has paid_at and a positive amount (internal orders skip payment).
    'paid_orders_30d',   (select count(*) from orders o
                            where (to_jsonb(o) ->> 'paid_at')::timestamptz >= now() - interval '30 days'
                              and coalesce((to_jsonb(o) ->> 'amount_cents')::int, 0) > 0),
    'revenue_30d_cents', (select coalesce(sum((to_jsonb(o) ->> 'amount_cents')::int), 0) from orders o
                            where (to_jsonb(o) ->> 'paid_at')::timestamptz >= now() - interval '30 days'
                              and coalesce((to_jsonb(o) ->> 'amount_cents')::int, 0) > 0),
    -- 14-day daily series for the small trend lines: [{d, signups, grades}]
    'daily', (
      select coalesce(json_agg(json_build_object(
               'd', to_char(day, 'YYYY-MM-DD'),
               'signups', (select count(*) from real_accounts where created_at >= day and created_at < day + interval '1 day'),
               'grades',  (select count(*) from grade_records where created_at >= day and created_at < day + interval '1 day')
             ) order by day), '[]'::json)
      from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') as day
    )
  ) into result;

  return result;
end;
$$;

grant execute on function dash_state_admin(text)              to anon, authenticated;
grant execute on function dash_state_set(text, text, jsonb)   to anon, authenticated;
grant execute on function dash_bloghands_stats(text)          to anon, authenticated;
