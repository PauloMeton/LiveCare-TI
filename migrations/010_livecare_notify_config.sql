-- pg_net e tabela de config interna (secrets pra trigger de e-mail)

create extension if not exists pg_net with schema extensions;

create table if not exists public.livecare_internal_config (
  key   text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on public.livecare_internal_config from anon, authenticated;
alter table public.livecare_internal_config enable row level security;
-- Sem policy -> ninguem via PostgREST le/escreve

create or replace function public.livecare_get_config(p_key text)
returns text language sql security definer set search_path = public
as $$
  select value from public.livecare_internal_config where key = p_key;
$$;

revoke all on function public.livecare_get_config(text) from public, anon, authenticated;

-- Insere secret aleatorio + URL placeholder (mude pra URL real do app)
insert into public.livecare_internal_config (key, value)
values
  ('livecare_notify_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  ('livecare_app_url', 'https://livecare-ti.vercel.app')
on conflict (key) do nothing;
