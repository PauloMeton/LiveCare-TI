-- Bloqueia alteracao de colunas que deveriam ser imutaveis depois do INSERT.
-- A RLS de livecare_messages permite UPDATE com (conversa_id = auth.uid() or admin),
-- o que e mais permissivo do que o necessario: a intencao real era so permitir
-- mexer em read_at e deleted_at. Sem este trigger, funcionario poderia reescrever
-- o conteudo de mensagens do admin no proprio chat.

create or replace function public.livecare_messages_update_guard()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.conteudo is distinct from old.conteudo
     or new.autor_id is distinct from old.autor_id
     or new.conversa_id is distinct from old.conversa_id
     or new.created_at is distinct from old.created_at
     or new.attachment_path is distinct from old.attachment_path
     or new.attachment_type is distinct from old.attachment_type
     or new.attachment_size is distinct from old.attachment_size
  then
    raise exception 'Campos imutaveis em livecare_messages (conteudo, autor_id, conversa_id, created_at, attachment_*).'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists livecare_messages_update_guard on public.livecare_messages;
create trigger livecare_messages_update_guard
  before update on public.livecare_messages
  for each row
  execute function public.livecare_messages_update_guard();

comment on function public.livecare_messages_update_guard() is
  'Defesa em profundidade: bloqueia UPDATE em colunas imutaveis. Permite alterar apenas read_at e deleted_at.';
