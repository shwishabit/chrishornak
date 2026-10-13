-- 0013_job_leads_pay.sql
--
-- Lead score (2026-10-13): the tracker scores every lead 0-100 in code
-- (src/lib/job-score.ts). Pay is the one input the table didn't hold, so:
--   - pay_hr:    effective $/hr estimate (hourly as given; budget ÷ hours; salary ÷ 2,080). null = not listed
--   - pay_basis: one short line on how pay_hr was worked out, shown in the score hover
--   - deal_usd:  total value (project budget, 3 months of a retainer, or annual salary). null = unknown
-- job_leads_add() writes the new fields. Idempotent.

alter table job_leads add column if not exists pay_hr numeric;
alter table job_leads add column if not exists pay_basis text;
alter table job_leads add column if not exists deal_usd numeric;

alter table job_leads drop constraint if exists job_leads_pay_hr_check;
alter table job_leads add constraint job_leads_pay_hr_check check (pay_hr is null or pay_hr >= 0);
alter table job_leads drop constraint if exists job_leads_deal_usd_check;
alter table job_leads add constraint job_leads_deal_usd_check check (deal_usd is null or deal_usd >= 0);

create or replace function job_leads_add(
  p_secret text,
  p_rows   json,
  p_run    json default null
) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into job_leads (id, source, kind, posted, who, handle, ask, link, ext_link, contact, fit, fit_why, status, added,
                         work_type, highlight, tags, pay_hr, pay_basis, deal_usd)
  select r.id, coalesce(r.source, 'bluesky'), coalesce(r.kind, 'direct'), r.posted, r.who, r.handle, r.ask, r.link,
         r.ext_link, r.contact, coalesce(r.fit, 'weak'), r.fit_why, coalesce(r.status, 'new'), coalesce(r.added, current_date),
         coalesce(r.work_type, 'unknown'), coalesce(r.highlight, false), coalesce(r.tags, '{}'),
         r.pay_hr, r.pay_basis, r.deal_usd
  from json_populate_recordset(null::job_leads, p_rows) r
  on conflict (id) do nothing;
  get diagnostics n = row_count;

  if p_run is not null then
    insert into job_lead_runs (run_date, source, queries, kept, real_leads, window_days)
    values (
      (p_run->>'run_date')::date,
      coalesce(p_run->>'source', 'bluesky'),
      coalesce((p_run->>'queries')::int, 0),
      coalesce((p_run->>'kept')::int, 0),
      coalesce((p_run->>'real_leads')::int, 0),
      coalesce((p_run->>'window_days')::int, 21)
    )
    on conflict (run_date, source) do update set
      queries = excluded.queries, kept = excluded.kept,
      real_leads = excluded.real_leads, window_days = excluded.window_days;
  end if;

  return n;
end;
$$;
