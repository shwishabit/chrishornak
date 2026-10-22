-- 0023_client-reviews.sql
--
-- Client review tool (/review/<token>, 2026-10-21). A client opens a secret link,
-- marks each section of the design options (like / dislike / change + a note),
-- adds general comments and presses Finalize, which locks the review and emails
-- Chris. First use: VidaRich (3 home page options).
--
-- Scope:
--   - reviews: one row per review link. token = the secret in the URL.
--     status = 'open' (editable) or 'final' (locked after Finalize).
--   - review_comments: one row per section per review (upsert on save).
--     section_key = the section label in the content file (A1, B3, general…).
--   - Token-gated RPCs for the client: review_get, review_save, review_finalize.
--   - admin_check()-gated RPCs for Chris: review_create, review_reopen, reviews_admin.
--
-- Same access pattern as 0010/0014–0017: RLS on with no policies, every
-- read/write through a security definer RPC. Idempotent.

create table if not exists reviews (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9-]{1,60}$'),
  token        text not null unique check (char_length(token) between 20 and 64),
  title        text not null default '' check (char_length(title) <= 200),
  client_name  text not null default '' check (char_length(client_name) <= 120),
  status       text not null default 'open' check (status in ('open', 'final')),
  finalized_at timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists review_comments (
  review_id   uuid not null references reviews(id) on delete cascade,
  section_key text not null check (section_key ~ '^[A-Za-z0-9_-]{1,40}$'),
  reaction    text not null default '' check (reaction in ('', 'like', 'dislike', 'change')),
  note        text not null default '' check (char_length(note) <= 4000),
  updated_at  timestamptz not null default now(),
  primary key (review_id, section_key)
);

alter table reviews enable row level security;
alter table review_comments enable row level security;
-- No policies → unreadable/unwritable via the anon key directly. RPCs below only.

-- Client: the review and every saved comment, by token.
create or replace function review_get(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare r reviews; result json;
begin
  select * into r from reviews where token = p_token;
  if r.id is null then
    return null;
  end if;

  select json_build_object(
           'slug', r.slug, 'title', r.title, 'client_name', r.client_name,
           'status', r.status, 'finalized_at', r.finalized_at,
           'comments', coalesce((select json_object_agg(c.section_key, json_build_object(
                          'reaction', c.reaction, 'note', c.note, 'updated_at', c.updated_at))
                        from review_comments c where c.review_id = r.id), '{}'::json))
    into result;
  return result;
end;
$$;

-- Client: save one section. Refused once the review is final.
create or replace function review_save(p_token text, p_section text, p_reaction text, p_note text)
returns boolean language plpgsql security definer set search_path = public as $$
declare r reviews;
begin
  select * into r from reviews where token = p_token;
  if r.id is null or r.status <> 'open' then
    return false;
  end if;

  insert into review_comments (review_id, section_key, reaction, note, updated_at)
  values (r.id, p_section, coalesce(p_reaction, ''), left(coalesce(p_note, ''), 4000), now())
  on conflict (review_id, section_key) do update
    set reaction = excluded.reaction, note = excluded.note, updated_at = now();
  return true;
end;
$$;

-- Client: lock the review. Returns the same shape as review_get, or null if already final.
create or replace function review_finalize(p_token text)
returns json language plpgsql security definer set search_path = public as $$
declare r reviews;
begin
  update reviews set status = 'final', finalized_at = now()
  where token = p_token and status = 'open'
  returning * into r;
  if r.id is null then
    return null;
  end if;
  return review_get(p_token);
end;
$$;

-- Admin: create a review link.
create or replace function review_create(p_secret text, p_slug text, p_token text, p_title text, p_client text)
returns json language plpgsql security definer set search_path = public as $$
declare r reviews;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  insert into reviews (slug, token, title, client_name)
  values (p_slug, p_token, coalesce(p_title, ''), coalesce(p_client, ''))
  returning * into r;
  return json_build_object('slug', r.slug, 'token', r.token, 'status', r.status, 'created_at', r.created_at);
end;
$$;

-- Admin: unlock a finalized review so the client can edit again.
create or replace function review_reopen(p_secret text, p_slug text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  update reviews set status = 'open', finalized_at = null where slug = p_slug;
  return found;
end;
$$;

-- Admin: every review with its comment count.
create or replace function reviews_admin(p_secret text)
returns json language plpgsql stable security definer set search_path = public as $$
declare result json;
begin
  if not admin_check(p_secret) then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select coalesce(json_agg(json_build_object(
           'slug', r.slug, 'token', r.token, 'title', r.title, 'client_name', r.client_name,
           'status', r.status, 'finalized_at', r.finalized_at, 'created_at', r.created_at,
           'comment_count', (select count(*) from review_comments c where c.review_id = r.id))
         order by r.created_at desc), '[]'::json)
    into result
  from reviews r;
  return result;
end;
$$;
