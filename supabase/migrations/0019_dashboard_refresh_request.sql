-- 0019_dashboard_refresh_request.sql
--
-- "Refresh now" on the dashboard (2026-10-15). The site can't run the PC jobs, so the button
-- leaves a request; dash-refresh.ps1 (Task Scheduler, now every 5 minutes) takes it and runs a
-- full refresh. Stored as dash_state key 'refresh_request' (dash_state_admin skips nothing, so
-- the page can see a request is pending).
--
-- dash_refresh_request(p_secret, p_take):
--   p_take = false → record a request (now) and return it.
--   p_take = true  → return the pending request time (or null) and clear it.
-- admin_check()-gated like every other dashboard RPC. Idempotent.

create or replace function dash_refresh_request(p_secret text, p_take boolean default false)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare at timestamptz;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_take then
    delete from dash_state where key = 'refresh_request' returning updated_at into at;
    return at;
  end if;

  insert into dash_state (key, data, updated_at) values ('refresh_request', '{}'::jsonb, now())
  on conflict (key) do update set updated_at = now()
  returning updated_at into at;
  return at;
end;
$$;

grant execute on function dash_refresh_request(text, boolean) to anon, authenticated;
