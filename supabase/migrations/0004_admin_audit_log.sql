-- 0004_admin_audit_log — private admin usage log for /audit/admin
-- Row-level read of audit_runs (which has NO anon SELECT policy — see 0001).
-- Guarded by a shared secret that MUST equal the app's ADMIN_KEY env var, so a
-- leaked anon key alone can never pull raw domains. Idempotent: safe to re-run.
--
-- SETUP: edit the admin_key value below to match the ADMIN_KEY you set in Vercel
-- (and your local .env.local). Then run this whole file in the SQL Editor.

-- ── Secret store ──────────────────────────────────────────────────────────
create table if not exists admin_config (
  key   text primary key,
  value text not null
);
alter table admin_config enable row level security;
-- No policies → unreadable/unwritable via the anon OR authenticated key. Only
-- the security-definer functions below (and the service role) can read it.

-- ↓↓↓ EDIT THIS VALUE to match Vercel's ADMIN_KEY, then run the file ↓↓↓
insert into admin_config(key, value)
values ('admin_key', 'CHANGE-ME-TO-MATCH-VERCEL-ADMIN_KEY')
on conflict (key) do update set value = excluded.value;

-- ── Auth helper ───────────────────────────────────────────────────────────
create or replace function admin_check(p_secret text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_config
    where key = 'admin_key'
      and p_secret is not null and p_secret <> ''
      and value = p_secret
  );
$$;

-- ── Paginated, filterable event-level log → { total, rows } ────────────────
create or replace function benchmark_audit_log(
  p_secret    text,
  p_limit     int default 50,
  p_offset    int default 0,
  p_min_score int default 0,
  p_max_score int default 100
) returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select json_build_object(
    'total', (
      select count(*) from audit_runs
      where is_synthetic = false
        and overall_score between p_min_score and p_max_score
    ),
    'rows', (
      select coalesce(json_agg(row_to_json(r) order by r.created_at desc), '[]'::json)
      from (
        select id, created_at, domain, overall_score, category_scores, issues, status
        from audit_runs
        where is_synthetic = false
          and overall_score between p_min_score and p_max_score
        order by created_at desc
        limit  greatest(1, least(p_limit, 200))
        offset greatest(0, p_offset)
      ) r
    )
  ) into result;

  return result;
end;
$$;

-- ── Top-line counts for the dashboard tiles ───────────────────────────────
create or replace function benchmark_admin_overview(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select json_build_object(
    'total',          (select count(*) from audit_runs where is_synthetic = false),
    'today',          (select count(*) from audit_runs where is_synthetic = false and created_at >= date_trunc('day', now())),
    'last_7d',        (select count(*) from audit_runs where is_synthetic = false and created_at >= now() - interval '7 days'),
    'last_30d',       (select count(*) from audit_runs where is_synthetic = false and created_at >= now() - interval '30 days'),
    'avg_score',      (select round(avg(overall_score)) from audit_runs where is_synthetic = false),
    'unique_domains', (select count(distinct domain) from audit_runs where is_synthetic = false),
    'leads',          (select count(*) from audit_runs where is_synthetic = false and overall_score < 60)
  ) into result;

  return result;
end;
$$;

grant execute on function benchmark_audit_log(text,int,int,int,int) to anon, authenticated;
grant execute on function benchmark_admin_overview(text)            to anon, authenticated;
