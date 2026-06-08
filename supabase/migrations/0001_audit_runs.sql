-- 0001_audit_runs — Findability audit analytics
-- One row per completed audit. Aggregates flow through security-definer RPCs
-- so the anon key can insert + read benchmarks but can never read raw rows.
-- Idempotent: safe to re-run.

create extension if not exists pgcrypto;

create table if not exists audit_runs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  domain          text not null,                 -- registrable domain, never exposed publicly
  overall_score   smallint not null check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb,   -- { "Search": 83, "AI": 50, ... }
  issues          jsonb not null default '[]'::jsonb,   -- [{ "c": cat, "l": label, "s": "fail"|"warn" }]
  status          text not null default 'completed' check (status in ('completed','failed')),
  is_synthetic    boolean not null default false        -- excludes QA / test runs from stats
);

create index if not exists audit_runs_domain_idx on audit_runs (domain);
create index if not exists audit_runs_created_at_idx on audit_runs (created_at desc);

alter table audit_runs enable row level security;

-- Public (anon) may INSERT real runs only — never synthetic, never SELECT.
drop policy if exists "audit_runs: insert public" on audit_runs;
create policy "audit_runs: insert public"
  on audit_runs for insert to anon, authenticated
  with check (is_synthetic = false);
-- (No SELECT policy → no row is readable via the anon key. Stats come from the RPCs below.)

-- Dedup base: latest completed, non-synthetic run per domain.
create or replace view audit_benchmark_base as
select distinct on (domain)
  domain, overall_score, category_scores, issues, created_at
from audit_runs
where status = 'completed' and is_synthetic = false
order by domain, created_at desc;

-- Aggregate stats — security definer so it reads the base under RLS.
create or replace function benchmark_stats()
returns json language sql stable security definer set search_path = public as $$
  with base as (select * from audit_benchmark_base)
  select json_build_object(
    'n',      (select count(*) from base),
    'avg',    (select round(avg(overall_score)) from base),
    'median', (select percentile_cont(0.5) within group (order by overall_score) from base),
    'p25',    (select percentile_cont(0.25) within group (order by overall_score) from base),
    'p75',    (select percentile_cont(0.75) within group (order by overall_score) from base),
    'min',    (select min(overall_score) from base),
    'max',    (select max(overall_score) from base),
    'distribution', (
      select coalesce(json_agg(json_build_object('bucket', bucket, 'count', cnt) order by bucket), '[]'::json)
      from (
        select least(width_bucket(overall_score, 0, 100, 10), 10) as bucket, count(*) cnt
        from base group by 1
      ) d
    ),
    'category_avgs', (
      select coalesce(json_object_agg(cat, avg_score), '{}'::json)
      from (
        select key as cat, round(avg(val::numeric)) as avg_score
        from base, jsonb_each_text(category_scores) as kv(key, val)
        group by key
      ) c
    )
  );
$$;

-- Most common issues, ranked by how many sites hit them.
create or replace function benchmark_top_issues(limit_n int default 8)
returns table(category text, label text, status text, count bigint, pct numeric)
language sql stable security definer set search_path = public as $$
  with base as (select * from audit_benchmark_base),
  total as (select greatest(count(*), 1)::numeric n from base),
  flat as (
    select i->>'c' as category, i->>'l' as label, i->>'s' as status
    from base, jsonb_array_elements(issues) as i
  )
  select category, label, status, count(*) as count,
         round(count(*) * 100.0 / (select n from total), 0) as pct
  from flat
  where label is not null and label <> ''
  group by category, label, status
  order by count(*) desc
  limit limit_n;
$$;

-- A single site's standing vs the corpus (drives the "you beat X%" badge).
create or replace function benchmark_rank(p_score int)
returns json language sql stable security definer set search_path = public as $$
  with base as (select overall_score from audit_benchmark_base)
  select json_build_object(
    'n', (select count(*) from base),
    'better_than_pct', (
      select case when count(*) = 0 then null
        else round(100.0 * count(*) filter (where overall_score < p_score) / count(*)) end
      from base
    )
  );
$$;

grant execute on function benchmark_stats()            to anon, authenticated;
grant execute on function benchmark_top_issues(int)    to anon, authenticated;
grant execute on function benchmark_rank(int)          to anon, authenticated;
