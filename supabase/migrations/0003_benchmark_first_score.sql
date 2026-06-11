-- 0003_benchmark_first_score.sql
--
-- Findability benchmark — anchor the corpus to each site's FIRST audit (2026-06-11).
-- The benchmark is meant to describe real sites as they're found in the wild. But
-- the people who re-run the tool are exactly the ones fixing their sites, so a
-- "latest score per domain" corpus drifts upward toward 100 over time (survivorship
-- bias). Switching the base to the FIRST (as-found) score per domain makes every
-- site's contribution permanent and representative — the headline average stays
-- honest no matter how many owners improve and re-check.
--
-- The latest score isn't thrown away: a new progress view + benchmark_improvement()
-- RPC expose first-vs-latest per returning domain, which powers a site's own
-- before/after AND a credibility stat ("sites that came back improved by N points").
--
-- Scope:
--   - REDEFINE audit_benchmark_base: latest-per-domain  ->  FIRST-per-domain.
--     All existing RPCs (benchmark_stats / benchmark_top_issues / benchmark_rank)
--     read this view unchanged, so they now report as-found numbers automatically.
--   - ADD audit_benchmark_progress view (first + latest score per domain that returned).
--   - ADD benchmark_improvement() RPC over that view.
--   - No table, column, or RLS change. audit_runs still stores every run; this is
--     purely the read layer choosing WHICH run represents each domain.
--
-- Apply via Supabase Dashboard -> SQL Editor (production project avsokercllnaiifoibwj).
-- Idempotent: safe to re-run.

-- ── Benchmark base — now the FIRST completed, non-synthetic run per domain ──
-- (was created_at DESC = latest; now created_at ASC = as-found baseline)
create or replace view audit_benchmark_base as
select distinct on (domain)
  domain, overall_score, category_scores, issues, created_at
from audit_runs
where status = 'completed' and is_synthetic = false
order by domain, created_at asc;

-- ── Progress — sites that came back, with first + latest score ──────────────
-- Only domains with 2+ runs at different times appear (latest_at > first_at).
-- delta can be negative (a site that regressed) — kept honest, not floored at 0.
create or replace view audit_benchmark_progress as
with first_run as (
  select distinct on (domain)
    domain, overall_score as first_score, created_at as first_at
  from audit_runs
  where status = 'completed' and is_synthetic = false
  order by domain, created_at asc
),
last_run as (
  select distinct on (domain)
    domain, overall_score as latest_score, created_at as latest_at
  from audit_runs
  where status = 'completed' and is_synthetic = false
  order by domain, created_at desc
)
select
  f.domain,
  f.first_score,
  l.latest_score,
  (l.latest_score - f.first_score) as delta,
  f.first_at,
  l.latest_at
from first_run f
join last_run l using (domain)
where l.latest_at > f.first_at;

-- ── Improvement stat — the "tool works" story, security-definer like the rest ──
create or replace function benchmark_improvement()
returns json language sql stable security definer set search_path = public as $$
  with p as (select * from audit_benchmark_progress)
  select json_build_object(
    'n_returned',   (select count(*) from p),
    'avg_delta',    (select round(avg(delta)) from p),
    'avg_first',    (select round(avg(first_score)) from p),
    'avg_latest',   (select round(avg(latest_score)) from p),
    'improved_pct', (
      select case when count(*) = 0 then null
        else round(100.0 * count(*) filter (where delta > 0) / count(*)) end
      from p
    ),
    'median_delta', (select percentile_cont(0.5) within group (order by delta) from p)
  );
$$;

grant execute on function benchmark_improvement() to anon, authenticated;
