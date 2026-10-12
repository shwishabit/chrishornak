-- 0010_job_leads.sql
--
-- Private job-lead tracker for /audit/admin/jobs (2026-10-12). Hiring posts that
-- Claude finds on Bluesky (and later other sources), with a status + notes Chris
-- edits on the page.
--
-- Scope:
--   - New tables job_leads (one row per post) and job_lead_runs (one row per
--     search run). RLS on, NO policies: nothing is readable or writable through
--     the anon key directly.
--   - All access goes through admin_check() from 0004, so every RPC needs the
--     ADMIN_KEY secret. 0004 must already be applied.
--   - job_leads_add() inserts new rows only (on conflict do nothing), so a
--     re-run never overwrites Chris's status or notes.
--
-- Idempotent.

create table if not exists job_leads (
  id             text primary key check (char_length(id) between 1 and 200),
  source         text not null default 'bluesky',
  kind           text not null default 'direct' check (kind in ('direct', 'board', 'skipped')),
  posted         date,
  who            text not null,
  handle         text,
  ask            text not null,
  link           text not null,
  ext_link       text,
  contact        text,
  fit            text not null default 'weak' check (fit in ('strong', 'good', 'weak', 'skip')),
  fit_why        text,
  status         text not null default 'new'
                 check (status in ('new', 'pitched', 'replied', 'won', 'passed', 'skipped')),
  note           text not null default '' check (char_length(note) <= 4000),
  added          date not null default current_date,
  status_changed date,
  updated_at     timestamptz not null default now()
);

create index if not exists job_leads_posted_idx on job_leads (posted desc);

create table if not exists job_lead_runs (
  run_date    date primary key,
  source      text not null default 'bluesky',
  queries     int not null default 0,
  kept        int not null default 0,
  real_leads  int not null default 0,
  window_days int not null default 21
);

alter table job_leads     enable row level security;
alter table job_lead_runs enable row level security;
-- (No policies → no row is readable or writable via the anon key. RPCs below only.)

-- ── Read: every lead + the run log ─────────────────────────────────────────
create or replace function job_leads_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select json_build_object(
    'rows', (
      select coalesce(json_agg(row_to_json(l) order by l.posted desc nulls last, l.added desc), '[]'::json)
      from job_leads l
    ),
    'runs', (
      select coalesce(json_agg(row_to_json(r) order by r.run_date desc), '[]'::json)
      from job_lead_runs r
    )
  ) into result;

  return result;
end;
$$;

-- ── Edit: status and/or note on one lead (null = leave as is) ──────────────
create or replace function job_lead_update(
  p_secret text,
  p_id     text,
  p_status text default null,
  p_note   text default null
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  update job_leads set
    status         = coalesce(p_status, status),
    status_changed = case when p_status is not null and p_status <> status then current_date else status_changed end,
    note           = coalesce(p_note, note),
    updated_at     = now()
  where id = p_id;

  return found;
end;
$$;

-- ── Add: new leads from a search run (existing ids are left untouched) ─────
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
    on conflict (run_date) do update set
      queries = excluded.queries, kept = excluded.kept,
      real_leads = excluded.real_leads, window_days = excluded.window_days;
  end if;

  return n;
end;
$$;

-- Same grant model as 0004/0005: callable with the anon key, gated by the secret.
grant execute on function job_leads_admin(text)                 to anon, authenticated;
grant execute on function job_lead_update(text, text, text, text) to anon, authenticated;
grant execute on function job_leads_add(text, json, json)       to anon, authenticated;
