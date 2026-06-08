-- 0002 — benchmark_rank also returns the corpus average + median, so a fresh
-- result can be compared against the benchmark right at the score area.

create or replace function benchmark_rank(p_score int)
returns json language sql stable security definer set search_path = public as $$
  with base as (select overall_score from audit_benchmark_base)
  select json_build_object(
    'n',      (select count(*) from base),
    'avg',    (select round(avg(overall_score)) from base),
    'median', (select percentile_cont(0.5) within group (order by overall_score) from base),
    'better_than_pct', (
      select case when count(*) = 0 then null
        else round(100.0 * count(*) filter (where overall_score < p_score) / count(*)) end
      from base
    )
  );
$$;

grant execute on function benchmark_rank(int) to anon, authenticated;
