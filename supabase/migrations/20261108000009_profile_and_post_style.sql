-- Title and dance style (interest) on every post type, a filter for the
-- profile tabs (Vídeos / Projetos) and an optional public contact email.

-- Title is allowed on every post; subtitle and body stay project-only.
alter table public.posts
  drop constraint project_fields_only_on_projects,
  add constraint project_text_only_on_projects check (
    type = 'project' or (subtitle is null and body is null)
  ),
  add column interest_id smallint references public.interests (id) on delete set null;


revoke update on public.posts from authenticated;
grant update (title, subtitle, body, caption, interest_id) on public.posts to authenticated;

-- create_post gets the style; the signature changes, so replace it.
drop function public.create_post(public.post_type, jsonb, text, text, text, text);

create or replace function public.create_post(
  p_type public.post_type,
  p_media jsonb,
  p_title text default null,
  p_subtitle text default null,
  p_body text default null,
  p_caption text default null,
  p_interest_id smallint default null
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

  insert into public.posts (author_id, type, title, subtitle, body, caption, interest_id)
  values (
    v_uid,
    p_type,
    nullif(trim(p_title), ''),
    case when p_type = 'project' then nullif(trim(p_subtitle), '') end,
    case when p_type = 'project' then nullif(trim(p_body), '') end,
    nullif(trim(p_caption), ''),
    p_interest_id
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

revoke all on function public.create_post(public.post_type, jsonb, text, text, text, text, smallint) from public, anon;
grant execute on function public.create_post(public.post_type, jsonb, text, text, text, text, smallint) to authenticated, service_role;

-- get_posts returns the style name and can filter projects / non-projects.
drop function public.get_posts(int, timestamptz, uuid, uuid, uuid);

create or replace function public.get_posts(
  p_limit int default 10,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null,
  p_post_id uuid default null,
  p_author_id uuid default null,
  -- true: only projects; false: everything but projects; null: all.
  p_projects boolean default null
)
returns table (
  id uuid,
  author_id uuid,
  type public.post_type,
  title text,
  subtitle text,
  body text,
  caption text,
  interest_id smallint,
  interest_name text,
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
    p.id, p.author_id, p.type, p.title, p.subtitle, p.body, p.caption, p.interest_id, i.name, p.created_at,
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
  left join public.interests as i on i.id = p.interest_id
  where (p_post_id is null or p.id = p_post_id)
    and (p_author_id is null or p.author_id = p_author_id)
    and (p_projects is null or (p.type = 'project') = p_projects)
    and (
      p_before_created_at is null
      or (p.created_at, p.id) < (p_before_created_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by p.created_at desc, p.id desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
end;
$$;

revoke all on function public.get_posts(int, timestamptz, uuid, uuid, uuid, boolean) from public, anon;
grant execute on function public.get_posts(int, timestamptz, uuid, uuid, uuid, boolean) to authenticated, service_role;

-- Contact email shown on the profile (optional; the login email stays private).
alter table public.profiles
  add column contact_email text check (
    contact_email is null
    or (char_length(contact_email) <= 254 and contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  );

grant update (contact_email) on public.profiles to authenticated;
