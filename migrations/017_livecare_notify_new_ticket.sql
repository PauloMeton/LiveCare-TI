-- ============================================================
-- 017: Push notification pra admins quando chamado novo eh criado
-- ============================================================
-- Trigger AFTER INSERT em livecare_tickets que itera por todos os
-- admins ativos (role='admin' e nao suspensos) e dispara
-- livecare_send_push pra cada um.
--
-- Usa pg_net.http_post via livecare_send_push (async), nao bloqueia
-- o INSERT. Tem EXCEPTION WHEN OTHERS pra qualquer erro na funcao
-- nao impedir o ticket de ser criado.
--
-- Aplicado: 2026-06-09
-- ============================================================

CREATE OR REPLACE FUNCTION public.livecare_notify_new_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
declare
  v_admin_id   uuid;
  v_short_id   text;
  v_classe     text;
  v_titulo     text;
begin
  v_short_id := upper(substr(new.id::text, 1, 8));
  v_classe := case new.classe
    when 'RH'         then 'RH'
    when 'Financeiro' then 'Financeiro'
    when 'Operacoes'  then 'Operações'
    else coalesce(new.classe::text, 'Geral')
  end;
  v_titulo := coalesce(left(new.titulo, 80), '(sem título)');

  for v_admin_id in
    select id from public.profiles
    where role = 'admin' and not coalesce(suspenso, false)
  loop
    -- Nao notifica o proprio criador (caso um admin tenha criado por outro)
    if v_admin_id <> new.autor_id then
      perform public.livecare_send_push(
        v_admin_id,
        format('Novo chamado #%s', v_short_id),
        format('%s · %s', v_classe, v_titulo),
        format('/admin/chamados/%s', new.id::text),
        format('novo-ticket-%s', new.id::text)
      );
    end if;
  end loop;

  return new;
exception when others then
  raise warning 'livecare_notify_new_ticket: % - %', sqlstate, sqlerrm;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS livecare_tickets_notify_new ON public.livecare_tickets;

CREATE TRIGGER livecare_tickets_notify_new
AFTER INSERT ON public.livecare_tickets
FOR EACH ROW
EXECUTE FUNCTION public.livecare_notify_new_ticket();
