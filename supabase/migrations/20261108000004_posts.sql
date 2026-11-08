-- Posts: video (up to 30s), photo, carousel (Instagram style) and project.

create type public.post_type as enum ('video', 'photo', 'carousel', 'project');
create type public.media_kind as enum ('image', 'video');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.post_type not null,
  -- Project fields (title / subtitle / body text).
  title text check (char_length(title) <= 100),
  subtitle text check (char_length(subtitle) <= 200),
  body text check (char_length(body) <= 10000),
  -- Optional caption for video / photo / carousel.
  caption text check (char_length(caption) <= 2200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_needs_title_and_body check (
    type <> 'project' or (title is not null and body is not null)
  )
);

create index posts_feed_idx on public.posts (created_at desc, id desc);
create index posts_author_idx on public.posts (author_id, created_at desc);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function private.set_updated_at();

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  -- Order inside the post (carousel order; 0 = project cover).
  position smallint not null check (position between 0 and 9),
  kind public.media_kind not null,
  -- Path inside the "post-media" bucket: "<user id>/<file name>".
  storage_path text not null unique,
  width int check (width > 0),
  height int check (height > 0),
  duration_ms int check (duration_ms between 1 and 30000),
  created_at timestamptz not null default now(),
  unique (post_id, position),
  constraint video_has_duration check ((kind = 'video') = (duration_ms is not null))
);

-- Creates a post and its media in one step, enforcing the rules per type.
-- Media files must already be uploaded to the "post-media" bucket.
-- p_media: [{ "path": "...", "kind": "image"|"video", "width": 1080,
--             "height": 1920, "duration_ms": 15000 }, ...] in display order.
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
    case when p_type <> 'project' then nullif(trim(p_caption), '') end
  )
  returning id into v_post_id;

  for v_item in select value from jsonb_array_elements(p_media) loop
    v_path := v_item ->> 'path';

    -- Only files the user uploaded to their own folder.
    if v_path is null or split_part(v_path, '/', 1) <> v_uid::text then
      raise exception 'invalid_media_path' using errcode = '42501';
    end if;
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'post-media' and name = v_path and owner_id = v_uid::text
    ) then
      raise exception 'media_not_uploaded' using errcode = '22023', hint = v_path;
    end if;

    insert into public.post_media (post_id, position, kind, storage_path, width, height, duration_ms)
    values (
      v_post_id,
      v_position,
      (v_item ->> 'kind')::public.media_kind,
      v_path,
      (v_item ->> 'width')::int,
      (v_item ->> 'height')::int,
      (v_item ->> 'duration_ms')::int
    );
    v_position := v_position + 1;
  end loop;

  return v_post_id;
end;
$$;

-- Row level security
alter table public.posts enable row level security;
alter table public.post_media enable row level security;

create policy "posts: logged-in users can read"
  on public.posts for select
  to authenticated
  using (true);

create policy "posts: author can update"
  on public.posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "posts: author can delete"
  on public.posts for delete
  to authenticated
  using (author_id = (select auth.uid()));

create policy "post_media: logged-in users can read"
  on public.post_media for select
  to authenticated
  using (true);

-- Posts are created only through create_post(), so no insert grants.
revoke all on public.posts, public.post_media from anon, authenticated;
grant select, delete on public.posts to authenticated;
grant update (title, subtitle, body, caption) on public.posts to authenticated;
grant select on public.post_media to authenticated;
grant all on public.posts, public.post_media to service_role;

revoke all on function public.create_post(public.post_type, jsonb, text, text, text, text) from public, anon;
grant execute on function public.create_post(public.post_type, jsonb, text, text, text, text) to authenticated, service_role;
