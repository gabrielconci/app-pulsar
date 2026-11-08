-- Interests (dance styles). Each user picks up to 8.

create table public.interests (
  id smallint generated always as identity primary key,
  name text not null unique,
  sort_order smallint not null
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest_id smallint not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);

create index profile_interests_interest_idx on public.profile_interests (interest_id);

-- Hard limit of 8 interests per profile, even for direct inserts.
create or replace function private.enforce_max_interests()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Lock the profile row so concurrent inserts can't pass the limit together.
  perform 1 from public.profiles where id = new.profile_id for update;

  if (select count(*) from public.profile_interests where profile_id = new.profile_id) >= 8 then
    raise exception 'max_interests_reached' using
      errcode = 'check_violation',
      hint = 'A profile can have at most 8 interests.';
  end if;
  return new;
end;
$$;

create trigger profile_interests_max
  before insert on public.profile_interests
  for each row execute function private.enforce_max_interests();

-- Replaces all of the current user's interests in one transaction.
create or replace function public.set_my_interests(p_interest_ids smallint[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_ids smallint[] := array(select distinct unnest(coalesce(p_interest_ids, '{}')));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if cardinality(v_ids) > 8 then
    raise exception 'max_interests_reached' using
      errcode = 'check_violation',
      hint = 'A profile can have at most 8 interests.';
  end if;

  delete from public.profile_interests where profile_id = v_uid;

  insert into public.profile_interests (profile_id, interest_id)
  select v_uid, unnest(v_ids);
end;
$$;

-- Row level security
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;

create policy "interests: logged-in users can read"
  on public.interests for select
  to authenticated
  using (true);

create policy "profile_interests: logged-in users can read"
  on public.profile_interests for select
  to authenticated
  using (true);

create policy "profile_interests: owner can add"
  on public.profile_interests for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create policy "profile_interests: owner can remove"
  on public.profile_interests for delete
  to authenticated
  using (profile_id = (select auth.uid()));

revoke all on public.interests, public.profile_interests from anon, authenticated;
grant select on public.interests to authenticated;
grant select, insert, delete on public.profile_interests to authenticated;
grant all on public.interests, public.profile_interests to service_role;

revoke all on function public.set_my_interests(smallint[]) from public, anon;
grant execute on function public.set_my_interests(smallint[]) to authenticated, service_role;

-- Seed: list from the "Seleção de interesses" screen in Figma.
insert into public.interests (name, sort_order) values
  ('Jazz Dance', 1),
  ('Contemporâneo', 2),
  ('Ballet', 3),
  ('Bolero', 4),
  ('Stiletto', 5),
  ('Sapateado', 6),
  ('Pole Dance', 7),
  ('Capoeira', 8),
  ('Salsa', 9),
  ('Axé', 10),
  ('Street Dance', 11),
  ('Jazz Funk', 12),
  ('Dança do Ventre', 13),
  ('Piseiro', 14),
  ('Samba', 15),
  ('Fusion', 16),
  ('Reggaeton', 17),
  ('Dança de Salão', 18),
  ('Country', 19),
  ('Moderno', 20),
  ('Tango', 21),
  ('Funk', 22),
  ('Neo Clássico', 23),
  ('Musical', 24);
