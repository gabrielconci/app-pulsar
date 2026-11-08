-- Profiles: public profile data + private data (CPF).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Lowercase letters, digits, "." and "_"; at least one letter so it never
  -- looks like a CPF at login.
  username text not null unique
    check (username ~ '^[a-z0-9._]{3,30}$' and username ~ '[a-z]'),
  full_name text check (char_length(full_name) between 1 and 100),
  birth_date date check (birth_date >= date '1900-01-01'),
  bio text check (char_length(bio) <= 500),
  gender text check (char_length(gender) between 1 and 40),
  -- Path inside the "avatars" bucket, e.g. "<user id>/avatar-123.jpg".
  avatar_path text,
  -- Set when the user finishes "Criar perfil".
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Sensitive data (LGPD): only the owner can read it.
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  -- Empty until the user fills "Criar perfil".
  cpf text unique check (cpf is null or private.is_valid_cpf(cpf)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profile_private_set_updated_at
  before update on public.profile_private
  for each row execute function private.set_updated_at();

-- Creates the profile when a user signs up.
-- The app sends the username in signUp options: { data: { username } }.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(trim(new.raw_user_meta_data ->> 'username')));

  insert into public.profile_private (id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Lets the sign-up screen check a username before submitting.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where username = lower(trim(p_username))
  );
$$;

-- Lets "Criar perfil" warn that a CPF is already in use.
create or replace function public.is_cpf_available(p_cpf text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profile_private
    where cpf = regexp_replace(p_cpf, '\D', '', 'g')
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

-- Row level security
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy "profiles: logged-in users can read"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: owner can update"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profile_private: owner can read"
  on public.profile_private for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profile_private: owner can update"
  on public.profile_private for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Explicit grants. Rows are created by the trigger and removed by account
-- deletion, so users get no insert/delete.
revoke all on public.profiles, public.profile_private from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, full_name, birth_date, bio, gender, avatar_path, onboarding_completed_at)
  on public.profiles to authenticated;
grant select, update (cpf) on public.profile_private to authenticated;
grant all on public.profiles, public.profile_private to service_role;

revoke all on function public.is_username_available(text) from public;
revoke all on function public.is_cpf_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated, service_role;
grant execute on function public.is_cpf_available(text) to authenticated, service_role;
revoke all on function private.handle_new_user() from public, anon, authenticated;
