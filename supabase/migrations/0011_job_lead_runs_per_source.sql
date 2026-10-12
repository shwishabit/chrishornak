-- 0011_job_lead_runs_per_source.sql
--
-- One run row per (date, source), so a Bluesky run and a Hacker News run on the
-- same day are both kept. job_leads_add() upserts on the new key. Idempotent.

alter table job_lead_runs drop constraint if exists job_lead_runs_pkey;
alter table job_lead_runs add constraint job_lead_runs_pkey primary key (run_date, source);

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

  insert into job_leads (id, source, kind, posted, who, handle, ask, link, ext_link, contact, fit, fit_why, status, added)
  select r.id, coalesce(r.source, 'bluesky'), coalesce(r.kind, 'direct'), r.posted, r.who, r.handle, r.ask, r.link,
         r.ext_link, r.contact, coalesce(r.fit, 'weak'), r.fit_why, coalesce(r.status, 'new'), coalesce(r.added, current_date)
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
