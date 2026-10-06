-- 0009_authority_checks_twelve_checks.sql
--
-- Authority Check (2026-10-05): "Recently updated" becomes the 12th scored
-- check (Trust, up to 4 points). The log keeps how many scored checks each
-- site passed, so each value may now be 0-12 (was 0-11). Without this, any
-- check where a site passes all 12 fails to log, silently.
--
-- Scope: only the proof rule. No new column (the freshness date is not
-- stored). RLS, grants and authority_checks_admin() are unchanged.
--
-- Run this BEFORE the scoring code is deployed. 0-12 also allows every
-- row the current code writes (0-11), so running it early is safe.
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

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
  check (cardinality(proof) <= 4 and 0 <= all(proof) and 12 >= all(proof));
