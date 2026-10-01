-- 0008_authority_checks_eleven_checks.sql
--
-- Authority Check round 4 (2026-10-01): the score is now E-E-A-T, with 11
-- checks (Experience 2, Expertise 2, Trust 7). The log keeps how many checks
-- each site passed, so each value may now be 0-11 (was 0-9). Without this,
-- any check where a site passes 10 or 11 fails to log, silently.
--
-- Scope: only the proof rule. Ahrefs Domain Rating is never stored (licence),
-- so no new column. RLS, grants and authority_checks_admin() are unchanged.
--
-- Run this BEFORE the round-4 code is deployed.
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
  check (cardinality(proof) <= 4 and 0 <= all(proof) and 11 >= all(proof));
