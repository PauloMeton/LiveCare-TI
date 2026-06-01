-- Adiciona livecare_tickets, livecare_ticket_events e profiles ao realtime
do $$
begin
  begin
    alter publication supabase_realtime add table public.livecare_tickets;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.livecare_ticket_events;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
end $$;
