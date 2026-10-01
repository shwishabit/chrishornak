-- 0006_authority_checks.sql
--
-- Authority Check (2026-10-01). One row per check run on /authority-check, so
-- Chris can see which domains use the tool, how many rivals they add, and how
-- often Open PageRank is busy.
--
-- Scope:
--   - New table authority_checks: your domain, rival count + rival domains,
--     links score per site (0-100, null = no link data), proof count per site
--     (0-7, null = homepage not read), Open PageRank status, check status,
--     time. Arrays are in order: you, Rival A, B, C. No IP, no full URL, no
--     personal data.
--   - Anon may INSERT only. No SELECT policy, same as og_checks (0005).
--   - Admin read RPC authority_checks_admin(), guarded by admin_check() from
--     0004, so it needs the ADMIN_KEY secret. 0004 must already be applied.
--   - audit_runs, og_checks and the 0001-0005 functions are not changed.
--
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

create extension if not exists pgcrypto;

create table if not exists authority_checks (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  domain        text not null check (char_length(domain) between 3 and 253),
  rival_count   smallint not null default 0 check (rival_count between 0 and 3),
  rival_domains text[] not null default '{}' check (cardinality(rival_domains) <= 3),
  links         smallint[] not null default '{}'
                  check (cardinality(links) <= 4 and 0 <= all(links) and 100 >= all(links)),
  proof         smallint[] not null default '{}'
                  check (cardinality(proof) <= 4 and 0 <= all(proof) and 7 >= all(proof)),
  links_status  text not null default 'ok' check (links_status in ('ok', 'busy', 'unavailable')),
  status        text not null default 'completed' check (status in ('completed', 'error'))
);

create index if not exists authority_checks_created_at_idx on authority_checks (created_at desc);
create index if not exists authority_checks_domain_idx on authority_checks (domain);

alter table authority_checks enable row level security;

drop policy if exists "authority_checks: insert public" on authority_checks;
create policy "authority_checks: insert public"
  on authority_checks for insert to anon, authenticated
  with check (true);
-- (No SELECT policy → no row is readable via the anon key. Reads go through the RPC below.)

-- ── Admin read: tiles + a page of rows ────────────────────────────────────────
create or replace function authority_checks_admin(
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
    'total',          (select count(*) from authority_checks),
    'today',          (select count(*) from authority_checks where created_at >= date_trunc('day', now())),
    'last_7d',        (select count(*) from authority_checks where created_at >= now() - interval '7 days'),
    'last_30d',       (select count(*) from authority_checks where created_at >= now() - interval '30 days'),
    'unique_domains', (select count(distinct domain) from authority_checks),
    'with_rivals',    (select count(*) from authority_checks where rival_count > 0),
    'errors',         (select count(*) from authority_checks where status = 'error'),
    'links_busy',     (select count(*) from authority_checks where links_status <> 'ok'),
    'rows', (
      select coalesce(json_agg(row_to_json(r) order by r.created_at desc), '[]'::json)
      from (
        select id, created_at, domain, rival_count, rival_domains, links, proof, links_status, status
        from authority_checks
        order by created_at desc
        limit  greatest(1, least(p_limit, 200))
        offset greatest(0, p_offset)
      ) r
    )
  ) into result;

  return result;
end;
$$;

grant execute on function authority_checks_admin(text, int, int) to anon, authenticated;
