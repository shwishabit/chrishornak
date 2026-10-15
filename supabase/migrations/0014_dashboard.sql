-- 0014_dashboard.sql
--
-- Phase 1 of the master dashboard (/audit/admin/dashboard, 2026-10-15):
--   - job_leads gets a lead_type column so the same table holds hiring leads
--     AND Bluesky questions Chris can answer. job_leads_admin/job_leads_add
--     from 0010/0013 already select/insert by row shape, so they need no
--     change — the new column just rides along.
--   - dash_projects: one row per active project, refreshed by a local script
--     that reads each project's agent.md Session State + backlog.md Now
--     (the live site can't read Chris's local files, so a script snapshots
--     them and pushes here, same pattern as the Bluesky job/question finders).
--
-- Idempotent.

alter table job_leads add column if not exists lead_type text not null default 'job';
alter table job_leads drop constraint if exists job_leads_lead_type_check;
alter table job_leads add constraint job_leads_lead_type_check check (lead_type in ('job', 'question'));
create index if not exists job_leads_lead_type_idx on job_leads (lead_type);

create table if not exists dash_projects (
  id          text primary key check (char_length(id) between 1 and 100),
  name        text not null,
  status      text not null default '',
  next_action text not null default '',
  updated_at  timestamptz not null default now()
);

alter table dash_projects enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

create or replace function dash_projects_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(row_to_json(p) order by p.name), '[]'::json) into result
  from dash_projects p;

  return result;
end;
$$;

-- Full refresh: a new push replaces every row's fields (not insert-only like job_leads_add),
-- because project status should always reflect the latest scan, not accumulate.
create or replace function dash_projects_set(
  p_secret text,
  p_rows   json
) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into dash_projects (id, name, status, next_action, updated_at)
  select r.id, r.name, coalesce(r.status, ''), coalesce(r.next_action, ''), now()
  from json_populate_recordset(null::dash_projects, p_rows) r
  on conflict (id) do update set
    name        = excluded.name,
    status      = excluded.status,
    next_action = excluded.next_action,
    updated_at  = now();
  get diagnostics n = row_count;

  return n;
end;
$$;

grant execute on function dash_projects_admin(text)       to anon, authenticated;
grant execute on function dash_projects_set(text, json)   to anon, authenticated;
