-- 1) Amplia o check de status para incluir 'cancelado' e 'rejeitado'
alter table public.livecare_tickets drop constraint if exists livecare_tickets_status_check;
alter table public.livecare_tickets add constraint livecare_tickets_status_check
  check (status in ('aberto', 'andamento', 'concluido', 'cancelado', 'rejeitado'));

-- 2) Tabela de eventos do chamado (historico auditavel)
create table if not exists public.livecare_ticket_events (
  id bigint generated always as identity primary key,
  ticket_id uuid not null references public.livecare_tickets(id) on delete cascade,
  ator_id uuid references auth.users(id) on delete set null,
  tipo text not null check (tipo in (
    'aberto','editado','andamento','concluido','reaberto','rejeitado','cancelado','comentario'
  )),
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists livecare_ticket_events_ticket_idx
  on public.livecare_ticket_events(ticket_id, created_at);

-- 3) RLS: quem pode SELECT no ticket pode SELECT nos eventos dele
alter table public.livecare_ticket_events enable row level security;

drop policy if exists livecare_ticket_events_select on public.livecare_ticket_events;
create policy livecare_ticket_events_select on public.livecare_ticket_events
  for select using (
    exists (
      select 1 from public.livecare_tickets t
      where t.id = ticket_id
        and t.deleted_at is null
        and (t.autor_id = auth.uid() or public.livecare_is_admin())
    )
  );

drop policy if exists livecare_ticket_events_insert on public.livecare_ticket_events;
create policy livecare_ticket_events_insert on public.livecare_ticket_events
  for insert with check (
    auth.uid() is not null
    and ator_id = auth.uid()
    and exists (
      select 1 from public.livecare_tickets t
      where t.id = ticket_id
        and (t.autor_id = auth.uid() or public.livecare_is_admin())
    )
  );

-- 4) Sem UPDATE/DELETE policy -> auditoria imutavel
comment on table public.livecare_ticket_events is 'Historico imutavel de eventos do chamado';
