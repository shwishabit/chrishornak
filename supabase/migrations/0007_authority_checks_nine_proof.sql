-- 0007_authority_checks_nine_proof.sql
--
-- Authority Check (2026-10-01). Two changes after Chris's review:
--   1. Proof went from 7 checks to 9 (HTTPS and privacy policy added, read with
--      the Findability Check's own Security rules).
--   2. The result now shows how many sites link to each site (Open PageRank's
--      referring domains), so the log keeps it too.
--
-- Scope:
--   - authority_checks.proof: each value may now be 0-9 (was 0-7). Without this,
--     any check with 8 or 9 proof fails to log, silently.
--   - New column authority_checks.linking_sites int[] (you, Rival A, B, C;
--     null = no data). int, not smallint: big sites pass 32,767.
--   - authority_checks_admin() also returns linking_sites. Same guard, same grants.
--   - RLS and the insert policy (0006) are unchanged.
--
-- Run this BEFORE the code that writes linking_sites is deployed, or those
-- inserts fail (silently) until it is.
--
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

-- 1. Proof 0-9. Drop the old 0-7 rule (and this file's own rule on a re-run),
--    found by what it checks, not by its auto-generated name.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'authority_checks'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%proof%'
  loop
    execute format('alter table authority_checks drop constraint %I', c.conname);
  end loop;
end $$;

alter table authority_checks
  add constraint authority_checks_proof_check
  check (cardinality(proof) <= 4 and 0 <= all(proof) and 9 >= all(proof));

-- 2. Linking sites per site.
alter table authority_checks
  add column if not exists linking_sites int[] not null default '{}';

alter table authority_checks drop constraint if exists authority_checks_linking_sites_check;
alter table authority_checks
  add constraint authority_checks_linking_sites_check
  check (cardinality(linking_sites) <= 4 and 0 <= all(linking_sites));

-- 3. Admin read returns the new column.
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
        select id, created_at, domain, rival_count, rival_domains, links, linking_sites, proof, links_status, status
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
