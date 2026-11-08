-- Base: private schema and shared helper functions.

-- Schema for internal helpers. Not exposed by the Data API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Keeps updated_at current on every update.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Validates a Brazilian CPF (11 digits, no mask) using its two check digits.
create or replace function private.is_valid_cpf(p_cpf text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  d int[];
  total int;
  remainder int;
begin
  if p_cpf is null or p_cpf !~ '^\d{11}$' then
    return false;
  end if;

  -- All digits equal (e.g. 111.111.111-11) pass the math but are invalid.
  if p_cpf ~ '^(\d)\1{10}$' then
    return false;
  end if;

  d := array(select substr(p_cpf, g.n, 1)::int from generate_series(1, 11) as g(n));

  total := 0;
  for n in 1..9 loop
    total := total + d[n] * (11 - n);
  end loop;
  remainder := (total * 10) % 11;
  if remainder = 10 then remainder := 0; end if;
  if remainder <> d[10] then
    return false;
  end if;

  total := 0;
  for n in 1..10 loop
    total := total + d[n] * (12 - n);
  end loop;
  remainder := (total * 10) % 11;
  if remainder = 10 then remainder := 0; end if;
  return remainder = d[11];
end;
$$;

grant execute on function private.is_valid_cpf(text) to anon, authenticated, service_role;
