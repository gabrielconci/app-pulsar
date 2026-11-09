-- Post interactions: claps (aclamações), views (público), comments and
-- comment likes. Also: caption on every post type, video cover images and
-- the feed / single post / comments readers used by the app.

-- Video cover image, uploaded by the app next to the video.
alter table public.post_media
  add column thumbnail_path text unique,
  add constraint thumbnail_only_for_video check (thumbnail_path is null or kind = 'video');

-- Title / subtitle / body belong to projects only.
alter table public.posts
  add constraint project_fields_only_on_projects check (
    type = 'project' or (title is null and subtitle is null and body is null)
  );

-- Same as before, plus: caption on every type (it is the text shown in the
-- "Descrição" sheet) and an optional "thumbnail_path" for video items.
create or replace function public.create_post(
  p_type public.post_type,
  p_media jsonb,
  p_title text default null,
  p_subtitle text default null,
  p_body text default null,
  p_caption text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_post_id uuid;
  v_count int;
  v_videos int;
  v_item jsonb;
  v_path text;
  v_thumb text;
  v_position int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_media is null or jsonb_typeof(p_media) <> 'array' then
    raise exception 'invalid_media' using errcode = '22023', hint = 'p_media must be a JSON array.';
  end if;

  v_count := jsonb_array_length(p_media);
  select count(*) filter (where e ->> 'kind' = 'video')
    into v_videos
    from jsonb_array_elements(p_media) as e;

  case p_type
    when 'video' then
      if v_count <> 1 or v_videos <> 1 then
        raise exception 'invalid_media' using errcode = '22023', hint = 'A video post needs exactly 1 video.';
      end if;
    when 'photo' then
      if v_count <> 1 or v_videos <> 0 then
        raise exception 'invalid_media' using errcode = '22023', hint = 'A photo post needs exactly 1 image.';
      end if;
    when 'carousel' then
      if v_count not between 2 and 10 then
        raise exception 'invalid_media' using errcode = '22023', hint = 'A carousel needs 2 to 10 items.';
      end if;
    when 'project' then
      if v_count not between 1 and 3 or v_videos <> 0 then
        raise exception 'invalid_media' using errcode = '22023', hint = 'A project needs 1 to 3 images.';
      end if;
      if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
        raise exception 'invalid_project' using errcode = '22023', hint = 'A project needs a title and a body.';
      end if;
  end case;

  insert into public.posts (author_id, type, title, subtitle, body, caption)
  values (
    v_uid,
    p_type,
    case when p_type = 'project' then nullif(trim(p_title), '') end,
    case when p_type = 'project' then nullif(trim(p_subtitle), '') end,
    case when p_type = 'project' then nullif(trim(p_body), '') end,
    nullif(trim(p_caption), '')
  )
  returning id into v_post_id;

  for v_item in select value from jsonb_array_elements(p_media) loop
    v_path := v_item ->> 'path';
    v_thumb := v_item ->> 'thumbnail_path';

    -- Only files the user uploaded to their own folder.
    if not private.is_own_upload(v_path, v_uid) then
      raise exception 'invalid_media_path' using errcode = '42501';
    end if;
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'post-media' and name = v_path and owner_id = v_uid::text
    ) then
      raise exception 'media_not_uploaded' using errcode = '22023', hint = v_path;
    end if;
    if v_thumb is not null then
      if not private.is_own_upload(v_thumb, v_uid) then
        raise exception 'invalid_media_path' using errcode = '42501';
      end if;
      if not exists (
        select 1 from storage.objects
        where bucket_id = 'post-media' and name = v_thumb and owner_id = v_uid::text
      ) then
        raise exception 'media_not_uploaded' using errcode = '22023', hint = v_thumb;
      end if;
    end if;

    insert into public.post_media (post_id, position, kind, storage_path, thumbnail_path, width, height, duration_ms)
    values (
      v_post_id,
      v_position,
      (v_item ->> 'kind')::public.media_kind,
      v_path,
      v_thumb,
      (v_item ->> 'width')::int,
      (v_item ->> 'height')::int,
      (v_item ->> 'duration_ms')::int
    );
    v_position := v_position + 1;
  end loop;

  return v_post_id;
end;
$$;

