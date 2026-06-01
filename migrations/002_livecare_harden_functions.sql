-- Corrige search_path mutavel e revoga execute do anon nas funcoes LiveCare
create or replace function public.livecare_tickets_set_updated_at()
returns trigger language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.livecare_is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

revoke execute on function public.livecare_is_admin() from anon, public;
grant  execute on function public.livecare_is_admin() to authenticated;
