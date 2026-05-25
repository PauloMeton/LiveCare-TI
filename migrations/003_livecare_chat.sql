-- =============================================================
-- LiveCare TI — Chat de suporte
-- Aplique este SQL no Supabase Dashboard → SQL Editor → projeto Avaliação
-- =============================================================

-- 1) Tabela de mensagens
-- conversa_id = id do funcionário (uma conversa por funcionário com a "TI")
-- Qualquer admin pode escrever em qualquer conversa.
create table if not exists public.livecare_messages (
  id          bigint generated always as identity primary key,
  conversa_id uuid not null references auth.users(id) on delete cascade,
  autor_id    uuid not null references auth.users(id) on delete cascade,
  conteudo    text not null check (length(trim(conteudo)) > 0 and length(conteudo) <= 4000),
  read_at     timestamptz,           -- quando a outra parte leu
  deleted_at  timestamptz,           -- soft delete pelo autor
  created_at  timestamptz not null default now()
);

create index if not exists livecare_messages_conversa_idx
  on public.livecare_messages(conversa_id, created_at);

create index if not exists livecare_messages_unread_idx
  on public.livecare_messages(conversa_id) where read_at is null and deleted_at is null;

-- 2) RLS
alter table public.livecare_messages enable row level security;

-- SELECT: dono da conversa (funcionário) ou qualquer admin
drop policy if exists livecare_messages_select on public.livecare_messages;
create policy livecare_messages_select on public.livecare_messages
  for select using (
    conversa_id = auth.uid() or public.livecare_is_admin()
  );

-- INSERT:
--   - funcionário insere SÓ na sua própria conversa (conversa_id = autor_id = auth.uid())
--   - admin pode inserir em qualquer conversa, mas autor_id tem que ser o admin
drop policy if exists livecare_messages_insert on public.livecare_messages;
create policy livecare_messages_insert on public.livecare_messages
  for insert with check (
    autor_id = auth.uid() and (
      (conversa_id = auth.uid())
      or public.livecare_is_admin()
    )
  );

-- UPDATE:
--   - permitido pra:
--     a) marcar read_at em mensagens que NÃO sou eu o autor mas vejo a conversa
--     b) soft-delete (deleted_at) das minhas próprias mensagens
drop policy if exists livecare_messages_update on public.livecare_messages;
create policy livecare_messages_update on public.livecare_messages
  for update using (
    -- pode dar update se vê a conversa
    conversa_id = auth.uid() or public.livecare_is_admin()
  )
  with check (
    -- mesmas regras de "ver a conversa"
    conversa_id = auth.uid() or public.livecare_is_admin()
  );

-- DELETE: bloqueado (sem policy = bloqueado). Usar soft delete via UPDATE.

-- 3) Adicionar à publicação de realtime do Supabase
-- (Tem que estar publicada pro client.subscribe() receber os eventos)
alter publication supabase_realtime add table public.livecare_messages;

-- 4) Função helper para o admin: lista conversas com última mensagem e contagem de não lidas
-- Retorna uma linha por funcionário que tem ao menos uma mensagem
create or replace function public.livecare_list_conversas()
returns table (
  conversa_id    uuid,
  nome           text,
  cargo          text,
  last_at        timestamptz,
  last_conteudo  text,
  last_autor_id  uuid,
  nao_lidas      bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with msgs as (
    select m.conversa_id, m.created_at, m.conteudo, m.autor_id, m.read_at, m.deleted_at,
           row_number() over (partition by m.conversa_id order by m.created_at desc) as rn
    from public.livecare_messages m
    where m.deleted_at is null
  )
  select
    m.conversa_id,
    p.nome,
    p.cargo,
    m.created_at  as last_at,
    m.conteudo    as last_conteudo,
    m.autor_id    as last_autor_id,
    (select count(*) from public.livecare_messages mm
      where mm.conversa_id = m.conversa_id
        and mm.deleted_at is null
        and mm.read_at is null
        and mm.autor_id <> auth.uid()) as nao_lidas
  from msgs m
  join public.profiles p on p.id = m.conversa_id
  where m.rn = 1 and public.livecare_is_admin()
  order by m.created_at desc;
$$;

revoke execute on function public.livecare_list_conversas() from anon, public;
grant  execute on function public.livecare_list_conversas() to authenticated;

comment on table public.livecare_messages is 'Mensagens do chat funcionário ↔ suporte TI. Uma conversa = um funcionário (conversa_id).';
