-- LiveCare TI: tabela de chamados
-- Reaproveita profiles (id/nome/cargo/role) e unidades. Prefixo livecare_ pra isolar.

create table if not exists public.livecare_tickets (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  classe text not null check (classe in ('RH', 'Financeiro', 'Operacoes')),
  titulo text not null,
  campos jsonb not null default '{}'::jsonb,
  observacao text,
  status text not null default 'aberto' check (status in ('aberto', 'andamento', 'concluido')),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  unidade_id bigint references public.unidades(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  concluido_em timestamptz,
  concluido_por uuid references auth.users(id) on delete set null,
  deleted_at timestamptz
);

create index if not exists livecare_tickets_autor_idx       on public.livecare_tickets(autor_id) where deleted_at is null;
create index if not exists livecare_tickets_status_idx      on public.livecare_tickets(status)   where deleted_at is null;
create index if not exists livecare_tickets_classe_idx      on public.livecare_tickets(classe)   where deleted_at is null;
create index if not exists livecare_tickets_created_at_idx  on public.livecare_tickets(created_at desc);

create or replace function public.livecare_tickets_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists livecare_tickets_set_updated_at on public.livecare_tickets;
create trigger livecare_tickets_set_updated_at
  before update on public.livecare_tickets
  for each row execute function public.livecare_tickets_set_updated_at();

alter table public.livecare_tickets enable row level security;

create or replace function public.livecare_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists livecare_tickets_select on public.livecare_tickets;
create policy livecare_tickets_select on public.livecare_tickets
  for select using (
    deleted_at is null and (autor_id = auth.uid() or public.livecare_is_admin())
  );

drop policy if exists livecare_tickets_insert on public.livecare_tickets;
create policy livecare_tickets_insert on public.livecare_tickets
  for insert with check (auth.uid() is not null and autor_id = auth.uid());

drop policy if exists livecare_tickets_update on public.livecare_tickets;
create policy livecare_tickets_update on public.livecare_tickets
  for update using (
    public.livecare_is_admin() or (autor_id = auth.uid() and status = 'aberto')
  );

drop policy if exists livecare_tickets_delete on public.livecare_tickets;
create policy livecare_tickets_delete on public.livecare_tickets
  for delete using (public.livecare_is_admin());

drop policy if exists livecare_unidades_select_authenticated on public.unidades;
create policy livecare_unidades_select_authenticated on public.unidades
  for select to authenticated using (ativa = true);

drop policy if exists livecare_profiles_select_authenticated on public.profiles;
create policy livecare_profiles_select_authenticated on public.profiles
  for select to authenticated using (true);

comment on table  public.livecare_tickets is 'Chamados internos LiveCare TI — RH/Financeiro/Operacoes';
comment on column public.livecare_tickets.campos is 'Campos especificos do formulario da classe (jsonb)';
