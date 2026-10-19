-- 0022_dashboard_todo_steps.sql
--
-- Dashboard to-dos get steps (2026-10-19): one to-do with a checklist under it, so a batch
-- of like tasks (e.g. 12 "Send Local Audit report to …") is one Feed item, not twelve.
--
-- Scope:
--   - dash_todos.steps: a JSON array of {text, href?, done}. '[]' = no steps.
--   - dash_todos_admin / dash_todo_update carry steps (D547: explicit-column RPCs drop a
--     new column unless it is added to each). A patch with 'steps' replaces the whole list.
--   - dash_todo_add is unchanged: add the to-do, then patch its steps.
--   - Nothing else changes.
--
-- Same access pattern as 0017/0021: RLS on, no policies, admin_check()-gated RPCs. Idempotent.

alter table dash_todos add column if not exists steps jsonb not null default '[]'::jsonb
  check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) <= 50);

create or replace function dash_todos_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(json_build_object('id', t.id, 'text', t.text, 'day', t.day, 'position', t.position, 'label', t.label,
           'brand', t.brand, 'steps', t.steps, 'done_at', t.done_at,
           'archived_at', t.archived_at, 'created_at', t.created_at) order by t.position, t.created_at), '[]'::json)
    into result
  from dash_todos t
  where t.archived_at is null or t.archived_at >= now() - interval '30 days';

  return result;
end;
$$;

-- Patch: any of {text, day, position, label, brand, steps, done, archived}. Keys left out are not changed.
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
    steps       = case when p_patch ? 'steps' then coalesce(p_patch -> 'steps', '[]'::jsonb) else steps end,
    done_at     = case when p_patch ? 'done' then (case when (p_patch ->> 'done')::boolean then coalesce(done_at, now()) else null end) else done_at end,
    archived_at = case when p_patch ? 'archived' then (case when (p_patch ->> 'archived')::boolean then coalesce(archived_at, now()) else null end) else archived_at end
  where id = p_id;
  return found;
end;
$$;

grant execute on function dash_todos_admin(text)                    to anon, authenticated;
grant execute on function dash_todo_update(text, uuid, jsonb)       to anon, authenticated;
