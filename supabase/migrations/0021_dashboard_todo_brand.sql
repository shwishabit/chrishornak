-- 0021_dashboard_todo_brand.sql
--
-- Dashboard to-dos get a site (2026-10-16): Chris Hornak, Blog Hands or Swift Growth.
-- A to-do in the Feed then shows that brand chip (not "To-do") and its goal follows the brand.
--
-- Scope:
--   - dash_todos.brand ('' = no site yet).
--   - dash_todos_admin / dash_todo_add / dash_todo_update now carry brand. All three name
--     their columns, so a new column must be added to each (D547: an ALTER alone is silently
--     dropped by an explicit-column RPC).
--   - dash_todo_add gets a 4th argument; the 3-argument version is dropped so there is one.
--   - Nothing else changes.
--
-- Same access pattern as 0017: RLS on, no policies, admin_check()-gated RPCs. Idempotent.

alter table dash_todos add column if not exists brand text not null default ''
  check (brand in ('', 'Chris Hornak', 'Blog Hands', 'Swift Growth'));

create or replace function dash_todos_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(json_build_object('id', t.id, 'text', t.text, 'day', t.day, 'position', t.position, 'label', t.label,
           'brand', t.brand, 'done_at', t.done_at,
           'archived_at', t.archived_at, 'created_at', t.created_at) order by t.position, t.created_at), '[]'::json)
    into result
  from dash_todos t
  where t.archived_at is null or t.archived_at >= now() - interval '30 days';

  return result;
end;
$$;

drop function if exists dash_todo_add(text, text, text);
create or replace function dash_todo_add(p_secret text, p_text text, p_label text default '', p_brand text default '')
returns json language plpgsql security definer set search_path = public as $$
declare row dash_todos;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  delete from dash_todos where archived_at < now() - interval '90 days';
  insert into dash_todos (text, position, label, brand)
  values (left(btrim(p_text), 300), coalesce((select max(position) from dash_todos), 0) + 1, coalesce(p_label, ''), coalesce(p_brand, ''))
  returning * into row;
  return json_build_object('id', row.id, 'text', row.text, 'day', row.day, 'position', row.position, 'label', row.label,
                           'brand', row.brand, 'done_at', row.done_at,
                           'archived_at', row.archived_at, 'created_at', row.created_at);
end;
$$;

-- Patch: any of {text, day, position, label, brand, done, archived}. Keys left out are not changed.
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
    brand       = case when p_patch ? 'brand' then coalesce(p_patch ->> 'brand', '') else brand end,
    done_at     = case when p_patch ? 'done' then (case when (p_patch ->> 'done')::boolean then coalesce(done_at, now()) else null end) else done_at end,
    archived_at = case when p_patch ? 'archived' then (case when (p_patch ->> 'archived')::boolean then coalesce(archived_at, now()) else null end) else archived_at end
  where id = p_id;
  return found;
end;
$$;

grant execute on function dash_todos_admin(text)                    to anon, authenticated;
grant execute on function dash_todo_add(text, text, text, text)     to anon, authenticated;
grant execute on function dash_todo_update(text, uuid, jsonb)       to anon, authenticated;
