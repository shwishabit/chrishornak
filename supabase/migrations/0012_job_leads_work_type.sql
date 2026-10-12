-- 0012_job_leads_work_type.sql
--
-- Hunt rules v2 (2026-10-12): full-time jobs live in their own tab, the ones
-- worth a look are highlighted, and leads can carry tags (e.g. "figma").
--   - work_type: freelance | contract | part-time | fractional | full-time | unknown
--   - highlight: true marks a full-time job worth a look
--   - tags: short labels shown on the row
-- job_leads_add() writes the new fields. Idempotent.

alter table job_leads add column if not exists work_type text not null default 'unknown';
alter table job_leads add column if not exists highlight boolean not null default false;
alter table job_leads add column if not exists tags text[] not null default '{}';

alter table job_leads drop constraint if exists job_leads_work_type_check;
alter table job_leads add constraint job_leads_work_type_check
  check (work_type in ('freelance', 'contract', 'part-time', 'fractional', 'full-time', 'unknown'));

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
                         work_type, highlight, tags)
  select r.id, coalesce(r.source, 'bluesky'), coalesce(r.kind, 'direct'), r.posted, r.who, r.handle, r.ask, r.link,
         r.ext_link, r.contact, coalesce(r.fit, 'weak'), r.fit_why, coalesce(r.status, 'new'), coalesce(r.added, current_date),
         coalesce(r.work_type, 'unknown'), coalesce(r.highlight, false), coalesce(r.tags, '{}')
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