create or replace function private.is_own_upload(p_path text, p_uid uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_path is not null and split_part(p_path, '/', 1) = p_uid::text and p_path not like '%..%'
$$;

-- Claps (aclamações): one per user per post, like a "like".
create table public.post_claps (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_claps_user_idx on public.post_claps (user_id);

-- Views (público): unique people who opened the post. The author doesn't count.
-- Written only through record_post_view(); never readable row by row.
create table public.post_views (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_views_user_idx on public.post_views (user_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create table public.comment_likes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index comment_likes_user_idx on public.comment_likes (user_id);

-- Row level security
alter table public.post_claps enable row level security;
alter table public.post_views enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

create policy "post_claps: logged-in users can read"
  on public.post_claps for select to authenticated using (true);
create policy "post_claps: users clap as themselves"
  on public.post_claps for insert to authenticated with check (user_id = (select auth.uid()));
create policy "post_claps: users remove their own claps"
  on public.post_claps for delete to authenticated using (user_id = (select auth.uid()));

create policy "comments: logged-in users can read"
  on public.comments for select to authenticated using (true);
create policy "comments: users comment as themselves"
  on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
create policy "comments: author deletes own comment"
  on public.comments for delete to authenticated using (author_id = (select auth.uid()));

create policy "comment_likes: logged-in users can read"
  on public.comment_likes for select to authenticated using (true);
create policy "comment_likes: users like as themselves"
  on public.comment_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "comment_likes: users remove their own likes"
  on public.comment_likes for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.post_claps, public.post_views, public.comments, public.comment_likes from anon, authenticated;
grant select, delete on public.post_claps, public.comments, public.comment_likes to authenticated;
grant insert (post_id) on public.post_claps to authenticated;
grant insert (post_id, body) on public.comments to authenticated;
grant insert (comment_id) on public.comment_likes to authenticated;
grant all on public.post_claps, public.post_views, public.comments, public.comment_likes to service_role;

-- Counts the current user as audience of a post (once; authors don't count).
create or replace function public.record_post_view(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  insert into public.post_views (post_id, user_id)
  select p.id, v_uid from public.posts as p
  where p.id = p_post_id and p.author_id <> v_uid
  on conflict do nothing;
end;
$$;

-- Posts with author, media and counts. Used by the Home feed (newest first,
-- paged by the (created_at, id) of the last post), the open post (p_post_id)
-- and a profile's posts (p_author_id).
create or replace function public.get_posts(
  p_limit int default 10,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_post_id uuid default null,
  p_author_id uuid default null
)
returns table (
  id uuid,
  author_id uuid,
  type public.post_type,
  title text,
  subtitle text,
  body text,
  caption text,
  created_at timestamptz,
  author_username text,
  author_full_name text,
  author_avatar_path text,
  media jsonb,
  claps_count bigint,
  views_count bigint,
  comments_count bigint,
  clapped_by_me boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  return query
  select
    p.id, p.author_id, p.type, p.title, p.subtitle, p.body, p.caption, p.created_at,
    a.username, a.full_name, a.avatar_path,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', m.position, 'kind', m.kind, 'path', m.storage_path,
        'thumbnail_path', m.thumbnail_path, 'width', m.width, 'height', m.height,
        'duration_ms', m.duration_ms
      ) order by m.position)
      from public.post_media as m where m.post_id = p.id
    ), '[]'::jsonb),
    (select count(*) from public.post_claps as c where c.post_id = p.id),
    (select count(*) from public.post_views as v where v.post_id = p.id),
    (select count(*) from public.comments as cm where cm.post_id = p.id),
    exists (select 1 from public.post_claps as c where c.post_id = p.id and c.user_id = v_uid)
  from public.posts as p
  join public.profiles as a on a.id = p.author_id
  where (p_post_id is null or p.id = p_post_id)
    and (p_author_id is null or p.author_id = p_author_id)
    and (
      p_before_created_at is null
      or (p.created_at, p.id) < (p_before_created_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

-- Comments of a post, oldest first, with author and likes.
create or replace function public.get_comments(p_post_id uuid)
returns table (
  id uuid,
  post_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  author_username text,
  author_full_name text,
  author_avatar_path text,
  likes_count bigint,
  liked_by_me boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id, c.post_id, c.author_id, c.body, c.created_at,
    a.username, a.full_name, a.avatar_path,
    (select count(*) from public.comment_likes as l where l.comment_id = c.id),
    exists (select 1 from public.comment_likes as l where l.comment_id = c.id and l.user_id = (select auth.uid()))
  from public.comments as c
  join public.profiles as a on a.id = c.author_id
  where c.post_id = p_post_id
  order by c.created_at, c.id
  limit 500;
$$;

-- Stats now count claps received and unique audience across the author's posts.
create or replace function public.get_profile_stats(p_profile_id uuid)
returns table (
  member_since timestamptz,
  posts_count bigint,
  audience_count bigint,
  claps_count bigint,
  connections_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.created_at,
    (select count(*) from public.posts where author_id = p.id),
    (select count(distinct v.user_id) from public.post_views as v
       join public.posts as po on po.id = v.post_id where po.author_id = p.id),
    (select count(*) from public.post_claps as c
       join public.posts as po on po.id = c.post_id where po.author_id = p.id),
    0::bigint
  from public.profiles as p
  where p.id = p_profile_id and (select auth.uid()) is not null;
$$;

revoke all on function public.record_post_view(uuid) from public, anon;
revoke all on function public.get_posts(int, timestamptz, uuid, uuid, uuid) from public, anon;
revoke all on function public.get_comments(uuid) from public, anon;
revoke all on function public.get_profile_stats(uuid) from public, anon;
grant execute on function public.record_post_view(uuid) to authenticated, service_role;
grant execute on function public.get_posts(int, timestamptz, uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.get_comments(uuid) to authenticated, service_role;
grant execute on function public.get_profile_stats(uuid) to authenticated, service_role;
