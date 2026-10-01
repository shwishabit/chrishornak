-- 0005_og_checks.sql
--
-- OG image checker (2026-09-30). One row per check run on /og-image-checker, so
-- Chris can see which domains use the tool and which checks fail most.
--
-- Scope:
--   - New table og_checks: domain, time, failed + warned check ids, status. No IP,
--     no full URL, no personal data.
--   - Anon may INSERT only. No SELECT policy, same as audit_runs (0001).
--   - Admin read RPC og_checks_admin(), guarded by admin_check() from 0004, so it
--     needs the ADMIN_KEY secret. 0004 must already be applied.
--   - audit_runs and the 0001-0004 functions are not changed.
--
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

create extension if not exists pgcrypto;

create table if not exists og_checks (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  domain     text not null check (char_length(domain) between 3 and 253),
  passed     smallint not null default 0 check (passed between 0 and 8),
  failed     text[] not null default '{}' check (cardinality(failed) <= 8),
  warned     text[] not null default '{}' check (cardinality(warned) <= 8),
  status     text not null default 'completed' check (status in ('completed', 'error'))
);

create index if not exists og_checks_created_at_idx on og_checks (created_at desc);
create index if not exists og_checks_domain_idx on og_checks (domain);

alter table og_checks enable row level security;

drop policy if exists "og_checks: insert public" on og_checks;
create policy "og_checks: insert public"
  on og_checks for insert to anon, authenticated
  with check (true);
-- (No SELECT policy → no row is readable via the anon key. Reads go through the RPC below.)

-- ── Admin read: tiles + most-failed checks + a page of rows ───────────────────
create or replace function og_checks_admin(
  p_secret text,
  p_limit  int default 50,
  p_offset int default 0
) returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select json_build_object(
    'total',          (select count(*) from og_checks),
    'today',          (select count(*) from og_checks where created_at >= date_trunc('day', now())),
    'last_7d',        (select count(*) from og_checks where created_at >= now() - interval '7 days'),
    'last_30d',       (select count(*) from og_checks where created_at >= now() - interval '30 days'),
    'unique_domains', (select count(distinct domain) from og_checks),
    'errors',         (select count(*) from og_checks where status = 'error'),
    'top_failed', (
      select coalesce(json_agg(json_build_object('id', id, 'count', n) order by n desc), '[]'::json)
      from (
        select x.id, count(*) as n
        from og_checks, unnest(failed || warned) as x(id)
        where status = 'completed'
        group by x.id
        order by n desc
        limit 8
      ) t
    ),
    'rows', (
      select coalesce(json_agg(row_to_json(r) order by r.created_at desc), '[]'::json)
      from (
        select id, created_at, domain, passed, failed, warned, status
        from og_checks
        order by created_at desc
        limit  greatest(1, least(p_limit, 200))
        offset greatest(0, p_offset)
      ) r
    )
  ) into result;

  return result;
end;
$$;

grant execute on function og_checks_admin(text, int, int) to anon, authenticated;
