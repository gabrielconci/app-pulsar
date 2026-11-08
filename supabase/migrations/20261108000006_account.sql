-- Account helpers: login by username/email/CPF, profile stats, deletion feedback.

-- Finds the account email for a login identifier (email, username or CPF).
-- Only the "login" Edge Function (service_role) may call it, so emails and
-- CPFs are never exposed to the app.
create or replace function public.email_for_identifier(p_identifier text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_identifier text := trim(p_identifier);
  v_digits text;
  v_email text;
begin
  if v_identifier is null or v_identifier = '' then
    return null;
  end if;

  -- Email
  if position('@' in v_identifier) > 1 then
    select u.email into v_email
      from auth.users as u
      where lower(u.email) = lower(v_identifier);
    return v_email;
  end if;

  -- CPF, with or without mask (123.456.789-09)
  v_digits := regexp_replace(v_identifier, '[.\-\s]', '', 'g');
  if v_digits ~ '^\d{11}$' then
    select u.email into v_email
      from public.profile_private as pp
      join auth.users as u on u.id = pp.id
      where pp.cpf = v_digits;
    return v_email;
  end if;

  -- Username, with or without a leading "@"
  select u.email into v_email
    from public.profiles as p
    join auth.users as u on u.id = p.id
    where p.username = lower(ltrim(v_identifier, '@'));
  return v_email;
end;
$$;

revoke all on function public.email_for_identifier(text) from public, anon, authenticated;
grant execute on function public.email_for_identifier(text) to service_role;

-- Numbers for the "Estatísticas" tab. Claps (aclamações), audience and
-- connections don't exist yet, so they return 0 for now.
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
security invoker
set search_path = ''
as $$
  select
    p.created_at,
    (select count(*) from public.posts where author_id = p.id),
    0::bigint,
    0::bigint,
    0::bigint
  from public.profiles as p
  where p.id = p_profile_id;
$$;

revoke all on function public.get_profile_stats(uuid) from public, anon;
grant execute on function public.get_profile_stats(uuid) to authenticated, service_role;

-- Anonymous reasons from the "Deletar conta" screen. Written only by the
-- "delete-account" Edge Function; no user id is kept.
create table public.account_deletion_feedback (
  id bigint generated always as identity primary key,
  reason text not null check (reason in (
    'dados_pessoais',      -- Estou preocupado com meus dados pessoais
    'muitos_emails',       -- Recebo muitos emails da empresa
    'trocar_email',        -- Gostaria de trocar o meu email de acesso
    'outras_contas',       -- Tenho outras contas
    'remover_apps',        -- Quero remover apps do meu aparelho
    'nao_preciso',         -- Não preciso mais do Pulsar
    'outro'                -- Outro
  )),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;
revoke all on public.account_deletion_feedback from anon, authenticated;
grant all on public.account_deletion_feedback to service_role;
