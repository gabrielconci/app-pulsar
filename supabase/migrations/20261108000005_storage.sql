-- Storage buckets for avatars and post media.
-- Files live in a folder named after the user id: "<user id>/<file name>".
-- Buckets are public for reading (public portfolio); only the owner writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  -- 50 MB is the per-file cap on Supabase's free plan. Videos are compressed
  -- in the app before upload.
  ('post-media', 'post-media', true, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'])
on conflict (id) do nothing;

create policy "media: owner can read own files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "media: owner can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "media: owner can replace own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "media: owner can delete own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
