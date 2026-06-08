-- Garante que todas as 5 tabelas LiveCare estao na publication supabase_realtime.
-- Algumas operacoes ALTER TABLE removem silenciosamente a tabela da publication;
-- esta migration eh idempotente e pode ser rodada quantas vezes for necessario.

do $$
declare
  tables text[] := array[
    'livecare_tickets',
    'livecare_ticket_events',
    'livecare_messages',
    'livecare_ticket_attachments',
    'profiles'
  ];
  t text;
begin
  foreach t in array tables loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- ja estava na publication
    end;
  end loop;
end$$;
