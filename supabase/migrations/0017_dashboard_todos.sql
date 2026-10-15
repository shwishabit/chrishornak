-- 0017_dashboard_todos.sql
--
-- Dashboard to-do list (/audit/admin/dashboard, 2026-10-15). A list Chris types
-- into by hand, in the right column beside the Feed. Items stay until Chris acts
-- on them: tick, edit, move to another day, archive, or delete.
--
-- Scope:
--   - dash_todos: one row per to-do. day = the day it is for (New York date;
--     items for a past day carry forward). done_at = ticked. archived_at = put away.
--     Archived rows older than 90 days are removed when a new to-do is added.
--   - Four admin_check()-gated RPCs: list, add, update (patch), delete.
--   - Nothing else changes.
--
-- position = Chris's drag order (lower first); new items go to the bottom.
-- label = a Feed group (sales, jobs, marketing, client, other, email); a labeled to-do also
-- shows in the Feed under that group (0017d).
--
-- Applied live in three steps on 2026-10-15 (0017_dashboard_todos,
-- 0017b_dashboard_todos_day_archive, 0017c_dashboard_todos_position, 0017d_dashboard_todos_label); this file
-- is the combined final form.
-- Same access pattern as 0010/0014/0015/0016: RLS on with no policies, every
-- read/write through a security definer RPC. Idempotent.

create table if not exists dash_todos (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (char_length(text) between 1 and 300),
  done_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table dash_todos add column if not exists day date not null default ((now() at time zone 'America/New_York')::date);
alter table dash_todos add column if not exists archived_at timestamptz;
alter table dash_todos add column if not exists position double precision not null default extract(epoch from clock_timestamp());
alter table dash_todos add column if not exists label text not null default ''
  check (label in ('', 'email', 'sales', 'jobs', 'marketing', 'client', 'other'));

alter table dash_todos enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

-- Replaced by dash_todo_update.
drop function if exists dash_todo_set(text, uuid, boolean);

-- Everything not archived, plus what was archived in the last 30 days.
create or replace function dash_todos_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(json_build_object('id', t.id, 'text', t.text, 'day', t.day, 'position', t.position, 'label', t.label,
           'done_at', t.done_at,
           'archived_at', t.archived_at, 'created_at', t.created_at) order by t.position, t.created_at), '[]'::json)
    into result
  from dash_todos t
  where t.archived_at is null or t.archived_at >= now() - interval '30 days';

  return result;
end;
$$;

drop function if exists dash_todo_add(text, text);
create or replace function dash_todo_add(p_secret text, p_text text, p_label text default '')
returns json language plpgsql security definer set search_path = public as $$
declare row dash_todos;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  delete from dash_todos where archived_at < now() - interval '90 days';
  insert into dash_todos (text, position, label)
  values (left(btrim(p_text), 300), coalesce((select max(position) from dash_todos), 0) + 1, coalesce(p_label, ''))
  returning * into row;
  return json_build_object('id', row.id, 'text', row.text, 'day', row.day, 'position', row.position, 'label', row.label,
                           'done_at', row.done_at,
                           'archived_at', row.archived_at, 'created_at', row.created_at);
end;
$$;

-- Patch: any of {text, day, position, label, done, archived}. Keys left out are not changed.
create or replace function dash_todo_update(p_secret text, p_id uuid, p_patch jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  update dash_todos set
    text        = case when p_patch ? 'text' then left(btrim(p_patch ->> 'text'), 300) else text end,
    day         = case when p_patch ? 'day' then (p_patch ->> 'day')::date else day end,
    position    = case when p_patch ? 'position' then (p_patch ->> 'position')::double precision else position end,
    label       = case when p_patch ? 'label' then coalesce(p_patch ->> 'label', '') else label end,
    done_at     = case when p_patch ? 'done' then (case when (p_patch ->> 'done')::boolean then coalesce(done_at, now()) else null end) else done_at end,
    archived_at = case when p_patch ? 'archived' then (case when (p_patch ->> 'archived')::boolean then coalesce(archived_at, now()) else null end) else archived_at end
  where id = p_id;
  return found;
end;
$$;

create or replace function dash_todo_delete(p_secret text, p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  delete from dash_todos where id = p_id;
  return found;
end;
$$;

grant execute on function dash_todos_admin(text)                to anon, authenticated;
grant execute on function dash_todo_add(text, text, text)       to anon, authenticated;
grant execute on function dash_todo_update(text, uuid, jsonb)   to anon, authenticated;
grant execute on function dash_todo_delete(text, uuid)          to anon, authenticated;
